import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { getAllRadioUsagePermissions } from '@src/domain.operations/radio/permission/getAllRadioUsagePermissions';

import { asRadioTaskRecordLift } from './asRadioTaskRecordLift';
import { getAllRadioTaskRecordsHeld } from './getAllRadioTaskRecordsHeld';

/**
 * .what = every held record, each with the command that lifts its gate (null if open)
 * .why = the stop reminder tells the human what waits and how to free it —
 *        from local files only, no network, no send
 *
 * .note = the gate states load once, whatever the backlog size; each record's
 *         gate is then computed from them
 */
export const getAllRadioTaskRecordsHeldWithLift = async (
  input: Record<string, never>,
  context: { cwd: string; homeDir: string | undefined },
): Promise<{ record: RadioTaskRecord; lift: string | null }[]> => {
  // load the gate states once
  const states = await getAllRadioUsagePermissions(
    { cwd: context.cwd },
    { homeDir: context.homeDir },
  );

  // pair each held record with the command that lifts its gate
  return getAllRadioTaskRecordsHeld({}, context).map(({ record }) => ({
    record,
    lift: asRadioTaskRecordLift({ record, states }),
  }));
};
