import { BadRequestError, ConstraintError } from 'helpful-errors';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { ContextDispatchRadio } from '@src/domain.objects/RadioContext';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { getGithubTokenByAuthArg } from '@src/domain.operations/radio/auth/getGithubTokenByAuthArg';

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
 */
export const getOneRadioContextForRecord = async (
  input: {
    record: RadioTaskRecord;
    authOverride: string | null;
    authLive: { key: string; auth: string | null } | null;
  },
  context: { env: NodeJS.ProcessEnv; shx: ShellExecutor },
): Promise<
  | { radioContext: ContextDispatchRadio<RadioChannel> }
  | { fault: BadRequestError }
> => {
  // a channel with no auth needs only its repo
  const git = { repo: input.record.repo };
  if (input.record.via !== RadioChannel.GH_ISSUES)
    return { radioContext: { git } };

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
  try {
    const auth = await getGithubTokenByAuthArg(
      { auth: input.authOverride ?? input.record.auth },
      context,
    );
    return { radioContext: { github: { auth }, git } };
  } catch (error) {
    if (!(error instanceof BadRequestError)) throw error;
    return { fault: error };
  }
};
