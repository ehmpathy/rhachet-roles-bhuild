import { exec } from 'child_process';
import * as fs from 'fs';
import type { IsoDateStamp } from 'iso-time';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

import { RadioTask } from '../../../domain.objects/RadioTask';
import type { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../domain.objects/RadioTaskStatus';
import { composeTaskIntoGhIssues } from '../../../domain.operations/radio/task/format/composeTaskIntoGhIssues';
import { extractTaskFromGhIssues } from '../../../domain.operations/radio/task/format/extractTaskFromGhIssues';
import type { DaoRadioTask } from './index';

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

/**
 * .what = convert Date to IsoDateStamp
 * .why = format date for RadioTask fields
 */
const toIsoDateStamp = (date: Date): IsoDateStamp => {
  return date.toISOString().split('T')[0] as IsoDateStamp;
};

/**
 * .what = run gh cli command and return stdout
 * .why = wraps exec with proper error handler
 */
const runGhCommand = async (command: string): Promise<string> => {
  const { stdout } = await execAsync(command);
  return stdout.trim();
};

/**
 * .what = dao adapter for github issues channel
 * .why = enables radio task persistence via github issues
 */
export const daoRadioTaskViaGhIssues = (context: {
  repo: RadioTaskRepo;
}): DaoRadioTask => {
  const repoSlug = `${context.repo.owner}/${context.repo.name}`;

  return {
    get: {
      one: {
        byPrimary: async ({ exid }) => {
          try {
            const json = await runGhCommand(
              `gh issue view ${exid} --repo ${repoSlug} --json number,title,body,state,assignees,createdAt,author`,
            );
            const issue = JSON.parse(json) as {
              number: number;
              title: string;
              body: string;
              state: string;
              assignees: { login: string }[];
              createdAt: string;
              author: { login: string };
            };

            // verify this is a radio task
            if (!issue.title.startsWith('🎙️ task -')) return null;

            return extractTaskFromGhIssues({
              issueNumber: String(issue.number),
              title: issue.title,
              body: issue.body,
              state: issue.state.toLowerCase() as 'open' | 'closed',
              assignees: issue.assignees.map((a) => a.login),
              repo: context.repo,
              createdAt: toIsoDateStamp(new Date(issue.createdAt)),
              createdBy: issue.author.login,
            });
          } catch (error: unknown) {
            // exec errors have stderr in the error object
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            const stderr = (error as { stderr?: string })?.stderr ?? '';
            const fullError = `${errorMessage} ${stderr}`;
            if (fullError.includes('Could not resolve')) return null;
            if (fullError.includes('not found')) return null;
            throw error;
          }
        },

        byUnique: async ({ repo, title }) => {
          const searchTitle = `🎙️ task - ${title}`;
          const json = await runGhCommand(
            `gh issue list --repo ${repoSlug} --search "${searchTitle} in:title" --state all --json number,title,body,state,assignees,createdAt,author --limit 10`,
          );
          const issues = JSON.parse(json) as Array<{
            number: number;
            title: string;
            body: string;
            state: string;
            assignees: { login: string }[];
            createdAt: string;
            author: { login: string };
          }>;

          // find exact match
          const match = issues.find((issue) => issue.title === searchTitle);
          if (!match) return null;

          return extractTaskFromGhIssues({
            issueNumber: String(match.number),
            title: match.title,
            body: match.body,
            state: match.state.toLowerCase() as 'open' | 'closed',
            assignees: match.assignees.map((a) => a.login),
            repo,
            createdAt: toIsoDateStamp(new Date(match.createdAt)),
            createdBy: match.author.login,
          });
        },
      },

      all: async ({ repo, filter, limit = 100 }) => {
        const stateFlag =
          filter?.status === RadioTaskStatus.DELIVERED
            ? '--state closed'
            : '--state all';
        const json = await runGhCommand(
          `gh issue list --repo ${repoSlug} --search "🎙️ task - in:title" ${stateFlag} --json number,title,body,state,assignees,createdAt,author --limit ${limit}`,
        );
        const issues = JSON.parse(json) as Array<{
          number: number;
          title: string;
          body: string;
          state: string;
          assignees: { login: string }[];
          createdAt: string;
          author: { login: string };
        }>;

        const tasks = issues
          .filter((issue) => issue.title.startsWith('🎙️ task -'))
          .map((issue) =>
            extractTaskFromGhIssues({
              issueNumber: String(issue.number),
              title: issue.title,
              body: issue.body,
              state: issue.state.toLowerCase() as 'open' | 'closed',
              assignees: issue.assignees.map((a) => a.login),
              repo,
              createdAt: toIsoDateStamp(new Date(issue.createdAt)),
              createdBy: issue.author.login,
            }),
          );

        // filter by status if specified
        if (filter?.status) {
          return tasks.filter((task) => task.status === filter.status);
        }

        return tasks;
      },
    },

    set: {
      findsert: async ({ task }) => {
        // check if task already exists
        const taskFound = await daoRadioTaskViaGhIssues(
          context,
        ).get.one.byUnique({
          repo: task.repo,
          title: task.title,
        });
        if (taskFound) return taskFound;

        // create new issue
        const { title, body } = composeTaskIntoGhIssues({ task });

        // write body to temp file to preserve newlines
        const tempFile = path.join(os.tmpdir(), `radio-task-${Date.now()}.md`);
        await writeFileAsync(tempFile, body);

        try {
          const output = await runGhCommand(
            `gh issue create --repo ${repoSlug} --title "${title.replace(/"/g, '\\"')}" --body-file "${tempFile}"`,
          );

          // parse issue number from URL output (e.g., "https://github.com/owner/repo/issues/123")
          const issueNumberMatch = output.match(/\/issues\/(\d+)/);
          if (!issueNumberMatch)
            throw new Error(`failed to parse issue number from: ${output}`);

          return new RadioTask({
            ...task,
            exid: issueNumberMatch[1]!,
          });
        } finally {
          await unlinkAsync(tempFile).catch(() => {});
        }
      },

      upsert: async ({ task }) => {
        // check if task exists
        const taskFound = task.exid
          ? await daoRadioTaskViaGhIssues(context).get.one.byPrimary({
              exid: task.exid,
            })
          : await daoRadioTaskViaGhIssues(context).get.one.byUnique({
              repo: task.repo,
              title: task.title,
            });

        if (!taskFound) {
          // create new issue
          return daoRadioTaskViaGhIssues(context).set.findsert({ task });
        }

        // update issue
        const { title, body } = composeTaskIntoGhIssues({ task });

        // write body to temp file to preserve newlines
        const tempFile = path.join(
          os.tmpdir(),
          `radio-task-edit-${Date.now()}.md`,
        );
        await writeFileAsync(tempFile, body);

        try {
          await runGhCommand(
            `gh issue edit ${taskFound.exid} --repo ${repoSlug} --title "${title.replace(/"/g, '\\"')}" --body-file "${tempFile}"`,
          );
        } finally {
          await unlinkAsync(tempFile).catch(() => {});
        }

        // add assignee for CLAIMED status
        if (task.status === RadioTaskStatus.CLAIMED && task.claimedBy) {
          await runGhCommand(
            `gh issue edit ${taskFound.exid} --repo ${repoSlug} --add-assignee "${task.claimedBy}"`,
          );
        }

        // close issue for DELIVERED status
        if (task.status === RadioTaskStatus.DELIVERED) {
          await runGhCommand(
            `gh issue close ${taskFound.exid} --repo ${repoSlug}`,
          );
        }

        return new RadioTask({
          ...task,
          exid: taskFound.exid,
        });
      },
    },

    del: async ({ exid }) => {
      await runGhCommand(
        `gh issue close ${exid} --repo ${repoSlug} --reason "not planned"`,
      );
    },
  };
};
