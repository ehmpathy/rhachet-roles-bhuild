import { execFile } from 'child_process';
import { ConstraintError } from 'helpful-errors';
import { promisify } from 'util';

import type { ContextGithubAuth } from '../../../domain.objects/RadioContext';
import { asExecErrorMessage } from '../../../infra/shell/asExecErrorMessage';
import { getGithubAuthFailureMessage } from './getGithubAuthFailureMessage';
import { isGhCallTimedOut } from './isGhCallTimedOut';
import { isGithubAuthFailure } from './isGithubAuthFailure';
import { RadioGhSendTimeoutError } from './RadioGhSendTimeoutError';

const execFileAsync = promisify(execFile);

/**
 * .what = run one gh cli call, as an argv list, and return its stdout
 * .why = record fields (title, exid, repo) reach gh as argv entries, never as shell text,
 *        so `$(...)`, backticks, and quotes in a title stay literal. a call that runs past
 *        its timeout is killed and fails loud, so a stalled send never outlasts the drain lock
 *
 * .critical = never use default env's GH_TOKEN; must be explicitly provided
 * .note = a timed-out call throws a MalfunctionError whose text names `etimedout`, which the
 *         upstream classifier reads as upstream:transient: the drain halts, and the record
 *         stays held in its place for the next drain
 */
export const runGhCommand = async (
  input: { args: string[]; timeout: { milliseconds: number } },
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

  // the call as a human reads it, for error context only; it is never run as text
  const command = ['gh', ...input.args].join(' ');

  try {
    const { stdout } = await execFileAsync('gh', input.args, {
      env,
      timeout: input.timeout.milliseconds,
      maxBuffer: 64 * 1024 * 1024,
    });
    return stdout.trim();
  } catch (error: unknown) {
    // a call killed by its timeout: a wall, never this record's own fault
    // (a maxBuffer overrun is also marked killed; it falls through as a plain fault)
    if (isGhCallTimedOut({ error }))
      throw new RadioGhSendTimeoutError(
        `gh call timed out after ${Math.round(input.timeout.milliseconds / 1000)}s (etimedout); the record stays held for the next drain`,
        { command },
      );

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
