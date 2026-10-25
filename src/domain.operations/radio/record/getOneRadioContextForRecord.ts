import { BadRequestError } from 'helpful-errors';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { ContextDispatchRadio } from '@src/domain.objects/RadioContext';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { getGithubTokenByAuthArg } from '@src/domain.operations/radio/auth/getGithubTokenByAuthArg';

import type { ShellExecutor } from './ShellExecutor';

/**
 * .what = the channel context a record sends through, or the auth fault that bars it
 * .why = a record carries its own channel + auth (C22); when its credentials cannot
 *        be derived now, it is held, not lost
 *
 * .note = the catch wraps the auth derive alone, so only an auth fault is held;
 *         any other throw is a defect, and it rethrows
 */
export const getOneRadioContextForRecord = async (
  input: { record: RadioTaskRecord; authOverride: string | null },
  context: { env: NodeJS.ProcessEnv; shx: ShellExecutor },
): Promise<
  | { radioContext: ContextDispatchRadio<RadioChannel> }
  | { fault: BadRequestError }
> => {
  // a channel with no auth needs only its repo
  const git = { repo: input.record.repo };
  if (input.record.via !== RadioChannel.GH_ISSUES)
    return { radioContext: { git } };

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
