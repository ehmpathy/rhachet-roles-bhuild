import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

/**
 * .what = the task payload radioTaskPush takes, from a record, with only its set fields
 * .why = a null on the record means "leave as is" upstream, so it must be absent, not null
 */
export const asRadioTaskPayloadFromRecord = (input: {
  record: RadioTaskRecord;
}): {
  repo: RadioTaskRepo;
  exid?: string;
  title?: string;
  description?: string;
  status?: RadioTaskStatus;
} => ({
  repo: input.record.repo,
  ...(input.record.exid !== null && { exid: input.record.exid }),
  ...(input.record.title !== null && { title: input.record.title }),
  ...(input.record.description !== null && {
    description: input.record.description,
  }),
  ...(input.record.status !== null && { status: input.record.status }),
});
