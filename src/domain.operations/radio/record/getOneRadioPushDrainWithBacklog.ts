import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { getAllRadioTaskRecordsHeld } from './getAllRadioTaskRecordsHeld';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import type { ShellExecutor } from './ShellExecutor';
import { setRadioTaskRecordsDrainedByPush } from './setRadioTaskRecordsDrainedByPush';

/**
 * .what = drain the backlog a push carries, then read what still waits
 * .why = a push reports its own fate, the fates of the records it carried, and the backlog
 *        left behind, as one result
 */
export const getOneRadioPushDrainWithBacklog = async (
  input: { record: RadioTaskRecord; dir: string; authTyped: string | null },
  context: {
    cwd: string;
    homeDir: string | undefined;
    env: NodeJS.ProcessEnv;
    shx: ShellExecutor;
  },
): Promise<{
  pushed: RadioTaskRecordFate | { fate: 'landed'; record: RadioTaskRecord };
  others: RadioTaskRecordFate[];
  backlog: { record: RadioTaskRecord; dir: string }[];
}> => {
  // drain the line this push rides
  const drained = await setRadioTaskRecordsDrainedByPush(input, context);

  // read what still waits
  const backlog = getAllRadioTaskRecordsHeld({}, context);
  return { ...drained, backlog };
};
