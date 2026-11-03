import { MalfunctionError } from 'helpful-errors';

import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { isRadioTextFitForTrackedRecord } from './isRadioTextFitForTrackedRecord';

/**
 * .what = the record the drain read, with the fate it gave applied
 * .why = a headline explains its reason, so a change of reason that names no headline clears
 *        the old one rather than leave it beside a reason it never said
 *
 * .note = the one seam where new upstream words land on a record, so it refuses words a tracked
 *         file must not hold, loud, whatever writer built them
 */
export const asRadioTaskRecordSettled = (input: {
  record: RadioTaskRecord;
  change: Partial<RadioTaskRecord>;
}): RadioTaskRecord => {
  // words unfit for a tracked file never land, whatever writer passed them
  const headlineNew = input.change.reasonHeadline ?? null;
  if (headlineNew && !isRadioTextFitForTrackedRecord({ text: headlineNew }))
    throw new MalfunctionError(
      'a record headline holds a clock, an epoch, or a token; a tracked file must not keep it',
      { key: input.record.key, reason: input.change.reason ?? null },
    );

  // a new reason with no words of its own drops the words of the old one; a headline passed as
  // undefined names none, so it never writes undefined over a field typed string | null
  const reasonHeadline = ((): string | null => {
    if (input.change.reasonHeadline !== undefined) return headlineNew;
    if (input.change.reason !== undefined) return null;
    return input.record.reasonHeadline;
  })();

  // apply the fate over the record read
  return new RadioTaskRecord({
    ...input.record,
    ...input.change,
    reasonHeadline,
  });
};
