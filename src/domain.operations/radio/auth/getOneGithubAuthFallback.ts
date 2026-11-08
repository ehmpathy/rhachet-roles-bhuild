import type { BadRequestError } from 'helpful-errors';

import { asRadioHeldFault } from '@src/domain.operations/radio/asRadioHeldFault';

import { asRadioAuthBothFailedError } from './asRadioAuthBothFailedError';
import { getOneGithubAuthAmbient } from './getOneGithubAuthAmbient';
import type {
  GithubAuthAmbientKind,
  RadioAuthBotMiss,
} from './RadioAuthFallback';

/**
 * .what = the ambient credential to fall back to after the ehmpath bot token missed, or the
 *         fault that holds the record when there is none
 * .why = push and drain take the fallback at two moments (the bot token absent at derive,
 *        refused at send); both read the ambient the same way, so the rule lives once
 *
 * .note = a caller-fix fault from the ambient read holds the record; any other fault throws
 * .note = no ambient credential at all names both credentials, each with its own fix
 */
export const getOneGithubAuthFallback = async (
  input: { bot: RadioAuthBotMiss },
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<
  { token: string; kind: GithubAuthAmbientKind } | { fault: BadRequestError }
> => {
  // read the ambient credential; a caller-fix fault holds the record
  const ambient = await getOneGithubAuthAmbient({}, context).catch(
    asRadioHeldFault,
  );
  if (ambient && 'fault' in ambient) return { fault: ambient.fault };

  // no ambient credential either: name both
  if (!ambient)
    return {
      fault: asRadioAuthBothFailedError({
        bot: input.bot,
        ambient: { state: 'absent' },
      }),
    };
  return ambient;
};
