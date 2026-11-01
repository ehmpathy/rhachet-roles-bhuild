import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

/**
 * .what = the line that tells a caller its push is saved, when a fault follows the transcribe
 * .why = the record already landed on disk, so a fix + re-push delivers it, not a second transcribe
 */
export const asRadioPushSavedNotice = (input: {
  record: Pick<RadioTaskRecord, 'recordStatus'>;
  dir: string;
}): string =>
  `🦫 this push is saved, as ${input.record.recordStatus} in ${input.dir}/. fix the fault below, then push again to deliver it`;
