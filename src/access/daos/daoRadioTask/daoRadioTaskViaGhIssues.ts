import { exec } from 'child_process';
import * as fs from 'fs';
import {
  BadRequestError,
  ConstraintError,
  UnexpectedCodePathError,
} from 'helpful-errors';
import type { IsoDateStamp } from 'iso-time';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

import type {
  ContextGithubAuth,
  ContextGitRepo,
} from '../../../domain.objects/RadioContext';
import { RadioTask } from '../../../domain.objects/RadioTask';
import type { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../domain.objects/RadioTaskStatus';
import { composeTaskIntoGhIssues } from '../../../domain.operations/radio/task/format/composeTaskIntoGhIssues';
import { extractTaskFromGhIssues } from '../../../domain.operations/radio/task/format/extractTaskFromGhIssues';
import { asExecErrorMessage } from '../../../infra/shell/asExecErrorMessage';
import { getGithubAuthFailureMessage } from './getGithubAuthFailureMessage';
import { isGithubAuthFailure } from './isGithubAuthFailure';

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
 * .why = wraps exec with proper error handler and explicit token auth
 *
 * .critical = never use default env's GH_TOKEN; must be explicitly provided
 */
const runGhCommand = async (
  command: string,
  context: ContextGithubAuth,
): Promise<string> => {
  // strip default env tokens to prevent accidental use
  const {
    GH_TOKEN: _removed,
    GITHUB_TOKEN: _removed2,
    ...envWithoutToken
  } = process.env;

  // build env: explicit token or unset for gh cli session auth
  const env =
    context.github.auth.token !== null
      ? { ...envWithoutToken, GH_TOKEN: context.github.auth.token }
      : envWithoutToken; // as-human: no GH_TOKEN, use gh cli session

  try {
    const { stdout } = await execAsync(command, { env });
    return stdout.trim();
  } catch (error: unknown) {
    // decode the cross-realm exec cause one way (shared infra transformer);
    // `.stderr` is a separate exec field, read inline below
    const message = asExecErrorMessage({ error });
    const stderr = (error as { stderr?: string })?.stderr ?? '';
    const text = `${message}\n${stderr}`;

    // graceful nudge on a github auth rejection (401), branched by auth role
    if (isGithubAuthFailure({ text }))
      throw new ConstraintError(
        getGithubAuthFailureMessage({ role: context.github.auth.role }),
        {
          command,
          role: context.github.auth.role,
          detail: stderr.trim() || message, // keep the raw cause for debug
        },
      );

    // otherwise, let the original error bubble (callers like byPrimary inspect it)
    throw error;
  }
};

/**
 * .what = dao for github issues channel
 * .why = enables radio task persistence via github issues
 *
 * .critical = never use default env's GH_TOKEN; must be explicitly provided
 */
export const daoRadioTaskViaGhIssues = {
  get: {
    one: {
      byPrimary: async (
        input: { exid: string },
        context: ContextGithubAuth & ContextGitRepo,
      ): Promise<RadioTask | null> => {
        const { repo } = context.git;
        const repoSlug = `${repo.owner}/${repo.name}`;

        try {
          const json = await runGhCommand(
            `gh issue view ${input.exid} --repo ${repoSlug} --json number,title,body,state,assignees,createdAt,author`,
            context,
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
          if (!issue.title.startsWith('🎙️ task -')) {
            throw new BadRequestError('issue is not a radio task', {
              exid: input.exid,
              title: issue.title,
            });
          }

          return extractTaskFromGhIssues({
            issueNumber: String(issue.number),
            title: issue.title,
            body: issue.body,
            state: issue.state.toLowerCase() as 'open' | 'closed',
            assignees: issue.assignees.map((a) => a.login),
            repo: repo,
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

      byUnique: async (
        input: { repo: RadioTaskRepo; title: string },
        context: ContextGithubAuth & ContextGitRepo,
      ): Promise<RadioTask | null> => {
        const repoSlug = `${input.repo.owner}/${input.repo.name}`;
        const searchTitle = `🎙️ task - ${input.title}`;

        // list issues directly (REST list endpoint), then match by exact title
        // in code. we deliberately AVOID `--search "... in:title"`: that routes
        // through github's search index, which is eventually consistent — a
        // just-created issue can take seconds-to-minutes to appear, so findsert
        // would miss it and create a duplicate. the direct list is strongly
        // consistent, so a prior task is found the instant it exists.
        const json = await runGhCommand(
          `gh issue list --repo ${repoSlug} --state all --json number,title,body,state,assignees,createdAt,author --limit 100`,
          context,
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
          repo: input.repo,
          createdAt: toIsoDateStamp(new Date(match.createdAt)),
          createdBy: match.author.login,
        });
      },
    },

    all: async (
      input: {
        repo: RadioTaskRepo;
        filter?: { status?: RadioTaskStatus };
        limit?: number;
      },
      context: ContextGithubAuth & ContextGitRepo,
    ): Promise<RadioTask[]> => {
      const repoSlug = `${input.repo.owner}/${input.repo.name}`;
      const limit = input.limit ?? 100;

      const stateFlag =
        input.filter?.status === RadioTaskStatus.DELIVERED
          ? '--state closed'
          : '--state all';

      // list issues directly (REST list endpoint), then keep only the radio
      // tasks by their title prefix in code. we deliberately AVOID `--search
      // "... in:title"`: that routes through github's eventually-consistent
      // search index, so a just-created task can be absent for seconds-to-
      // minutes. the direct list is strongly consistent.
      const json = await runGhCommand(
        `gh issue list --repo ${repoSlug} ${stateFlag} --json number,title,body,state,assignees,createdAt,author --limit ${limit}`,
        context,
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
            repo: input.repo,
            createdAt: toIsoDateStamp(new Date(issue.createdAt)),
            createdBy: issue.author.login,
          }),
        );

      // filter by status if specified
      if (input.filter?.status) {
        return tasks.filter((task) => task.status === input.filter!.status);
      }

      return tasks;
    },
  },

  set: {
    findsert: async (
      input: { task: RadioTask },
      context: ContextGithubAuth & ContextGitRepo,
    ): Promise<RadioTask> => {
      const repoSlug = `${input.task.repo.owner}/${input.task.repo.name}`;

      // check if task already exists
      const taskFound = await daoRadioTaskViaGhIssues.get.one.byUnique(
        { repo: input.task.repo, title: input.task.title },
        context,
      );
      if (taskFound) return taskFound;

      // create new issue
      const { title, body } = composeTaskIntoGhIssues({ task: input.task });

      // write body to temp file to preserve newlines
      const tempFile = path.join(os.tmpdir(), `radio-task-${Date.now()}.md`);
      await writeFileAsync(tempFile, body);

      try {
        const output = await runGhCommand(
          `gh issue create --repo ${repoSlug} --title "${title.replace(/"/g, '\\"')}" --body-file "${tempFile}"`,
          context,
        );

        // parse issue number from URL output (e.g., "https://github.com/owner/repo/issues/123")
        const issueNumberMatch = output.match(/\/issues\/(\d+)/);
        if (!issueNumberMatch)
          throw new UnexpectedCodePathError(
            'failed to parse issue number from gh cli output',
            { output, repoSlug },
          );

        return new RadioTask({
          ...input.task,
          exid: issueNumberMatch[1]!,
        });
      } finally {
        await unlinkAsync(tempFile).catch(() => {});
      }
    },

    upsert: async (
      input: { task: RadioTask },
      context: ContextGithubAuth & ContextGitRepo,
    ): Promise<RadioTask> => {
      const repoSlug = `${input.task.repo.owner}/${input.task.repo.name}`;

      // check if task exists
      const taskFound = input.task.exid
        ? await daoRadioTaskViaGhIssues.get.one.byPrimary(
            { exid: input.task.exid },
            context,
          )
        : await daoRadioTaskViaGhIssues.get.one.byUnique(
            { repo: input.task.repo, title: input.task.title },
            context,
          );

      if (!taskFound) {
        // create new issue
        return daoRadioTaskViaGhIssues.set.findsert(input, context);
      }

      // update issue
      const { title, body } = composeTaskIntoGhIssues({ task: input.task });

      // write body to temp file to preserve newlines
      const tempFile = path.join(
        os.tmpdir(),
        `radio-task-edit-${Date.now()}.md`,
      );
      await writeFileAsync(tempFile, body);

      try {
        await runGhCommand(
          `gh issue edit ${taskFound.exid} --repo ${repoSlug} --title "${title.replace(/"/g, '\\"')}" --body-file "${tempFile}"`,
          context,
        );
      } finally {
        await unlinkAsync(tempFile).catch(() => {});
      }

      // add assignee for CLAIMED status (best-effort — may fail for app tokens or invalid users)
      if (
        input.task.status === RadioTaskStatus.CLAIMED &&
        input.task.claimedBy
      ) {
        try {
          await runGhCommand(
            `gh issue edit ${taskFound.exid} --repo ${repoSlug} --add-assignee "${input.task.claimedBy}"`,
            context,
          );
        } catch (error: unknown) {
          // allowlist expected errors: app token permissions, invalid user
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const stderr = (error as { stderr?: string })?.stderr ?? '';
          const fullError = `${errorMessage} ${stderr}`.toLowerCase();
          const isExpectedError =
            fullError.includes('resource not accessible by integration') ||
            fullError.includes('could not resolve to a user') || // matches "user or bot" too
            fullError.includes('is not a valid assignee') ||
            fullError.includes('not found'); // gh cli error: 'username' not found
          if (!isExpectedError) throw error;
          // expected error: assignee add failed but claim is recorded in issue body
        }
      }

      // close issue for DELIVERED status
      if (input.task.status === RadioTaskStatus.DELIVERED) {
        await runGhCommand(
          `gh issue close ${taskFound.exid} --repo ${repoSlug}`,
          context,
        );
      }

      return new RadioTask({
        ...input.task,
        exid: taskFound.exid,
      });
    },
  },

  del: async (
    input: { exid: string },
    context: ContextGithubAuth & ContextGitRepo,
  ): Promise<void> => {
    const { repo } = context.git;
    const repoSlug = `${repo.owner}/${repo.name}`;

    await runGhCommand(
      `gh issue close ${input.exid} --repo ${repoSlug} --reason "not planned"`,
      context,
    );
  },
};
