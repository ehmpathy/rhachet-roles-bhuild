import { getAllRadioTaskRecordsHeld } from './getAllRadioTaskRecordsHeld';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import type { ShellExecutor } from './ShellExecutor';
import { setRadioTaskRecordsClockShed } from './setRadioTaskRecordsClockShed';
import { setRadioTaskRecordsInLine } from './setRadioTaskRecordsInLine';
import { withRadioDrainLock } from './withRadioDrainLock';

/**
 * .what = deliver every held record whose own gate is open, oldest first
 * .why = every push is a probe of the gate: the first that gets through carries the
 *        backlog out with it — no verb, no flag, no memory (F4: broad drain)
 *
 * .note = this push is held like the rest, so it goes in its place in line: last when
 *         new, in its first place when it re-types a held task (C5).
 *         a wall (rate limit, outage) halts the drain; the records after it stay held, in
 *         order, so a fault that hits them all is reported once, never reordered around.
 *         any other fault sets its one record aside, and the rest still deliver (#511).
 *         a record already DELIVERED is never re-sent: its local mark answers first (C3).
 *         after the line, any record that holds a legacy clock field (`heldAt`, `settledAt`)
 *         is written back without it, settled ones included, so a drain that completes
 *         leaves the record dirs clock-free
 */
const _setRadioTaskRecordsDrained = async (
  input: Record<string, never>,
  context: {
    cwd: string;
    homeDir: string | undefined;
    env: NodeJS.ProcessEnv;
    shx: ShellExecutor;
    authOverride?: string | null;
  },
): Promise<{ fates: RadioTaskRecordFate[] }> => {
  // send the held line, oldest first
  const line = getAllRadioTaskRecordsHeld({}, context);
  const fates = await setRadioTaskRecordsInLine({ line }, context);

  // write back any record that still holds a legacy clock field
  setRadioTaskRecordsClockShed({}, context);
  return { fates };
};

/**
 * .note = one drain at a time per worktree: the held line is read under the lock, so a
 *         concurrent drain waits, then finds the first drain's records delivered (X2, C19)
 */
export const setRadioTaskRecordsDrained = withRadioDrainLock(
  _setRadioTaskRecordsDrained,
);
