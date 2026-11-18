import { UnexpectedCodePathError } from 'helpful-errors';

import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { setRadioTaskComment } from '@src/domain.operations/radio/task/comment/setRadioTaskComment';
import { radioTaskPush } from '@src/domain.operations/radio/task/push/radioTaskPush';

import { asRadioTaskPayloadFromRecord } from './asRadioTaskPayloadFromRecord';
import { asRadioUpstreamFault } from './asRadioUpstreamFault';
import { asRadioUpstreamFaultText } from './asRadioUpstreamFaultText';
import type { RadioTaskRecordSent } from './RadioTaskRecordFate';

/**
 * .what = send one record upstream — a task via the extant findsert, a comment via the comment
 *         findsert; or name the fault that stopped it
 * .why = a send fault is an outcome the drain settles (held or refused); a defect
 *        outside the fault allowlist rethrows, so it fails loud
 *
 * .note = the kind is the one branch: the gate, auth, order, and settle paths around this send
 *         are the same for every record
 * .note = asRadioUpstreamFault decides, from the thrown value's own fields, whether it is a send
 *         fault or a defect. faultText is then what the fault's reason code is read from
 *         (asRadioUpstreamReason): the fault's message with the echoed gh command line cut out,
 *         so a title or body path in that line cannot pose as a fault
 */
export const setRadioTaskUpstreamFromRecord = async (
  input: { record: RadioTaskRecord },
  context: Parameters<typeof radioTaskPush>[1],
): Promise<
  { sent: RadioTaskRecordSent } | { fault: Error; faultText: string }
> => {
  try {
    return { sent: await setUpstreamOfRecordByKind(input, context) };
  } catch (error) {
    // a send fault is an outcome; all else is a defect, and fails loud
    const fault = asRadioUpstreamFault({ error });
    if (!fault) throw error;
    return { fault, faultText: asRadioUpstreamFaultText({ error }) };
  }
};

/**
 * .what = the send of one record, by its kind
 * .why = a comment posts on a thread; a create or an update goes through the task findsert
 */
const setUpstreamOfRecordByKind = async (
  input: { record: RadioTaskRecord },
  context: Parameters<typeof radioTaskPush>[1],
): Promise<RadioTaskRecordSent> => {
  // a comment: post it once on its thread
  const { record } = input;
  if (record.kind === 'comment') {
    // a comment record always names its thread and its body; one without is a defect, never a send
    if (record.exid === null || record.description === null)
      throw new UnexpectedCodePathError(
        'comment record lacks its exid or body; it cannot be sent',
        { key: record.key, exid: record.exid },
      );
    const posted = await setRadioTaskComment(
      {
        via: record.via,
        repo: record.repo,
        exid: record.exid,
        body: record.description,
      },
      context,
    );
    return {
      exid: record.exid,
      comment: { url: posted.url },
      outcome: posted.outcome,
    };
  }

  // a create or an update: the extant task findsert
  const pushed = await radioTaskPush(
    {
      via: record.via,
      idem: record.idem ?? undefined,
      task: asRadioTaskPayloadFromRecord({ record }),
    },
    context,
  );
  return { exid: pushed.task.exid, task: pushed.task, outcome: pushed.outcome };
};
