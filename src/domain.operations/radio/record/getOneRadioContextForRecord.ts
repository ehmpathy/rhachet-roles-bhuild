import { BadRequestError } from 'helpful-errors';

import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { getOneRadioContextFromCliArgs } from '@src/domain.operations/radio/cli/getOneRadioContextFromCliArgs';

import type { ShellExecutor } from './ShellExecutor';

/**
 * .what = the channel context a record sends through, or the auth fault that bars it
 * .why = a record carries its own channel + auth (C22); when its credentials cannot
 *        be derived now, it is held, not lost. any other throw is a defect, so it rethrows
 */
export const getOneRadioContextForRecord = async (
  input: { record: RadioTaskRecord },
  context: { env: NodeJS.ProcessEnv; shx: ShellExecutor },
): Promise<
  | { radioContext: Awaited<ReturnType<typeof getOneRadioContextFromCliArgs>> }
  | { fault: BadRequestError }
> => {
  try {
    return {
      radioContext: await getOneRadioContextFromCliArgs(
        {
          via: input.record.via,
          repo: input.record.repo,
          auth: input.record.auth,
        },
        context,
      ),
    };
  } catch (error) {
    if (!(error instanceof BadRequestError)) throw error;
    return { fault: error };
  }
};
