import { MalfunctionError } from 'helpful-errors';

import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { asTaskDetailOutput } from '@src/domain.operations/radio/cli/asTaskDetailOutput';

import { asRadioErrorHeadline } from './asRadioErrorHeadline';
import { asRadioErrorHintLines } from './asRadioErrorHintLines';
import { asRadioHeldSinceLabel } from './asRadioHeldSinceLabel';
import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioTreeLines } from './asRadioTreeLines';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

type RadioTreeBranch = { line: string; children: string[] };

/**
 * .what = where a push was recorded, as the human reads it
 * .why = a push with no single bound route must say where its record went, and why
 */
const asHomeLine = (input: {
  home: {
    dir: string;
    place: 'route' | 'unbound' | 'multibound';
    binds: string[];
  };
}): string => {
  const dir = `${input.home.dir}/`;
  if (input.home.place === 'unbound')
    return `held at = ${dir} (no route bound to this branch)`;
  if (input.home.place === 'multibound')
    return `held at = ${dir} (branch bound to ${input.home.binds.length} routes: ${input.home.binds.join(', ')})`;
  return `held at = ${dir}`;
};

/**
 * .what = the exid upstream gave a delivered record
 * .why = every delivery sets it; a delivered record without one is malformed, and
 *        must fail loud rather than print `#null` as though it were an exid
 */
const asDeliveredExid = (input: { record: RadioTaskRecord }): string => {
  if (input.record.deliveredExid !== null) return input.record.deliveredExid;
  throw new MalfunctionError('delivered radio task record lacks its exid', {
    key: input.record.key,
    hint: 'fix or remove the malformed record file in the .radio dir',
  });
};

/**
 * .what = a delivered record as one line: exid + label
 * .why = a create reads by its new exid; an update already names its exid
 */
const asDeliveredLine = (input: { record: RadioTaskRecord }): string => {
  const label = asRadioTaskRecordLabel(input);
  if (input.record.kind === 'update') return label;
  return `#${asDeliveredExid(input)} ${label}`;
};

/**
 * .what = a record's target as owner/name
 * .why = one read for every line that names a target
 */
const asTarget = (input: { record: RadioTaskRecord }): string =>
  asRadioTaskRepoSlug({ repo: input.record.repo });

/**
 * .what = the sections every drain reports on the records besides this push
 * .why = the drain rides this push; the human sees what else went, what closed, what waits.
 *        the sections come back keyed, so a caller places `drained` by name, never by label
 */
const asOthersSections = (input: {
  others: RadioTaskRecordFate[];
}): { drained: RadioTreeBranch[]; closedOrHeld: RadioTreeBranch[] } => {
  const drained = input.others.flatMap((fate) =>
    fate.fate === 'delivered'
      ? [
          fate.outcome === 'found'
            ? `${asDeliveredLine(fate)} (${asRadioHeldSinceLabel(fate)}; already upstream — marked delivered)`
            : `${asDeliveredLine(fate)} (${asRadioHeldSinceLabel(fate)})`,
        ]
      : [],
  );
  const refused = input.others.flatMap((fate) =>
    fate.fate === 'refused'
      ? [`${asRadioTaskRecordLabel(fate)} — ${fate.detail}`]
      : [],
  );
  const held = input.others.flatMap((fate) =>
    fate.fate === 'held'
      ? [
          `${asRadioTaskRecordLabel(fate)} → ${asTarget(fate)} (${fate.record.reason ?? 'not reached'})`,
        ]
      : [],
  );
  const lifts = [
    ...new Set(
      input.others.flatMap((fate) =>
        fate.fate === 'held' && fate.lift
          ? [`lift it (human): ${fate.lift}`]
          : [],
      ),
    ),
  ];
  return {
    drained: drained.length ? [{ line: 'drained', children: drained }] : [],
    closedOrHeld: [
      ...(refused.length
        ? [{ line: 'refused — closed, never retried', children: refused }]
        : []),
      ...(held.length
        ? [{ line: 'still held', children: [...held, ...lifts] }]
        : []),
    ],
  };
};

/**
 * .what = the backlog line
 * .why = the count is the nudge; zero says the pond is clear
 */
const asBacklogBranch = (input: { backlog: number }): RadioTreeBranch => ({
  line:
    input.backlog === 0
      ? 'backlog = 0'
      : `backlog = ${input.backlog} await the radio`,
  children: [],
});

