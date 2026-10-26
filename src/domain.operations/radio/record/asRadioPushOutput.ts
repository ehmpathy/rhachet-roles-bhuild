import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { asTaskDetailOutput } from '@src/domain.operations/radio/cli/asTaskDetailOutput';

import { asRadioAuthShown } from './asRadioAuthShown';
import { asRadioDeliveredExid } from './asRadioDeliveredExid';
import { asRadioDeliveredLine } from './asRadioDeliveredLine';
import { asRadioDrainSections } from './asRadioDrainSections';
import { asRadioErrorHeadline } from './asRadioErrorHeadline';
import { asRadioErrorHintLines } from './asRadioErrorHintLines';
import { asRadioQueueFixLines } from './asRadioQueueFixLines';
import { asRadioReasonBehindOnIssue } from './asRadioReasonBehindOnIssue';
import { asRadioRefusalText } from './asRadioRefusalText';
import { asRadioReplayWarnLines } from './asRadioReplayWarnLines';
import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioTreeLines } from './asRadioTreeLines';
import { isRadioFateBehindHalt } from './isRadioFateBehindHalt';
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
 * .what = a record's target as owner/name
 * .why = one read for every line that names a target
 */
const asTarget = (input: { record: RadioTaskRecord }): string =>
  asRadioTaskRepoSlug({ repo: input.record.repo });

/**
 * .what = the reason a held push shows beside QUEUED
 * .why = a wait behind an earlier update to the same issue reads as a wait, not a code
 */
const asStatusReason = (input: { record: RadioTaskRecord }): string => {
  const behind = asRadioReasonBehindOnIssue({ reason: input.record.reason });
  if (behind)
    return `waits behind ${behind.aheadKey}, same issue #${behind.exid}`;
  return input.record.reason ?? 'not reached';
};

/**
 * .what = the backlog line
 * .why = the count is the nudge; zero says the pond is clear
 */
const asBacklogBranch = (input: { backlog: number }): RadioTreeBranch => ({
  line:
    input.backlog === 0
      ? 'backlog = 0'
      : `backlog = ${input.backlog} ${input.backlog === 1 ? 'awaits' : 'await'} the radio`,
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
 * .what = the final branches of a held push: who lifts the gate, or what to fix
 * .why = a gate names its lift command; a fault names its headline and hint lines; a record
 *        behind a halt met no wall itself, so it names the wait, never the wall's raw fault;
 *        a record behind an earlier update to the same issue has no fix of its own, so it
 *        points to the record ahead and promises no delivery the next push cannot make
 */
const asHeldFixBranches = (input: {
  held: Extract<RadioTaskRecordFate, { fate: 'held' }>;
}): RadioTreeBranch[] => [
  asHeldFixBranch(input),
  ...asHeldAmendBranches(input),
];

/**
 * .what = the amend branch of a held push whose stored auth no drain replays
 * .why = the amend is its own act, beside the lift, never a step of it; the auth it fixes rides
 *        beneath it, masked as the held list shows it, and states once that it will not replay
 */
const asHeldAmendBranches = (input: {
  held: Extract<RadioTaskRecordFate, { fate: 'held' }>;
}): RadioTreeBranch[] => {
  const { lift, record } = input.held;
  if (!lift) return [];
  return asRadioReplayWarnLines({ record }).map((line) => ({
    line,
    children: [`auth: ${asRadioAuthShown({ auth: record.auth })}`],
  }));
};

/**
 * .what = the first fix branch of a held push
 * .why = see asHeldFixBranches
 */
const asHeldFixBranch = (input: {
  held: Extract<RadioTaskRecordFate, { fate: 'held' }>;
}): RadioTreeBranch => {
  const { lift, detail, record } = input.held;
  const next = 'then the next push delivers the backlog first';
  const queue = asRadioQueueFixLines({ record, authOverride: null, detail });
  const behind = asRadioReasonBehindOnIssue({ reason: record.reason });
  // a stored auth no drain replays needs an amend too; "the next push delivers it" would
  // contradict it, since that push faults the record as upstream:auth until the auth is amended
  const isReplayable = asRadioReplayWarnLines({ record }).length === 0;
  if (lift)
    return {
      line: `lift it (human): ${lift}`,
      children: isReplayable ? [next] : [],
    };
  if (isRadioFateBehindHalt({ fate: input.held }))
    return {
      line: `waits behind the halt (${record.reason}): unsent, still in line`,
      // the `wait, then: … drain` move already sits on its still-held row; said once
      children: [
        'naught to fix on this one; the next drain sends it once the halt clears',
      ],
    };
  // the status line already names the wait; this branch names the move, by key
  if (behind)
    return {
      line: `fix the earlier update first: --key ${behind.aheadKey}`,
      children: [
        'see its fix: rhx radio.task.queue get',
        'this one sends on the next drain once that one lands or is dropped',
      ],
    };
  // no fault on record: naught to fix, it waits only for its turn
  if (!detail && !record.reason)
    return { line: 'naught to fix: no fault on record', children: [next] };
  if (!detail)
    return { line: `fix it: ${record.reason}`, children: [...queue, next] };
  return {
    line: `fix it: ${asRadioErrorHeadline({ message: detail })}`,
    children: [...asRadioErrorHintLines({ message: detail }), ...queue, next],
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
  const othersSections = asRadioDrainSections({
    fates: others,
    authOverride: null,
  });
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
          { line: `exid    = #${asRadioDeliveredExid(pushed)}`, children: [] },
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
            line: `status  = QUEUED (${asStatusReason({ record: pushed.record })})`,
            children: [],
          },
          { line: asHomeLine({ home }), children: [] },
          ...othersAll,
          asBacklogBranch({ backlog }),
          ...asHeldFixBranches({ held: pushed }),
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
            line: `status  = REFUSED (${asRadioRefusalText({ detail: pushed.detail })}) — closed, never retried`,
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
          children: [`${asRadioDeliveredLine(pushed)} (${pushed.outcome})`],
        },
        ...othersSections.closedOrHeld,
        asBacklogBranch({ backlog }),
      ],
    }),
  ].join('\n');
};
