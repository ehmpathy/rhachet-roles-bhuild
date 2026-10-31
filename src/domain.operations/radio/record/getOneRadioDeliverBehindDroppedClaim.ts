import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

/**
 * .what = the first held deliver behind a dropped claim on the same issue, else null
 * .why = a deliver lands only on a claimed issue; with its claim dropped, the deliver is
 *        refused upstream ("cannot deliver unclaimed task") unless the issue was claimed
 *        some other way, so the drop must warn before the next drain closes it for good
 */
export const getOneRadioDeliverBehindDroppedClaim = (input: {
  dropped: RadioTaskRecord;
  behind: RadioTaskRecord[];
}): RadioTaskRecord | null => {
  // only a dropped claim leaves a deliver without its claim
  if (input.dropped.status !== RadioTaskStatus.CLAIMED) return null;

  // the first deliver that waited behind it
  return (
    input.behind.find(
      (record) => record.status === RadioTaskStatus.DELIVERED,
    ) ?? null
  );
};
