import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import { asIsoDateStamp } from 'iso-time';

import type {
  ContextGithubAuth,
  ContextGitRepo,
} from '../../../domain.objects/RadioContext';
import { RadioTask } from '../../../domain.objects/RadioTask';
import type { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../domain.objects/RadioTaskStatus';
import { composeTaskIntoGhIssues } from '../../../domain.operations/radio/task/format/composeTaskIntoGhIssues';
import { extractTaskFromGhIssues } from '../../../domain.operations/radio/task/format/extractTaskFromGhIssues';
import { asGhIssueNumber } from './asGhIssueNumber';
import { genGhBodyTempFile } from './genGhBodyTempFile';
import { getOneGhCallTimeout } from './getOneGhCallTimeout';
import { isGithubIssueAbsent } from './isGithubIssueAbsent';
import { isGithubRepoUnreachable } from './isGithubRepoUnreachable';
import { runGhCommand } from './runGhCommand';

/**
 * .what = run one gh call, as argv, under the radio's send bound
 * .why = every call in this dao shares one auth env (runGhCommand); its timeout is the
 *        per-call bound, cut to what the send has left when a drain sets a send limit
 */
const runGh = (args: string[], context: ContextGithubAuth): Promise<string> =>
  runGhCommand(
    {
      args,
      timeout: getOneGhCallTimeout({ limit: context.github.send ?? null }),
    },
    context,
  );

/**
 * .what = the `--json` fields every issue read asks gh for
 * .why = one list, so each read parses the same shape
 */
const GH_ISSUE_JSON_FIELDS =
  'number,title,body,state,assignees,createdAt,author';

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
        const exid = asGhIssueNumber({ exid: input.exid });

        try {
          const json = await runGh(
            [
              'issue',
              'view',
              exid,
              '--repo',
              repoSlug,
              '--json',
              GH_ISSUE_JSON_FIELDS,
            ],
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

          // verify this is a radio task; the radio never rewrites an issue outside its frame
          // .note = the fix rides in the message, since a refusal shows only its headline
          if (!issue.title.startsWith('🎙️ task -')) {
            throw new BadRequestError(
              `issue #${input.exid} is not a radio task; the radio edits only its own 🎙️ task issues, so edit or close #${input.exid} by hand`,
              { exid: input.exid, title: issue.title },
            );
          }

          return extractTaskFromGhIssues({
            issueNumber: String(issue.number),
            title: issue.title,
            body: issue.body,
            state: issue.state.toLowerCase() as 'open' | 'closed',
            assignees: issue.assignees.map((a) => a.login),
            repo: repo,
            createdAt: asIsoDateStamp(new Date(issue.createdAt)),
            createdBy: issue.author.login,
          });
        } catch (error: unknown) {
          // exec errors have stderr in the error object
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const stderr = (error as { stderr?: string })?.stderr ?? '';
          const fullError = `${errorMessage} ${stderr}`;

          // a repo the auth cannot see is a fault of this send, never an absent issue:
          // another auth may reach it, so it must not close the record as refused
          if (isGithubRepoUnreachable({ text: fullError })) throw error;

          // an absent issue in a reachable repo is a true absence; all else is a fault
          if (isGithubIssueAbsent({ text: fullError })) return null;
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
        const json = await runGh(
          [
            'issue',
            'list',
            '--repo',
            repoSlug,
            '--state',
            'all',
            '--json',
            GH_ISSUE_JSON_FIELDS,
            '--limit',
            '100',
          ],
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
          createdAt: asIsoDateStamp(new Date(match.createdAt)),
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

      const state =
        input.filter?.status === RadioTaskStatus.DELIVERED ? 'closed' : 'all';

      // list issues directly (REST list endpoint), then keep only the radio
      // tasks by their title prefix in code. we deliberately AVOID `--search
      // "... in:title"`: that routes through github's eventually-consistent
      // search index, so a just-created task can be absent for seconds-to-
      // minutes. the direct list is strongly consistent.
      const json = await runGh(
        [
          'issue',
          'list',
          '--repo',
          repoSlug,
          '--state',
          state,
          '--json',
          GH_ISSUE_JSON_FIELDS,
          '--limit',
          String(limit),
        ],
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
            createdAt: asIsoDateStamp(new Date(issue.createdAt)),
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

      // write body to a private temp file to preserve newlines
      const { file: tempFile, cleanup } = await genGhBodyTempFile({ body });

      try {
        const output = await runGh(
          [
            'issue',
            'create',
            '--repo',
            repoSlug,
            '--title',
            title,
            '--body-file',
            tempFile,
          ],
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
        await cleanup();
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
      const exidFound = asGhIssueNumber({ exid: taskFound.exid });
      const { title, body } = composeTaskIntoGhIssues({ task: input.task });

      // write body to a private temp file to preserve newlines
      const { file: tempFile, cleanup } = await genGhBodyTempFile({ body });

      try {
        await runGh(
          [
            'issue',
            'edit',
            exidFound,
            '--repo',
            repoSlug,
            '--title',
            title,
            '--body-file',
            tempFile,
          ],
          context,
        );
      } finally {
        await cleanup();
      }

      // add assignee for CLAIMED status (best-effort — may fail for app tokens or invalid users)
      if (
        input.task.status === RadioTaskStatus.CLAIMED &&
        input.task.claimedBy
      ) {
        try {
          await runGh(
            [
              'issue',
              'edit',
              exidFound,
              '--repo',
              repoSlug,
              '--add-assignee',
              input.task.claimedBy,
            ],
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
        await runGh(['issue', 'close', exidFound, '--repo', repoSlug], context);
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

    const exid = asGhIssueNumber({ exid: input.exid });
    await runGh(
      ['issue', 'close', exid, '--repo', repoSlug, '--reason', 'not planned'],
      context,
    );
  },
};
