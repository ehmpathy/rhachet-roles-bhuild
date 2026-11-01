import { asRadioFaultDetailLine } from './asRadioFaultDetailLine';
import { asRadioHaltLines } from './asRadioHaltLines';
import { asRadioNestedLines } from './asRadioNestedLines';
import { asRadioQueueFixLines } from './asRadioQueueFixLines';
import { asRadioReasonBehindOnIssue } from './asRadioReasonBehindOnIssue';
import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { isRadioFateBehindHalt } from './isRadioFateBehindHalt';
import { isRadioFateRepushedMidSend } from './isRadioFateRepushedMidSend';
import { isRadioFateUnattempted } from './isRadioFateUnattempted';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = one still-held row of a drain: its label, why it waits, and its next move
 * .why = four kinds of wait read four ways — a fault of its own (fault + fix), a wall
 *        (halted / behind the halt), an earlier update to the same issue (behind it, no fix
 *        of its own), and a record this drain never sent (not attempted, no stale fault)
 */
export const asRadioDrainHeldRow = (input: {
  fate: Extract<RadioTaskRecordFate, { fate: 'held' }>;
  authOverride: string | null;
}): string => {
  const { fate } = input;
  // the key leads the row, as in `queue get`, so a human can amend, drop, or find it from here
  const label = `${fate.record.key} ${asRadioTaskRecordLabel(fate)} → ${asRadioTaskRepoSlug({ repo: fate.record.repo })}`;

  // a re-push rewrote it mid-send: the prior copy went upstream, the new request still waits
  if (isRadioFateRepushedMidSend({ fate }))
    return asRadioNestedLines({
      head: `${label} (prior copy sent; new request waits)`,
      lines: fate.detail ? [fate.detail] : [],
    });

  // never sent by this drain: the prior drain's reason is stale here, so it is not shown
  if (isRadioFateUnattempted({ fate }))
    return asRadioNestedLines({
      head: `${label} (not attempted)`,
      lines: fate.detail ? [fate.detail] : [],
    });

  // behind an earlier update to the same issue: no fault, no fix of its own
  const behind = asRadioReasonBehindOnIssue({ reason: fate.record.reason });
  if (behind)
    return asRadioNestedLines({
      head: `${label} (same issue #${behind.exid})`,
      lines: fate.detail ? [fate.detail] : [],
    });

  // a fault of its own, or a wall: the fault, the halt, then the fix — a gate's lift sits
  // under its own row, so it never reads as a lift for a faulted row beside it
  return asRadioNestedLines({
    head: `${label} (${fate.record.reason ?? 'not reached'})`,
    lines: [
      ...(isRadioFateBehindHalt({ fate })
        ? []
        : [asRadioFaultDetailLine({ detail: fate.detail })].filter(
            (line): line is string => line !== null,
          )),
      ...asRadioHaltLines({ fate }),
      ...asRadioQueueFixLines({
        record: fate.record,
        authOverride: input.authOverride,
        detail: fate.detail,
      }),
      ...(fate.lift ? [`lift it (human): ${fate.lift}`] : []),
    ],
  });
};
