import type { ContextGithubAuth } from '../../../domain.objects/RadioContext';
import type { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { getOneCommentByBody } from '../../../domain.operations/radio/task/comment/getOneCommentByBody';
import { asCommentsFromGhIssueJson } from './asCommentsFromGhIssueJson';
import { asCommentUrlFromGhOutput } from './asCommentUrlFromGhOutput';
import { asGhFaultText } from './asGhFaultText';
import { asGhIssueNumber } from './asGhIssueNumber';
import { genGhBodyTempFile } from './genGhBodyTempFile';
import { isGithubIssueAbsent } from './isGithubIssueAbsent';
import { isGithubRepoUnreachable } from './isGithubRepoUnreachable';
import { runGhUnderSendLimit } from './runGhUnderSendLimit';

/**
 * .what = the comments on one issue or pr, or null when no such thread exists
 * .why = one read proves the thread exists and lists what it already holds, so a repeat body
 *        is found before any post
 *
 * .note = `gh issue view` accepts a pr number too, and its absent-thread text is the one
 *         `isGithubIssueAbsent` reads; a repo the auth cannot see is a fault, never an absence
 * .note = gh preloads every page of comments for `--json comments`, so a long thread is read whole
 */
const getAllCommentsOnThread = async (
  input: { repo: RadioTaskRepo; exid: string },
  context: ContextGithubAuth,
): Promise<{ body: string; url: string }[] | null> => {
  // read the thread
  const json = await runGhUnderSendLimit(
    {
      args: [
        'issue',
        'view',
        asGhIssueNumber({ exid: input.exid }),
        '--repo',
        `${input.repo.owner}/${input.repo.name}`,
        '--json',
        'number,comments',
      ],
    },
    context,
  ).catch((error: unknown) => {
    // a repo the auth cannot see is a fault of this send: another auth may reach it
    const text = asGhFaultText({ error });
    if (isGithubRepoUnreachable({ text })) throw error;

    // an absent thread in a reachable repo is a true absence; all else is a fault
    if (isGithubIssueAbsent({ text })) return null;
    throw error;
  });
  if (json === null) return null;
  return asCommentsFromGhIssueJson({ json });
};

/**
 * .what = dao for comments on github issues and prs
 * .why = the radio's one write path for a comment: read the thread, then post once
 *
 * .critical = never use default env's GH_TOKEN; runGhCommand sets the auth env explicitly
 */
export const daoRadioTaskCommentViaGhIssues = {
  set: {
    /**
     * .what = find the exact body on the thread, else post it
     * .why = a retry after a lost reply, or a second run, must never post the body twice
     * .note = null when no such thread exists
     * .note = the read and the post are two gh calls, and github's comment post takes no
     *         idempotency key. within one worktree the drain lock admits one send at a time; two
     *         worktrees that send one body in the same seconds may both post it. that race is
     *         accepted (F7): its cost is one deletable duplicate, for a case two clones must time
     */
    findsert: async (
      input: { repo: RadioTaskRepo; exid: string; body: string },
      context: ContextGithubAuth,
    ): Promise<{ url: string | null; outcome: 'posted' | 'kept' } | null> => {
      // read the thread first: it must exist, and the body may already be there
      const comments = await getAllCommentsOnThread(input, context);
      if (comments === null) return null;
      const commentFound = getOneCommentByBody({ comments, body: input.body });
      if (commentFound) return { url: commentFound.url, outcome: 'kept' };

      // post it, the body via a private temp file so newlines and quotes stay literal
      const repoSlug = `${input.repo.owner}/${input.repo.name}`;
      const { file: tempFile, cleanup } = await genGhBodyTempFile({
        body: input.body,
      });
      try {
        const output = await runGhUnderSendLimit(
          {
            args: [
              'issue',
              'comment',
              asGhIssueNumber({ exid: input.exid }),
              '--repo',
              repoSlug,
              '--body-file',
              tempFile,
            ],
          },
          context,
        );

        // cite the new comment by the url gh prints; the comment is live by now, so an output gh
        // reshaped yields a null url rather than a throw that would abort the drain and leave the
        // record QUEUED for a comment already posted
        const url = asCommentUrlFromGhOutput({ output });
        return { url, outcome: 'posted' };
      } finally {
        await cleanup();
      }
    },
  },
};
