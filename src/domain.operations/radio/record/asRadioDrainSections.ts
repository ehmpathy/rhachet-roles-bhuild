import { asRadioDeliveredLine } from './asRadioDeliveredLine';
import { asRadioDrainHeldRow } from './asRadioDrainHeldRow';
import { asRadioRefusalText } from './asRadioRefusalText';
import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

type RadioTreeBranch = { line: string; children: string[] };

/**
 * .what = the sections a drain reports: what went, what closed, what still waits
 * .why = a push that rides a drain and a `queue drain` show one shape; the sections come
 *        back keyed, so a caller places `drained` by name, never by label
 *
 * .note = each record still held names its next move (asRadioDrainHeldRow), so a record
 *         set aside is never a dead end
 */
export const asRadioDrainSections = (input: {
  fates: RadioTaskRecordFate[];
  authOverride: string | null;
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
      ? [
          `${asRadioTaskRecordLabel(fate)} — ${asRadioRefusalText({ detail: fate.detail })}`,
        ]
      : [],
  );
  const held = input.fates.flatMap((fate) =>
    fate.fate === 'held'
      ? [asRadioDrainHeldRow({ fate, authOverride: input.authOverride })]
      : [],
  );
  return {
    drained: drained.length ? [{ line: 'drained', children: drained }] : [],
    closedOrHeld: [
      ...(refused.length
        ? [
            {
              // the note rides on the section head, so no child reads as one more refused record
              line: 'refused — closed, never retried; rhx radio.task.queue get lists it no more, and its reason stays in its record file',
              children: refused,
            },
          ]
        : []),
      ...(held.length ? [{ line: 'still held', children: held }] : []),
    ],
  };
};
