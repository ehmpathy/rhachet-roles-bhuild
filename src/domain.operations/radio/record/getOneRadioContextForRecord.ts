import { type BadRequestError, ConstraintError } from 'helpful-errors';
import type { keyrack } from 'rhachet/keyrack';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { ContextDispatchRadio } from '@src/domain.objects/RadioContext';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { asRadioHeldFault } from '@src/domain.operations/radio/asRadioHeldFault';
import { asRadioAuthBotMiss } from '@src/domain.operations/radio/auth/asRadioAuthBotMiss';
import { getGithubTokenByAuthArg } from '@src/domain.operations/radio/auth/getGithubTokenByAuthArg';
import { getOneGithubAuthFallback } from '@src/domain.operations/radio/auth/getOneGithubAuthFallback';
import type { RadioAuthFallback } from '@src/domain.operations/radio/auth/RadioAuthFallback';

import { asRadioAuthShown } from './asRadioAuthShown';
import { isRadioRecordAuthReplayable } from './isRadioRecordAuthReplayable';
import type { ShellExecutor } from './ShellExecutor';

/**
 * .what = is this record's auth the one typed by the live push in this process
 * .why = a live push may run its own shx auth; the record it wrote holds that same auth
 */
const isRadioRecordAuthLive = (input: {
  record: RadioTaskRecord;
  authLive: { key: string; auth: string | null } | null;
}): boolean =>
  input.authLive !== null &&
  input.authLive.key === input.record.key &&
  input.authLive.auth === input.record.auth;

/**
 * .what = the channel context a record sends through, or the auth fault that bars it
 * .why = a record carries its own channel + auth (C22); when its credentials cannot
 *        be derived now, it is held, not lost
 *
 * .note = the catch wraps the auth derive alone, so only an auth fault is held;
 *         any other throw is a defect, and it rethrows
 * .note = under the default auth (no --auth typed, none stored, no drain --auth), an absent
 *         bot token falls back to the ambient credential of the box (#513); the fallback is
 *         returned so the cli can name it. a chosen auth never falls back
 */
export const getOneRadioContextForRecord = async (
  input: {
    record: RadioTaskRecord;
    authOverride: string | null;
    authLive: { key: string; auth: string | null } | null;
  },
  context: {
    env: NodeJS.ProcessEnv;
    shx: ShellExecutor;
    keyrackGet?: typeof keyrack.get;
  },
): Promise<
  | {
      radioContext: ContextDispatchRadio<RadioChannel>;
      fallback: RadioAuthFallback | null;
      isAuthDefault: boolean;
    }
  | { fault: BadRequestError }
> => {
  // a channel with no auth needs only its repo
  const git = { repo: input.record.repo };
  if (input.record.via !== RadioChannel.GH_ISSUES)
    return { radioContext: { git }, fallback: null, isAuthDefault: false };

  // a stored auth that would run a shell holds the record; only a live one may
  const isAuthStored =
    input.authOverride === null && !isRadioRecordAuthLive(input);
  if (isAuthStored && !isRadioRecordAuthReplayable(input.record))
    return {
      fault: new ConstraintError(
        `this record's stored --auth (${asRadioAuthShown({ auth: input.record.auth })}) is never replayed from a record file (a shx command, a keyrack owner that is not plain, or an env var whose name holds no TOKEN segment); amend it to an auth you type: \`rhx radio.task.queue set --uuid ${input.record.key} --auth <auth>\``,
        { key: input.record.key },
      ),
    };

  // derive the github auth; an auth fault holds the record
  const authChosen = input.authOverride ?? input.record.auth;
  const isAuthDefault = authChosen === null;
  const derived = await getGithubTokenByAuthArg(
    { auth: authChosen },
    context,
  ).catch(asRadioHeldFault);
  if (!('fault' in derived))
    return {
      radioContext: { github: { auth: derived }, git },
      fallback: null,
      isAuthDefault,
    };

  // a chosen auth that faults is held as is; never a fallback past it
  if (!isAuthDefault) return { fault: derived.fault };

  // the bot token is absent: fall back to the ambient credential of the box
  const bot = asRadioAuthBotMiss({ fault: derived.fault });
  const ambient = await getOneGithubAuthFallback({ bot }, context);
  if ('fault' in ambient) return { fault: ambient.fault };
  return {
    radioContext: {
      github: { auth: { token: ambient.token, role: 'as-robot' } },
      git,
    },
    fallback: { kind: ambient.kind, bot },
    isAuthDefault,
  };
};
