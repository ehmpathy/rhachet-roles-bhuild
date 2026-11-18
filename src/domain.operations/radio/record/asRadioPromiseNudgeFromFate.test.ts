import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioPromiseNudgeFromFate } from './asRadioPromiseNudgeFromFate';

const genRecord = (overrides: Partial<RadioTaskRecord>): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'k1',
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: 't',
    description: 'b',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.DROPPED,
    reason: 'public-repo:unpromised',
    heldSeq: 1,
    deliveredExid: null,
    promise: null,
    ...overrides,
  });

const dir = '.behavior/.radio';
const held = (record: RadioTaskRecord) => ({
  fate: 'held' as const,
  record,
  dir,
  lift: null,
  detail: null,
  halt: false,
});

describe('asRadioPromiseNudgeFromFate', () => {
  given('[case1] a held fate, DROPPED, on a promise reason', () => {
    when('[t0] the nudge is read', () => {
      then('it returns the reason, the record, and its dir', () => {
        const record = genRecord({});
        expect(asRadioPromiseNudgeFromFate({ pushed: held(record) })).toEqual({
          reason: 'public-repo:unpromised',
          record,
          dir,
        });
      });
    });
  });

  given('[case2] fates that owe no nudge', () => {
    when('[t0] each is read', () => {
      then('a held QUEUED record on a promise reason → null', () => {
        const record = genRecord({
          recordStatus: RadioTaskRecordStatus.QUEUED,
        });
        expect(
          asRadioPromiseNudgeFromFate({ pushed: held(record) }),
        ).toBeNull();
      });
      then('a held DROPPED record on another reason → null', () => {
        const record = genRecord({ reason: 'upstream:auth' });
        expect(
          asRadioPromiseNudgeFromFate({ pushed: held(record) }),
        ).toBeNull();
      });
      then('a refused fate (a human drop) → null', () => {
        const record = genRecord({});
        expect(
          asRadioPromiseNudgeFromFate({
            pushed: { fate: 'refused', record, detail: 'dropped' },
          }),
        ).toBeNull();
      });
      then('a landed fate → null', () => {
        const record = genRecord({});
        expect(
          asRadioPromiseNudgeFromFate({ pushed: { fate: 'landed', record } }),
        ).toBeNull();
      });
    });
  });
});
