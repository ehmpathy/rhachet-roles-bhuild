import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import type { ShellExecutor } from './ShellExecutor';
import {
  type RadioTaskRecordLineProgress,
  setRadioTaskRecordNextInLine,
} from './setRadioTaskRecordNextInLine';

/**
 * .what = send each record in line, one at a time; stop at the first fault that halts
 * .why = records after a halt stay held in their place, behind the fault
 *
 * .note = a promise fold, not recursion: the stack depth stays constant however large
 *         the backlog a long block leaves behind
 */
export const setRadioTaskRecordsInLine = async (
  input: { line: { record: RadioTaskRecord; dir: string }[] },
  context: {
    cwd: string;
    homeDir: string | undefined;
    env: NodeJS.ProcessEnv;
    shx: ShellExecutor;
    authOverride?: string | null;
  },
): Promise<RadioTaskRecordFate[]> => {
  // fold each record into the line, in order
  const progressStart = (async (): Promise<RadioTaskRecordLineProgress> => ({
    fates: [],
    halter: null,
  }))();
  const progress = await input.line.reduce(
    async (priorPromise, entry) =>
      setRadioTaskRecordNextInLine(
        { prior: await priorPromise, entry },
        context,
      ),
    progressStart,
  );
  return progress.fates;
};
