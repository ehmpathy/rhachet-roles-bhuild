import type { ContextGithubAuth } from '../../../domain.objects/RadioContext';
import { getOneGhCallTimeout } from './getOneGhCallTimeout';
import { runGhCommand } from './runGhCommand';

/**
 * .what = run one gh call, as argv, under the radio's send bound
 * .why = every radio gh call shares one auth env (runGhCommand); its timeout is the per-call
 *        bound, cut to what the send has left when a drain sets a send limit. the task dao and
 *        the comment dao both call it, so the bound holds the same on every send
 */
export const runGhUnderSendLimit = (
  input: { args: string[] },
  context: ContextGithubAuth,
): Promise<string> =>
  runGhCommand(
    {
      args: input.args,
      timeout: getOneGhCallTimeout({ limit: context.github.send ?? null }),
    },
    context,
  );
