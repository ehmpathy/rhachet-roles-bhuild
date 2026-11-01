import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioAuthShown } from './asRadioAuthShown';
import { asRadioQueueFixLines } from './asRadioQueueFixLines';
import { asRadioReasonBehindOnIssue } from './asRadioReasonBehindOnIssue';
import { asRadioReplayWarnLines } from './asRadioReplayWarnLines';
import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import { asRadioTaskRecordState } from './asRadioTaskRecordState';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioTreeLines } from './asRadioTreeLines';

type HeldEntry = { record: RadioTaskRecord; lift: string | null };
type HeldState = ReturnType<typeof asRadioTaskRecordState> | 'behind the halt';

/**
 * .what = the state of each held record, read against the whole backlog, in line order
 * .why = two states turn on the rest of the line, not the record alone:
 *        - a record behind an earlier update waits only while that record is still held; once
 *          it is dropped or delivered, the next drain re-checks it, so a stale `behind:` reason
 *          must not read as a live wait
 *        - the halter and every record behind it carry one halt reason; the first in line with
 *          it met the wall, the rest sat behind it unsent, as the drain's "behind the halt" says
 *
 * .note = `held` is oldest first (getAllRadioTaskRecordsHeld), which is the drain's line order
 */
const asHeldStates = (input: { held: HeldEntry[] }): HeldState[] => {
  const keysHeld = new Set(input.held.map(({ record }) => record.key));
  const states = input.held.map((entry) => asRadioTaskRecordState(entry));
  return states.map((state, index) => {
    const { record } = input.held[index]!;
    const behind = asRadioReasonBehindOnIssue({ reason: record.reason });
    if (state === 'waits behind' && behind && !keysHeld.has(behind.aheadKey))
      return 'not reached';
    const isHalterEarlier = input.held
      .slice(0, index)
      .some(
        (other, indexOther) =>
          states[indexOther] === 'halted' &&
          other.record.reason === record.reason,
      );
    if (state === 'halted' && isHalterEarlier) return 'behind the halt';
    return state;
  });
};

/**
 * .what = the state of the record this one waits behind on its issue, or null when none is held
 * .why = a wait behind a record with no fault owes no fix; the row must say so
 */
const asStateAhead = (input: {
  held: HeldEntry[];
  states: HeldState[];
  entry: HeldEntry;
}): HeldState | null => {
  const behind = asRadioReasonBehindOnIssue({
    reason: input.entry.record.reason,
  });
  if (!behind) return null;
  const indexAhead = input.held.findIndex(
    ({ record }) => record.key === behind.aheadKey,
  );
  return indexAhead < 0 ? null : input.states[indexAhead]!;
};

/**
 * .what = the state lines of one held record: the plain word, the code it rests on, and for a
 *         record behind another, a pointer to the fix that frees it
 * .why = a reader acts on the word (lift, amend, wait); the code is what `asRadioQueueFixLines`
 *        and a search of the logs key on
 */
const asHeldStateLines = (input: {
  entry: HeldEntry;
  state: HeldState;
  stateAhead: HeldState | null;
}): string[] => {
  const { record } = input.entry;
  const { state } = input;
  const behind = asRadioReasonBehindOnIssue({ reason: record.reason });

  // behind an earlier update that carries no fault now (e.g. just amended): naught to fix
  // first, so do not send the reader to fix it again
  if (state === 'waits behind' && behind && input.stateAhead === 'not reached')
    return [
      `state: waits behind ${behind.aheadKey} (same issue #${behind.exid})`,
      `sends right after ${behind.aheadKey} on the next drain`,
    ];

  // in line behind the record that met a wall: unsent, it goes once the halt clears
  if (state === 'behind the halt')
    return [
      `state: behind the halt (${record.reason}): unsent, still in line; the next drain sends it once the halt clears`,
    ];

  // behind an earlier update to the same issue, still held: name it, and point to its fix
  if (state === 'waits behind' && behind)
    return [
      `state: waits behind ${behind.aheadKey} (same issue #${behind.exid})`,
      `fix ${behind.aheadKey} above (amend, lift, or drop it); this one sends on the next drain after`,
    ];

  // behind a record no longer held: the wait is stale, the next drain re-checks it
  if (behind)
    return [
      `state: not reached (was behind ${behind.aheadKey}, no longer held; re-checked on next drain)`,
    ];

  // no reason on record: naught holds it but its turn
  if (!record.reason)
    return [`state: ${state} (no fault on record; the next drain sends it)`];

  // a gate reason on a record whose gate has since opened is history, not a cause
  if (state === 'not reached')
    return [`state: not reached (last held: ${record.reason}; since opened)`];
  return [`state: ${state} (${record.reason})`];
};

