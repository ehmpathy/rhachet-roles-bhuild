import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { radioTaskPush } from '@src/domain.operations/radio/task/push/radioTaskPush';

import { asRadioTaskPayloadFromRecord } from './asRadioTaskPayloadFromRecord';
import { asRadioUpstreamFault } from './asRadioUpstreamFault';
import { asRadioUpstreamFaultText } from './asRadioUpstreamFaultText';

/**
 * .what = send one record's task upstream, via the extant findsert; or name the fault that stopped it
 * .why = a send fault is an outcome the drain settles (held or refused); a defect
 *        outside the fault allowlist rethrows, so it fails loud
 *
 * .note = asRadioUpstreamFault decides, from the thrown value's own fields, whether it is a send
 *         fault or a defect. faultText is then what the fault's reason code is read from
 *         (asRadioUpstreamReason): the fault's message with the echoed gh command line cut out,
 *         so a title or body path in that line cannot pose as a fault
 */
export const setRadioTaskUpstreamFromRecord = async (
  input: { record: RadioTaskRecord },
  context: Parameters<typeof radioTaskPush>[1],
): Promise<
  | { sent: Awaited<ReturnType<typeof radioTaskPush>> }
  | { fault: Error; faultText: string }
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
    return { fault, faultText: asRadioUpstreamFaultText({ error }) };
  }
};
