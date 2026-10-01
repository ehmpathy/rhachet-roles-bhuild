import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { radioTaskPush } from '@src/domain.operations/radio/task/push/radioTaskPush';

import { asRadioTaskPayloadFromRecord } from './asRadioTaskPayloadFromRecord';
import { asRadioUpstreamFault } from './asRadioUpstreamFault';

/**
 * .what = send one record's task upstream, via the extant findsert; or name the fault that stopped it
 * .why = a send fault is an outcome the drain settles (held or refused); a defect
 *        outside the fault allowlist rethrows, so it fails loud
 */
export const setRadioTaskUpstreamFromRecord = async (
  input: { record: RadioTaskRecord },
  context: Parameters<typeof radioTaskPush>[1],
): Promise<
  { sent: Awaited<ReturnType<typeof radioTaskPush>> } | { fault: Error }
> => {
  try {
    return {
      sent: await radioTaskPush(
        {
          via: input.record.via,
          idem: input.record.idem ?? undefined,
          task: asRadioTaskPayloadFromRecord({ record: input.record }),
        },
        context,
      ),
    };
  } catch (error) {
    // a send fault is an outcome; all else is a defect, and fails loud
    const fault = asRadioUpstreamFault({ error });
    if (!fault) throw error;
    return { fault };
  }
};
