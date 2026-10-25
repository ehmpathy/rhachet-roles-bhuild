import { asRadioDeliveredLine } from './asRadioDeliveredLine';
import { asRadioNestedLines } from './asRadioNestedLines';
import { asRadioQueueFixLines } from './asRadioQueueFixLines';
import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

type RadioTreeBranch = { line: string; children: string[] };

/**
 * .what = the sections a drain reports: what went, what closed, what still waits
 * .why = a push that rides a drain and a `queue drain` show one shape; the sections come
 *        back keyed, so a caller places `drained` by name, never by label
 *
 * .note = each record still held names its next move (asRadioQueueFixLines), so a record
 *         set aside is never a dead end
 */
export const asRadioDrainSections = (input: {
  fates: RadioTaskRecordFate[];
}): { drained: RadioTreeBranch[]; closedOrHeld: RadioTreeBranch[] } => {
  // the drained lines print in drain order, so their order alone is the place in line
  const drained = input.fates.flatMap((fate) =>
    fate.fate === 'delivered'
      ? [
          fate.outcome === 'found'
            ? `${asRadioDeliveredLine(fate)} (already upstream — marked delivered)`
            : asRadioDeliveredLine(fate),
        ]
      : [],
  );
  const refused = input.fates.flatMap((fate) =>
    fate.fate === 'refused'
      ? [`${asRadioTaskRecordLabel(fate)} — ${fate.detail}`]
      : [],
  );
  const held = input.fates.flatMap((fate) =>
    fate.fate === 'held'
      ? [
          asRadioNestedLines({
            head: `${asRadioTaskRecordLabel(fate)} → ${asRadioTaskRepoSlug({ repo: fate.record.repo })} (${fate.record.reason ?? 'not reached'})`,
            lines: asRadioQueueFixLines(fate),
          }),
        ]
      : [],
  );
  const lifts = [
    ...new Set(
      input.fates.flatMap((fate) =>
        fate.fate === 'held' && fate.lift
          ? [`lift it (human): ${fate.lift}`]
          : [],
      ),
    ),
  ];
  return {
    drained: drained.length ? [{ line: 'drained', children: drained }] : [],
    closedOrHeld: [
      ...(refused.length
        ? [{ line: 'refused — closed, never retried', children: refused }]
        : []),
      ...(held.length
        ? [{ line: 'still held', children: [...held, ...lifts] }]
        : []),
    ],
  };
};
