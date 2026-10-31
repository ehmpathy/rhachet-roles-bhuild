import { asRadioDrainSections } from './asRadioDrainSections';
import { asRadioTreeLines } from './asRadioTreeLines';
import { isRadioFateRepushedMidSend } from './isRadioFateRepushedMidSend';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the header of a drain, by what it delivered
 * .why = the one line a human skims must agree with the tail and the exit: "the backlog is
 *        delivered" only when every record went; a partial drain says part went; a drain that
 *        sent naught never cheers. the words match a push that rode a drain (asRadioPushOutput)
 */
const asDrainHeader = (input: { fates: RadioTaskRecordFate[] }): string => {
  const isAnyDelivered = input.fates.some((fate) => fate.fate === 'delivered');
  const isAllDelivered = input.fates.every((fate) => fate.fate === 'delivered');
  if (isAllDelivered) return '🦫 back in the river! the backlog is delivered';
  if (isAnyDelivered)
    return '🦫 back in the river! part of the backlog is delivered';
  const isAnyCopySent = input.fates.some((fate) =>
    isRadioFateRepushedMidSend({ fate }),
  );
  if (isAnyCopySent)
    return '🦫 a prior copy went upstream; its new request still waits';
  const isAnyHeld = input.fates.some((fate) => fate.fate === 'held');
  if (isAnyHeld) return '🦫 naught delivered; the backlog still waits';
  return '🦫 naught delivered; upstream refused what the drain sent';
};

/**
 * .what = the stdout of `radio.task.queue drain`
 * .why = a drain with no push says what went, what closed, and what still waits, each held
 *        record with its next move; the backlog count tells whether the queue is clear
 */
export const asRadioDrainOutput = (input: {
  fates: RadioTaskRecordFate[];
  backlog: number;
  authOverride: string | null;
}): string => {
  // an empty queue: naught to drain
  if (input.fates.length === 0) return '🦫 naught held for the radio';

  // the sections, then the count left
  const sections = asRadioDrainSections({
    fates: input.fates,
    authOverride: input.authOverride,
  });
  return [
    asDrainHeader({ fates: input.fates }),
    ...asRadioTreeLines({
      branches: [
        ...sections.drained,
        ...sections.closedOrHeld,
        {
          line:
            input.backlog === 0
              ? 'backlog = 0'
              : `backlog = ${input.backlog} ${input.backlog === 1 ? 'awaits' : 'await'} the radio`,
          children: [],
        },
      ],
    }),
  ].join('\n');
};
