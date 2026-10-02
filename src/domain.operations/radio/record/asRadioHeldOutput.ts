import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioHeldUpstreamFaults } from './asRadioHeldUpstreamFaults';
import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioTreeLines } from './asRadioTreeLines';

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
    return `🦫 ${count} ${noun} held for the radio · ${frees.join(' · ')} · next push delivers ${them}`;
  if (mode === 'hook.onStop')
    return `🦫 ${count} ${noun} held, the radio is open · next push delivers ${them}`;

  // list: the whole backlog
  if (count === 0) return '🦫 naught held for the radio';
  return [
    '🦫 held for the radio',
    ...asRadioTreeLines({
      branches: [
        ...held.map(({ record }) => ({
          line: `${asRadioTaskRecordLabel({ record })} → ${asRadioTaskRepoSlug({ repo: record.repo })} (${record.reason ?? 'not reached'})`,
          children: [],
        })),
        ...(lifts.length
          ? [{ line: `lift it (human): ${lifts.join(' + ')}`, children: [] }]
          : []),
        ...(faults.length
          ? [{ line: `fix it: ${faults.join(' + ')}`, children: [] }]
          : []),
        {
          line: frees.length
            ? 'then the next push delivers the backlog first'
            : 'the radio is open, so the next push delivers the backlog first',
          children: [],
        },
      ],
    }),
  ].join('\n');
};
