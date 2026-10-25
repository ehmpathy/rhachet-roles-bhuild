import { asRadioDrainSections } from './asRadioDrainSections';
import { asRadioTreeLines } from './asRadioTreeLines';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the stdout of `radio.task.queue drain`
 * .why = a drain with no push says what went, what closed, and what still waits, each held
 *        record with its next move; the backlog count tells whether the queue is clear
 */
export const asRadioDrainOutput = (input: {
  fates: RadioTaskRecordFate[];
  backlog: number;
}): string => {
  // an empty queue: naught to drain
  if (input.fates.length === 0) return '🦫 naught held for the radio';

  // the sections, then the count left
  const sections = asRadioDrainSections({ fates: input.fates });
  const isAnyDelivered = input.fates.some((fate) => fate.fate === 'delivered');
  const header = isAnyDelivered
    ? '🦫 back in the river! drained the radio'
    : '🦫 drained the radio; naught got through';
  return [
    header,
    ...asRadioTreeLines({
      branches: [
        ...sections.drained,
        ...sections.closedOrHeld,
        {
          line:
            input.backlog === 0
              ? 'backlog = 0'
              : `backlog = ${input.backlog} await the radio`,
          children: [],
        },
      ],
    }),
  ].join('\n');
};
