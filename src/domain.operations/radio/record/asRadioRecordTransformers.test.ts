import {
  BadRequestError,
  ConstraintError,
  MalfunctionError,
  UnexpectedCodePathError,
} from 'helpful-errors';
import { asIsoTimeStamp } from 'iso-time';
import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asRadioFateHeldBehindHalt } from './asRadioFateHeldBehindHalt';
import { asRadioGateBlockedReason } from './asRadioGateBlockedReason';
import { asRadioHeldSinceLabel } from './asRadioHeldSinceLabel';
import { asRadioLiftCommand } from './asRadioLiftCommand';
import { asRadioOtherFates } from './asRadioOtherFates';
import { asRadioPushedFate } from './asRadioPushedFate';
import { asRadioTaskPayloadFromRecord } from './asRadioTaskPayloadFromRecord';
import { asRadioTaskRecordFromPush } from './asRadioTaskRecordFromPush';
import { asRadioTaskRecordHeldSeqNext } from './asRadioTaskRecordHeldSeqNext';
import { asRadioTaskRecordOrder } from './asRadioTaskRecordOrder';
import { asRadioUpstreamFault } from './asRadioUpstreamFault';
import { isRadioPushDelivered } from './isRadioPushDelivered';
import { isRadioReplayRefusal } from './isRadioReplayRefusal';
import { isRadioTaskRecordHeld } from './isRadioTaskRecordHeld';

const repo = new RadioTaskRepo({ owner: 'ehmpathy', name: 'rhachet' });

const genRecord = (input: Partial<RadioTaskRecord>): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'k',
    kind: 'create',
    repo,
    via: RadioChannel.OS_FILEOPS,
    auth: null,
    idem: null,
    title: 'fix flaky keyrack test',
    description: 'the test flakes',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: null,
    heldAt: asIsoTimeStamp('2026-09-29T09:14:37Z'),
    heldSeq: 1,
    settledAt: null,
    deliveredExid: null,
    ...input,
  });

const pushCreate = {
  repo,
  via: RadioChannel.OS_FILEOPS,
  auth: null,
  idem: null,
  title: 'fix flaky keyrack test',
  description: 'the test flakes',
  exid: null,
  status: null,
};

const nextPlace = {
  heldAt: asIsoTimeStamp('2026-09-29T10:00:00Z'),
  heldSeq: 7,
};

