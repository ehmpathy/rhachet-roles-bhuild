import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioPushCommandWithPromise } from '../cli/asRadioPushCommandWithPromise';
import type { RadioPushArgs } from '../cli/RadioPushArgs';
import { asRadioPromiseHoldCauseLine } from '../promise/asRadioPromiseHoldCauseLine';
import { asRadioPromiseHoldDetail } from '../promise/asRadioPromiseHoldDetail';
import { RADIO_PROMISE_PUBLIC_REPO } from '../promise/RADIO_PROMISE_PUBLIC_REPO';
import type { RadioPromiseHoldReason } from '../promise/RadioPromiseHoldReason';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioTreeLines } from './asRadioTreeLines';

type RadioTreeBranch = { line: string; children: string[] };

/**
 * .what = the three kinds of private detail the checklist names
 * .why = the caller checks its own text against a short, fixed list; a list it can read in one
 *        glance is one it actually reads before the re-run
 */
const CHECKLIST = [
  'the source org, repo, route path, or pr / issue numbers',
  'internal endpoint, service, table or product names',
  'customer, revenue or other business detail',
];

/**
 * .what = the label beside the repo: its visibility, or why it could not be read
 * .why = a token fault must read apart from a true public repo, or the caller vouches for a
 *        repo it could have reached as-human, and never learns the read failed
 *
 * .note = the claim alone; the read's cause renders as a child line (asRadioPromiseHoldCauseLine),
 *         so gh's own parens never nest inside this label's pair
 */
const asRepoLabel = (input: { reason: RadioPromiseHoldReason }): string => {
  if (input.reason === 'public-repo:unpromised') return 'public';
  return asRadioPromiseHoldDetail({ reason: input.reason, cause: null });
};

/**
 * .what = the branches for a body this push did not pass, carried from an earlier push
 * .why = a --promise vouches only for text it came with; the inherited body is dropped now,
 *        and the caller picks: status alone, or the body re-passed once checked
 */
const asInheritedBranches = (input: {
  record: RadioTaskRecord;
  recordPath: string;
}): RadioTreeBranch[] => [
  {
    line: `this record carries a body from an earlier push, at ${input.recordPath}`,
    children: ['a --promise here cannot vouch it; that body is dropped now'],
  },
  ...(input.record.status !== null
    ? [
        {
          line: 'to send status alone: re-run the same command, as you ran it',
          children: [],
        },
      ]
    : []),
  {
    line: 'to send the body too: check it (none of the three below), then re-pipe it into the command below',
    children: [],
  },
];

/**
 * .what = the branch for held updates that wait behind this push on its issue
 * .why = a dropped claim strands its deliver; the nudge names it, so no strand goes unseen
 */
const asBehindBranches = (input: {
  record: RadioTaskRecord;
  behind: number;
  deliverNeedsClaim: boolean;
}): RadioTreeBranch[] => {
  if (input.behind === 0) return [];
  const count =
    input.behind === 1
      ? `1 update waits behind it on #${input.record.exid}`
      : `${input.behind} updates wait behind it on #${input.record.exid}`;
  const claim = input.deliverNeedsClaim
    ? '; its deliver needs this claim first'
    : '';
  // the backlog sends oldest first, so a re-run's new claim lands after the held deliver
  const children = input.deliverNeedsClaim
    ? [
        'a re-run sends that deliver first, and it is refused; push the deliver again once the claim lands',
      ]
    : [];
  return [{ line: `${count}${claim}`, children }];
};

/**
 * .what = the 🦫 nudge a push gets when its text would go to a public repo with no promise
 * .why = the text cannot be taken back once public, so the push stops before the send and
 *        names the check the promise vouches for, with the exact command to re-run once checked
 *
 * .note = layout: the backlog the push carried (if any), the tree, a blank line, then the command
 *         flush-left as the last line. a rail would prefix each line of a multi-line body, and a
 *         railed body would re-run changed; flush-left, it copies and re-runs byte for byte
 * .note = unreadable on an auth fault: the command is the `--auth as-human` re-run, with no
 *         promise, since a private repo then sends with none
 */
export const asRadioPromiseNudgeOutput = (input: {
  reason: RadioPromiseHoldReason;
  detail: string | null;
  record: RadioTaskRecord;
  recordPath: string;
  args: RadioPushArgs;
  behind: number;
  deliverNeedsClaim: boolean;
  backlogBranches: RadioTreeBranch[];
}): string => {
  const { reason, record, args } = input;
  const isAuthCure = reason === 'public-repo:unreadable-auth';
  const isInherited = args.description === null && record.description !== null;
  const isStdin = args.description === '@stdin' || isInherited;
  // a claim or deliver that carries a note is blocked whole; its status alone needs no promise
  const isStatusWithText = args.status !== null && args.description !== null;

  // the command to re-run: the auth cure, or the push with its body re-passed and the promise
  const command = isAuthCure
    ? asRadioPushCommandWithPromise({
        args: { ...args, auth: 'as-human' },
        promise: null,
      })
    : asRadioPushCommandWithPromise({
        args: isInherited ? { ...args, description: '@stdin' } : args,
        promise: RADIO_PROMISE_PUBLIC_REPO,
      });

  // the tree: repo, the cure or the inherited body, the strand, the checklist, the re-run
  const header =
    reason === 'public-repo:unpromised'
      ? '🦫 hold up — this task goes to a public repo'
      : '🦫 hold up — this task may go to a public repo';
  const branches: RadioTreeBranch[] = [
    {
      line: `repo: ${asRadioTaskRepoSlug({ repo: record.repo })} (${asRepoLabel(input)})`,
      children: [asRadioPromiseHoldCauseLine({ detail: input.detail })].filter(
        (line): line is string => line !== null,
      ),
    },
    ...(isAuthCure
      ? [
          {
            line: 'first: re-run with --auth as-human; a private repo then sends with no promise',
            children: [],
          },
          // a peer, not a child: a host with no human login cannot run the cure; the vouch is its way through
          {
            line: `or, with no human login or a public repo: check the text, then add --promise ${RADIO_PROMISE_PUBLIC_REPO} instead`,
            children: [],
          },
        ]
      : []),
    ...(isInherited ? asInheritedBranches(input) : []),
    ...asBehindBranches({
      record,
      behind: input.behind,
      deliverNeedsClaim: input.deliverNeedsClaim,
    }),
    ...(isStatusWithText
      ? [
          {
            line: 'to send status alone: re-run it without --description',
            children: [],
          },
        ]
      : []),
    { line: 'the title and body must hold none of', children: CHECKLIST },
    ...(isStdin && !isInherited
      ? [
          {
            line: 're-pipe the checked body into the command below',
            // the piped body is gone from the shell; its record file still holds it
            children: [`the body this push piped: ${input.recordPath}`],
          },
        ]
      : []),
    {
      // scoped to this push: a backlog above it may have just gone out. a body piped from
      // stdin is gone from the shell, so the command runs only with it piped back in
      line: isStdin
        ? 'this push: naught sent, naught queued; once checked, run the command below with the body piped in'
        : 'this push: naught sent, naught queued; once checked, re-run the command below',
      children: [],
    },
  ];

  // the backlog first, then the nudge, then the command as the last line
  const backlog = input.backlogBranches.length
    ? [
        '🌊 the backlog',
        ...asRadioTreeLines({ branches: input.backlogBranches }),
        '',
      ]
    : [];
  return [
    ...backlog,
    header,
    ...asRadioTreeLines({ branches }),
    '',
    command,
  ].join('\n');
};