/**
 * .what = the header of a delivered push that rode a drain
 * .why = the one line a human skims must agree with the tail: "the backlog is delivered"
 *        only when naught is left held; a partial drain says part of it went
 */
const asDrainHeader = (input: {
  others: RadioTaskRecordFate[];
  backlog: number;
}): string => {
  const isAnyDrained = input.others.some((fate) => fate.fate === 'delivered');
  if (!isAnyDrained) return '🦫 onto the pile!';
  if (input.backlog > 0)
    return '🦫 back in the river! part of the backlog is delivered';
  return '🦫 back in the river! the backlog is delivered';
};

/**
 * .what = the final branch of a held push: who lifts the gate, or what to fix
 * .why = a gate names its lift command; a fault names its headline and hint lines
 */
const asHeldFixBranch = (input: {
  held: Extract<RadioTaskRecordFate, { fate: 'held' }>;
}): RadioTreeBranch => {
  const { lift, detail, record } = input.held;
  const next = 'then the next push delivers the backlog first';
  if (lift) return { line: `lift it (human): ${lift}`, children: [next] };
  if (!detail) return { line: `fix it: ${record.reason}`, children: [next] };
  return {
    line: `fix it: ${asRadioErrorHeadline({ message: detail })}`,
    children: [...asRadioErrorHintLines({ message: detail }), next],
  };
};

/**
 * .what = the full stdout of a radio.task.push, from the fate of its record
 * .why = held reads as held (never lost), a drain lists what went, and the quiet
 *        common path stays today's output plus where it was recorded
 */
export const asRadioPushOutput = (input: {
  pushed: RadioTaskRecordFate | { fate: 'landed'; record: RadioTaskRecord };
  others: RadioTaskRecordFate[];
  home: {
    dir: string;
    place: 'route' | 'unbound' | 'multibound';
    binds: string[];
  };
  backlog: number;
}): string => {
  const { pushed, others, home, backlog } = input;
  const othersSections = asOthersSections({ others });
  const othersAll = [...othersSections.drained, ...othersSections.closedOrHeld];
  const facts = [
    { line: `task    = ${asRadioTaskRecordLabel(pushed)}`, children: [] },
    { line: `into    = ${asTarget(pushed)}`, children: [] },
  ];

  // already delivered: the local mark answers, naught is sent for it (C3); any backlog
  // the push carried out through an open gate is listed beside it (C6)
  if (pushed.fate === 'landed')
    return [
      '🦫 already delivered',
      ...asRadioTreeLines({
        branches: [
          ...facts,
          { line: `exid    = #${asDeliveredExid(pushed)}`, children: [] },
          ...othersAll,
          ...(othersAll.length ? [asBacklogBranch({ backlog })] : []),
        ],
      }),
    ].join('\n');

  // held: say so first, with why, where, how many, and who lifts it
  if (pushed.fate === 'held')
    return [
      '🦫 held for the radio',
      ...asRadioTreeLines({
        branches: [
          ...facts,
          {
            line: `status  = QUEUED (${pushed.record.reason ?? 'not reached'})`,
            children: [],
          },
          { line: asHomeLine({ home }), children: [] },
          ...othersAll,
          asBacklogBranch({ backlog }),
          asHeldFixBranch({ held: pushed }),
        ],
      }),
    ].join('\n');

  // refused: upstream will never take this replay; closed, loud
  if (pushed.fate === 'refused')
    return [
      '🦫 refused upstream',
      ...asRadioTreeLines({
        branches: [
          ...facts,
          {
            line: `status  = REFUSED (${pushed.detail}) — closed, never retried`,
            children: [],
          },
          ...othersAll,
          asBacklogBranch({ backlog }),
        ],
      }),
    ].join('\n');

  // delivered, alone: today's output, plus where it was recorded
  if (othersAll.length === 0)
    return [
      '🦫 onto the pile!',
      '',
      asTaskDetailOutput({
        task: pushed.task,
        via: pushed.record.via,
        outcome: pushed.outcome,
        cached: null,
        recorded: `${home.dir}/`,
      }),
    ].join('\n');

  // delivered, with the backlog it carried out; a partial drain never claims the whole
  return [
    asDrainHeader({ others, backlog }),
    ...asRadioTreeLines({
      branches: [
        ...othersSections.drained,
        {
          line: 'pushed',
          children: [`${asDeliveredLine(pushed)} (${pushed.outcome})`],
        },
        ...othersSections.closedOrHeld,
        asBacklogBranch({ backlog }),
      ],
    }),
  ].join('\n');
};
