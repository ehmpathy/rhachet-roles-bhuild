import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { getAllRadioTaskRecordsHeld } from './getAllRadioTaskRecordsHeld';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import type { ShellExecutor } from './ShellExecutor';
import { setRadioTaskRecordHeldBehindHalt } from './setRadioTaskRecordHeldBehindHalt';
import { setRadioTaskRecordUpstream } from './setRadioTaskRecordUpstream';

type DrainContext = {
  cwd: string;
  homeDir: string | undefined;
  env: NodeJS.ProcessEnv;
  shx: ShellExecutor;
};

type HeldFate = Extract<RadioTaskRecordFate, { fate: 'held' }>;
type LineProgress = { fates: RadioTaskRecordFate[]; halter: HeldFate | null };

/**
 * .what = send each record in line, one at a time; stop at the first fault that halts
 * .why = records after a halt stay held in their place, behind the fault
 *
 * .note = a promise fold, not recursion: the stack depth stays constant however large
 *         the backlog a long block leaves behind
 */
const setRadioTaskRecordsInLine = async (
  input: { line: { record: RadioTaskRecord; dir: string }[] },
  context: DrainContext,
): Promise<RadioTaskRecordFate[]> => {
  const progressStart = (async (): Promise<LineProgress> => ({
    fates: [],
    halter: null,
  }))();
  const progress = await input.line.reduce<Promise<LineProgress>>(
    async (priorPromise, entry) => {
      const prior = await priorPromise;

      // behind a halt: held in place with the halter's reason, unsent
      if (prior.halter)
        return {
          fates: [
            ...prior.fates,
            setRadioTaskRecordHeldBehindHalt({
              ...entry,
              halter: prior.halter,
            }),
          ],
          halter: prior.halter,
        };

      // otherwise, send it; a fault that halts holds the line after it
      const fate = await setRadioTaskRecordUpstream(entry, context);
      return {
        fates: [...prior.fates, fate],
        halter: fate.fate === 'held' && fate.halt ? fate : null,
      };
    },
    progressStart,
  );
  return progress.fates;
};

/**
 * .what = deliver every held record whose own gate is open, oldest first
 * .why = every push is a probe of the gate: the first that gets through carries the
 *        backlog out with it — no verb, no flag, no memory (F4: broad drain)
 *
 * .note = this push is held like the rest, so it goes in its place in line: last when
 *         new, in its first place when it re-types a held task (C5).
 *         an upstream fault halts the drain; the records after it stay held, in order,
 *         so a fault that likely hits them all is reported once, never reordered around.
 *         a record already DELIVERED is never re-sent: its local mark answers first (C3)
 */
export const setRadioTaskRecordsDrained = async (
  input: Record<string, never>,
  context: DrainContext,
): Promise<{ fates: RadioTaskRecordFate[] }> => {
  const line = getAllRadioTaskRecordsHeld({}, context);
  const fates = await setRadioTaskRecordsInLine({ line }, context);
  return { fates };
};
