import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioHeldUpstreamFaults } from './asRadioHeldUpstreamFaults';
import { asRadioQueueFixLines } from './asRadioQueueFixLines';
import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import { asRadioTaskRecordState } from './asRadioTaskRecordState';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioTreeLines } from './asRadioTreeLines';

/**
 * .what = the state line of one held record: the plain word, then the reason code it rests on
 * .why = a reader acts on the word (lift, amend, wait); the code is what `asRadioQueueFixLines`
 *        and a search of the logs key on
 */
const asRadioTaskRecordStateLine = (input: {
  record: RadioTaskRecord;
  lift: string | null;
}): string => {
  const state = asRadioTaskRecordState(input);
  if (!input.record.reason) return `state: ${state}`;
  return `state: ${state} (${input.record.reason})`;
};

/**
 * .what = how many held records sit in each state, as stop-line phrases ("1 set aside")
 * .why = the stop line is one line; a count per state tells the human which move is owed
 *        before they run `queue get`
 */
const asStateCountPhrases = (input: {
  held: { record: RadioTaskRecord; lift: string | null }[];
}): string[] => {
  const states = input.held.map((one) => asRadioTaskRecordState(one));
  const phrases: [ReturnType<typeof asRadioTaskRecordState>, string][] = [
    ['held at gate', 'at a gate'],
    ['set aside', 'set aside'],
    ['halted', 'halted'],
    ['not reached', 'not reached'],
  ];
  return phrases.flatMap(([state, phrase]) => {
    const n = states.filter((one) => one === state).length;
    return n ? [`${n} ${phrase}`] : [];
  });
};

/**
 * .what = the held backlog, for a human who asks, or as a one-line stop reminder
 * .why = the clone reminds the human at stop: what waits, and how to free it.
 *        the reminder is one line (token-light) and naught when none is held
 *
 * .note = mode 'list' returns a tree; mode 'hook.onStop' returns one line, or null
 * .note = one row per task, by design. the push output details ONE task (task/into/status/held at);
 *         a backlog may hold many, so the list trades that detail for a row each. the label
 *         pair (`lift it (human):` ↔ `fix it:`) matches the push output on purpose; the one-line
 *         stop reminder keeps its own terse pair (`lift:` ↔ `fix:`)
 */
export const asRadioHeldOutput = (input: {
  held: { record: RadioTaskRecord; lift: string | null }[];
  mode: 'list' | 'hook.onStop';
}): string | null => {
  const { held, mode } = input;
  const count = held.length;
  const noun = count === 1 ? 'task' : 'tasks';
  const them = count === 1 ? 'it' : 'them';
  const lifts = [...new Set(held.flatMap(({ lift }) => (lift ? [lift] : [])))];
  const faults = asRadioHeldUpstreamFaults({ held });
  const frees = [
    ...(lifts.length ? [`lift: ${lifts.join(' + ')}`] : []),
    ...(faults.length ? [`fix: ${faults.join(' + ')}`] : []),
  ];

  // stop reminder: one line, or naught
  if (mode === 'hook.onStop' && count === 0) return null;
  if (mode === 'hook.onStop' && frees.length)
    return `🦫 ${count} ${noun} held for the radio · ${[...asStateCountPhrases({ held }), ...frees].join(' · ')} · next push delivers ${them}`;
  if (mode === 'hook.onStop')
    return `🦫 ${count} ${noun} held, the radio is open · next push delivers ${them}`;

  // list: the whole backlog, one row per record with its state, then its lift or its fixes
  if (count === 0) return '🦫 naught held for the radio';
  return [
    '🦫 held for the radio',
    ...asRadioTreeLines({
      branches: [
        ...held.map(({ record, lift }) => ({
          line: `${record.key} ${asRadioTaskRecordLabel({ record })} → ${asRadioTaskRepoSlug({ repo: record.repo })}`,
          children: [
            asRadioTaskRecordStateLine({ record, lift }),
            ...(lift ? [`lift it (human): ${lift}`] : []),
            ...asRadioQueueFixLines({ record }),
          ],
        })),
        {
          line: frees.length
            ? 'then the next push, or `rhx radio.task.queue drain`, delivers the backlog'
            : 'the radio is open, so the next push, or `rhx radio.task.queue drain`, delivers the backlog',
          children: [],
        },
      ],
    }),
  ].join('\n');
};