const TEST_CASES = [
  {
    description: 'lift: a global block lifts globally',
    when: (): unknown =>
      asRadioLiftCommand({ level: 'global', owner: 'ahbode' }),
    expect: 'rhx radio.uses --global allow',
  },
  {
    description: 'lift: an org block lifts via the target org',
    when: (): unknown => asRadioLiftCommand({ level: 'org', owner: 'ahbode' }),
    expect: 'rhx radio.uses --org ahbode allow',
  },
  {
    description: 'lift: a local or default block lifts locally',
    when: (): unknown =>
      asRadioLiftCommand({ level: 'default', owner: 'ahbode' }),
    expect: 'rhx radio.uses allow',
  },
  {
    description: 'refusal: a plain BadRequestError is a refusal',
    when: (): unknown =>
      isRadioReplayRefusal({
        error: new BadRequestError('task already claimed by different branch'),
      }),
    expect: true,
  },
  {
    description:
      'refusal: a ConstraintError (e.g. a rejected token) is a fault, not a refusal',
    when: (): unknown =>
      isRadioReplayRefusal({ error: new ConstraintError('token rejected') }),
    expect: false,
  },
  {
    description: 'refusal: a MalfunctionError is a fault, not a refusal',
    when: (): unknown =>
      isRadioReplayRefusal({ error: new MalfunctionError('gh failed') }),
    expect: false,
  },
  {
    description:
      'payload: a create carries title + description, no exid or status',
    when: (): unknown =>
      asRadioTaskPayloadFromRecord({ record: genRecord({}) }),
    expect: {
      repo,
      title: 'fix flaky keyrack test',
      description: 'the test flakes',
    },
  },
  {
    description: 'payload: a status update carries exid + status only',
    when: (): unknown =>
      asRadioTaskPayloadFromRecord({
        record: genRecord({
          kind: 'update',
          title: null,
          description: null,
          exid: '412',
          status: RadioTaskStatus.CLAIMED,
        }),
      }),
    expect: { repo, exid: '412', status: RadioTaskStatus.CLAIMED },
  },
  {
    description: 'held since: utc stamp to the minute',
    when: (): unknown => asRadioHeldSinceLabel({ record: genRecord({}) }),
    expect: 'held since 2026-09-29T09:14Z',
  },
  {
    description: 'fault: a ConstraintError (auth) is a send fault, kept as is',
    when: (): unknown => {
      const error = new ConstraintError('token absent');
      return asRadioUpstreamFault({ error }) === error;
    },
    expect: true,
  },
  {
    description:
      'fault: a BadRequestError (refusal) is a send fault, kept as is',
    when: (): unknown => {
      const error = new BadRequestError('task already claimed');
      return asRadioUpstreamFault({ error }) === error;
    },
    expect: true,
  },
  {
    description: 'fault: a MalfunctionError is a defect, never a send fault',
    when: (): unknown =>
      asRadioUpstreamFault({ error: new MalfunctionError('bug') }),
    expect: null,
  },
  {
    description:
      'fault: an UnexpectedCodePathError is a defect, never a send fault',
    when: (): unknown =>
      asRadioUpstreamFault({ error: new UnexpectedCodePathError('bug') }),
    expect: null,
  },
  {
    description:
      'fault: an exec error (duck-typed, cross-realm) is a send fault, as a MalfunctionError',
    when: (): unknown => {
      const fault = asRadioUpstreamFault({
        error: { message: 'Command failed: gh issue create', cmd: 'gh' },
      });
      return {
        isMalfunction: fault instanceof MalfunctionError,
        hasMessage: !!fault?.message.includes(
          'Command failed: gh issue create',
        ),
      };
    },
    expect: { isMalfunction: true, hasMessage: true },
  },
  {
    description: 'fault: an fs error (code + syscall + path) is a send fault',
    when: (): unknown =>
      asRadioUpstreamFault({
        error: {
          message: 'EACCES',
          code: 'EACCES',
          syscall: 'open',
          path: '/x',
        },
      })?.message.includes('EACCES'),
    expect: true,
  },
  {
    description:
      'fault: a code + syscall with no path is a defect, never a send fault',
    when: (): unknown =>
      asRadioUpstreamFault({
        error: { message: 'EACCES', code: 'EACCES', syscall: 'open' },
      }),
    expect: null,
  },
  {
    description: 'fault: a TypeError is a defect, never a send fault',
    when: (): unknown =>
      asRadioUpstreamFault({ error: new TypeError('x is undefined') }),
    expect: null,
  },
  {
    description: 'gate reason: an @all block names @all, apart from an org',
    when: (): unknown =>
      asRadioGateBlockedReason({
        gate: { allowed: false, reason: '@all blocked', level: 'org' },
      }),
    expect: 'radio.uses:blocked — @all',
  },
  {
    description: 'gate reason: a specific-org block names org',
    when: (): unknown =>
      asRadioGateBlockedReason({
        gate: { allowed: false, reason: 'org blocked', level: 'org' },
      }),
    expect: 'radio.uses:blocked — org',
  },
  {
    description: 'order: an older heldAt drains first',
    when: (): unknown =>
      asRadioTaskRecordOrder({
        a: {
          record: genRecord({ heldAt: asIsoTimeStamp('2026-09-29T09:14:00Z') }),
        },
        b: {
          record: genRecord({ heldAt: asIsoTimeStamp('2026-09-29T09:15:00Z') }),
        },
      }) < 0,
    expect: true,
  },
  {
    description: 'order: a same-second tie breaks by heldSeq',
    when: (): unknown =>
      asRadioTaskRecordOrder({
        a: { record: genRecord({ heldSeq: 3 }) },
        b: { record: genRecord({ heldSeq: 2 }) },
      }) > 0,
    expect: true,
  },
  {
    description: 'order: a full tie breaks by key, by code unit (B before a)',
    when: (): unknown =>
      asRadioTaskRecordOrder({
        a: { record: genRecord({ key: 'B' }) },
        b: { record: genRecord({ key: 'a' }) },
      }) < 0,
    expect: true,
  },
  {
    description: 'from push: a first push is QUEUED at the next place in line',
    when: (): unknown => {
      const record = asRadioTaskRecordFromPush({
        key: 'k',
        push: pushCreate,
        before: null,
        next: nextPlace,
      });
      return [record.recordStatus, record.heldAt, record.heldSeq, record.kind];
    },
    expect: [RadioTaskRecordStatus.QUEUED, nextPlace.heldAt, 7, 'create'],
  },
  {
    description:
      'from push: a verbatim re-push of a delivered record keeps its place and fate',
    when: (): unknown => {
      const record = asRadioTaskRecordFromPush({
        key: 'k',
        push: pushCreate,
        before: genRecord({
          recordStatus: RadioTaskRecordStatus.DELIVERED,
          deliveredExid: '412',
        }),
        next: nextPlace,
      });
      return [record.recordStatus, record.deliveredExid, record.heldSeq];
    },
    expect: [RadioTaskRecordStatus.DELIVERED, '412', 1],
  },
  {
    description:
      'from push: a new body re-queues a delivered record, place kept, fate reset',
    when: (): unknown => {
      const record = asRadioTaskRecordFromPush({
        key: 'k',
        push: { ...pushCreate, description: 'a new body' },
        before: genRecord({
          recordStatus: RadioTaskRecordStatus.DELIVERED,
          deliveredExid: '412',
        }),
        next: nextPlace,
      });
      return [record.recordStatus, record.deliveredExid, record.heldSeq];
    },
    expect: [RadioTaskRecordStatus.QUEUED, null, 1],
  },
  {
    description: 'from push: an exid push is an update',
    when: (): unknown =>
      asRadioTaskRecordFromPush({
        key: 'k',
        push: {
          ...pushCreate,
          title: null,
          description: null,
          exid: '412',
          status: RadioTaskStatus.CLAIMED,
        },
        before: null,
        next: nextPlace,
      }).kind,
    expect: 'update',
  },
  {
    description: 'heldSeq next: no records takes 1',
    when: (): unknown => asRadioTaskRecordHeldSeqNext({ records: [] }),
    expect: 1,
  },
  {
    description: 'heldSeq next: one past the highest',
    when: (): unknown =>
      asRadioTaskRecordHeldSeqNext({
        records: [
          { record: genRecord({ heldSeq: 4 }) },
          { record: genRecord({ heldSeq: 2 }) },
        ],
      }),
    expect: 5,
  },
  {
    description: 'other fates: this push own fate is dropped, the rest kept',
    when: (): unknown =>
      asRadioOtherFates({
        fates: [
          { fate: 'refused', record: genRecord({ key: 'k' }), detail: 'x' },
          { fate: 'refused', record: genRecord({ key: 'j' }), detail: 'y' },
        ],
        record: genRecord({ key: 'k' }),
      }).map((fate) => fate.record.key),
    expect: ['j'],
  },
  {
    description: 'pushed: a push the drain carried reads its reported fate',
    when: (): unknown =>
      asRadioPushedFate({
        fates: [
          {
            fate: 'refused',
            record: genRecord({ key: 'k' }),
            detail: 'stale',
          },
        ],
        record: genRecord({ key: 'k' }),
      }).fate,
    expect: 'refused',
  },
  {
    description:
      'pushed: a push absent from the drain that already landed reads landed',
    when: (): unknown =>
      asRadioPushedFate({
        fates: [],
        record: genRecord({ recordStatus: RadioTaskRecordStatus.DELIVERED }),
      }).fate,
    expect: 'landed',
  },
  {
    description: 'pushed: a held push absent from the drain fails loud',
    when: (): unknown => {
      try {
        asRadioPushedFate({ fates: [], record: genRecord({}) });
        return 'no throw';
      } catch (error) {
        return error instanceof MalfunctionError;
      }
    },
    expect: true,
  },
  {
    description: 'delivered: a landed push counts as delivered',
    when: (): unknown =>
      isRadioPushDelivered({
        pushed: { fate: 'landed', record: genRecord({}) },
      }),
    expect: true,
  },
  {
    description: 'delivered: a refused push does not',
    when: (): unknown =>
      isRadioPushDelivered({
        pushed: { fate: 'refused', record: genRecord({}), detail: 'stale' },
      }),
    expect: false,
  },
  {
    description: 'behind a halt: the record stays held, with the fault reason',
    when: (): unknown => {
      const fate = asRadioFateHeldBehindHalt({
        record: genRecord({ key: 'later' }),
        halter: {
          fate: 'held',
          record: genRecord({ reason: 'upstream:401' }),
          lift: null,
          detail: 'token rejected',
          halt: true,
        },
      });
      return fate.fate === 'held'
        ? [fate.record.key, fate.record.reason, fate.detail, fate.halt]
        : fate.fate;
    },
    expect: ['later', 'upstream:401', 'token rejected', false],
  },
  {
    description: 'held: only a QUEUED record is held',
    when: (): unknown => [
      isRadioTaskRecordHeld({ record: genRecord({}) }),
      isRadioTaskRecordHeld({
        record: genRecord({ recordStatus: RadioTaskRecordStatus.REFUSED }),
      }),
    ],
    expect: [true, false],
  },
];

describe('radio record transformers', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the transformer runs', () => {
        then('it yields the expected value', () => {
          expect(thisCase.when()).toEqual(thisCase.expect);
        });
      });
    }),
  );
});