/**
 * .what = how many held records sit in each state, as stop-line phrases ("2 set aside (upstream:auth)")
 * .why = the stop line is one line; a count per state tells the human which move is owed
 *        before they run `queue get`. a fault code rides beside its count, never as a `fix:`,
 *        since a code is not a move
 */
const asStateCountPhrases = (input: {
  held: HeldEntry[];
  states: HeldState[];
}): string[] => {
  const entries = input.held.map((entry, index) => ({
    entry,
    state: input.states[index],
  }));
  const phrases: [HeldState, string, boolean][] = [
    ['held at gate', 'at a gate', false],
    ['set aside', 'set aside', true],
    ['halted', 'halted', true],
    ['behind the halt', 'behind the halt', false],
    ['waits behind', 'behind an earlier update to the same issue', false],
    ['not reached', 'not reached', false],
  ];
  return phrases.flatMap(([state, phrase, isCodeShown]) => {
    const matched = entries.filter((one) => one.state === state);
    if (!matched.length) return [];
    const codes = [
      ...new Set(matched.flatMap(({ entry }) => entry.record.reason ?? [])),
    ];
    return isCodeShown && codes.length
      ? [`${matched.length} ${phrase} (${codes.join(', ')})`]
      : [`${matched.length} ${phrase}`];
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
 *         stop reminder keeps its own terse `lift:`
 */
export const asRadioHeldOutput = (input: {
  held: HeldEntry[];
  mode: 'list' | 'hook.onStop';
}): string | null => {
  const { held, mode } = input;
  const count = held.length;
  const noun = count === 1 ? 'task' : 'tasks';
  const them = count === 1 ? 'it' : 'them';
  const states = asHeldStates({ held });
  const lifts = [...new Set(held.flatMap(({ lift }) => (lift ? [lift] : [])))];
  const isAnyOwed = states.some((state) => state !== 'not reached');

  // stop reminder: one line, or naught. a set-aside task re-faults on the next push, so the
  // line points to its fix; a halted one waits out its wall; else the next push delivers
  const tail = (() => {
    if (states.includes('set aside'))
      return 'see each fix: rhx radio.task.queue get';
    if (states.includes('halted')) return `the next drain retries ${them}`;
    return `next push delivers ${them}`;
  })();
  if (mode === 'hook.onStop' && count === 0) return null;
  if (mode === 'hook.onStop' && isAnyOwed)
    return `🦫 ${count} ${noun} held for the radio · ${[
      ...asStateCountPhrases({ held, states }),
      ...(lifts.length ? [`lift: ${lifts.join(' + ')}`] : []),
    ].join(' · ')} · ${tail}`;
  if (mode === 'hook.onStop')
    return `🦫 ${count} ${noun} held, the radio is open · next push delivers ${them}`;

  // list: the whole backlog, one row per record with its state, then its lift or its fixes
  if (count === 0) return '🦫 naught held for the radio';
  return [
    '🦫 held for the radio',
    ...asRadioTreeLines({
      branches: [
        ...held.map((entry, index) => {
          // every row reads state, then auth, then its moves, so one column scans down the list
          const [lineState, ...linesMove] = asHeldStateLines({
            entry,
            state: states[index]!,
            stateAhead: asStateAhead({ held, states, entry }),
          });
          return {
            line: `${entry.record.key} ${asRadioTaskRecordLabel(entry)} → ${asRadioTaskRepoSlug({ repo: entry.record.repo })}`,
            children: [
              lineState!,
              `auth: ${asRadioAuthShown({ auth: entry.record.auth })}`,
              ...linesMove,
              ...(entry.lift ? [`lift it (human): ${entry.lift}`] : []),
              ...asRadioReplayWarnLines({ record: entry.record }),
              ...asRadioQueueFixLines({
                record: entry.record,
                authOverride: null,
                detail: null,
              }),
            ],
          };
        }),
        {
          line: isAnyOwed
            ? 'then the next push, or `rhx radio.task.queue drain`, delivers the backlog'
            : 'the radio is open, so the next push, or `rhx radio.task.queue drain`, delivers the backlog',
          children: [],
        },
      ],
    }),
  ].join('\n');
};
