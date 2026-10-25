import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import type { ShellExecutor } from './ShellExecutor';
import { setRadioTaskRecordHeldBehindHalt } from './setRadioTaskRecordHeldBehindHalt';
import { setRadioTaskRecordUpstream } from './setRadioTaskRecordUpstream';

type HeldFate = Extract<RadioTaskRecordFate, { fate: 'held' }>;

/**
 * .what = the line so far: each fate in order, and the fault that halted it, if any
 * .why = the drain folds one record at a time into this, so a halt carries forward
 */
export type RadioTaskRecordLineProgress = {
  fates: RadioTaskRecordFate[];
  halter: HeldFate | null;
};

/**
 * .what = take the next record in line: hold it behind a halt, or send it
 * .why = one step of the drain; a fault that halts holds every record after it
 */
export const setRadioTaskRecordNextInLine = async (
  input: {
    prior: RadioTaskRecordLineProgress;
    entry: { record: RadioTaskRecord; dir: string };
  },
  context: {
    cwd: string;
    homeDir: string | undefined;
    env: NodeJS.ProcessEnv;
    shx: ShellExecutor;
    authOverride?: string | null;
  },
): Promise<RadioTaskRecordLineProgress> => {
  // behind a halt: held in place with the halter's reason, unsent
  const halterPrior = input.prior.halter;
  if (halterPrior)
    return {
      fates: [
        ...input.prior.fates,
        setRadioTaskRecordHeldBehindHalt({
          ...input.entry,
          halter: halterPrior,
        }),
      ],
      halter: halterPrior,
    };

  // otherwise, send it; a fault that halts holds the line after it
  const fate = await setRadioTaskRecordUpstream(input.entry, context);
  return {
    fates: [...input.prior.fates, fate],
    halter: fate.fate === 'held' && fate.halt ? fate : null,
  };
};
