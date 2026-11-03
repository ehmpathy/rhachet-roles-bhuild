import { given, then, when } from 'test-fns';

import { IdempotencyMode } from '@src/domain.objects/IdempotencyMode';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asRadioTaskRecordFromPush } from './asRadioTaskRecordFromPush';

const repo = new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' });

const genRecord = (input: {
  recordStatus: RadioTaskRecordStatus;
}): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'update',
    repo,
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: null,
    description: 'remind each surfer a day ahead',
    exid: '42',
    status: RadioTaskStatus.CLAIMED,
    recordStatus: input.recordStatus,
    reason: null,
    reasonHeadline: null,
    heldSeq: 3,
    deliveredExid: null,
  });

const genPush = (input: { description: string | null }) => ({
  repo,
  via: RadioChannel.GH_ISSUES,
  auth: 'as-human',
  idem: null,
  title: null,
  description: input.description,
  exid: '42',
  status: RadioTaskStatus.CLAIMED,
});

const TEST_CASES = [
  {
    description: 'a held record re-pushed with no body keeps its body',
    given: {
      before: genRecord({ recordStatus: RadioTaskRecordStatus.QUEUED }),
      description: null,
    },
    expect: {
      description: 'remind each surfer a day ahead',
      recordStatus: RadioTaskRecordStatus.QUEUED,
    },
  },
  {
    description:
      'a delivered record re-pushed with no body keeps its body and fate',
    given: {
      before: genRecord({ recordStatus: RadioTaskRecordStatus.DELIVERED }),
      description: null,
    },
    expect: {
      description: 'remind each surfer a day ahead',
      recordStatus: RadioTaskRecordStatus.DELIVERED,
    },
  },
  {
    description: 'a held record re-pushed with a new body takes the new body',
    given: {
      before: genRecord({ recordStatus: RadioTaskRecordStatus.QUEUED }),
      description: 'remind each surfer two days ahead',
    },
    expect: {
      description: 'remind each surfer two days ahead',
      recordStatus: RadioTaskRecordStatus.QUEUED,
    },
  },
  {
    description: 'a first push with no body holds no body',
    given: { before: null, description: null },
    expect: { description: null, recordStatus: RadioTaskRecordStatus.QUEUED },
  },
];

describe('asRadioTaskRecordFromPush', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const record = asRadioTaskRecordFromPush({
        key: 'a1b2c3d4e5f60718',
        push: genPush({ description: thisCase.given.description }),
        before: thisCase.given.before,
        heldSeq: 3,
      });
      expect(record.description).toEqual(thisCase.expect.description);
      expect(record.recordStatus).toEqual(thisCase.expect.recordStatus);
      expect(record.auth).toEqual('as-human');
      expect(record.heldSeq).toEqual(3);
    }),
  );

  describe('the words upstream said ride with the fate', () => {
    const HEADLINE =
      'GraphQL: Resource not accessible by integration (updateIssue)';
    const before = new RadioTaskRecord({
      ...genRecord({ recordStatus: RadioTaskRecordStatus.QUEUED }),
      reason: 'upstream:access',
      reasonHeadline: HEADLINE,
    });

    given('[case1] a set-aside record, re-pushed bare', () => {
      when('[t0] the push is transcribed', () => {
        then('the reason and its words are kept', () => {
          const record = asRadioTaskRecordFromPush({
            key: 'a1b2c3d4e5f60718',
            push: { ...genPush({ description: null }), auth: null },
            before,
            heldSeq: 3,
          });
          expect(record.reason).toEqual('upstream:access');
          expect(record.reasonHeadline).toEqual(HEADLINE);
        });
      });
    });

    given('[case2] a set-aside record, re-pushed with a new body', () => {
      when('[t0] the push is transcribed', () => {
        then('it keeps its place, its reason, and its words', () => {
          const record = asRadioTaskRecordFromPush({
            key: 'a1b2c3d4e5f60718',
            push: {
              ...genPush({ description: 'remind each surfer two days ahead' }),
              auth: null,
            },
            before,
            heldSeq: 3,
          });
          expect(record.recordStatus).toEqual(RadioTaskRecordStatus.QUEUED);
          expect(record.reason).toEqual('upstream:access');
          expect(record.reasonHeadline).toEqual(HEADLINE);
        });
      });
    });

    given('[case3] a refused record with words, re-pushed bare', () => {
      when('[t0] the push is transcribed', () => {
        then('it re-queues, so its reason and its words reset', () => {
          const refused = new RadioTaskRecord({
            ...before,
            recordStatus: RadioTaskRecordStatus.REFUSED,
          });
          const record = asRadioTaskRecordFromPush({
            key: 'a1b2c3d4e5f60718',
            push: { ...genPush({ description: null }), auth: null },
            before: refused,
            heldSeq: 3,
          });
          expect(record.recordStatus).toEqual(RadioTaskRecordStatus.QUEUED);
          expect(record.reason).toEqual(null);
          expect(record.reasonHeadline).toEqual(null);
        });
      });
    });
  });

  test('a bare re-push keeps the auth and idem a `queue set` amended', () => {
    const before = new RadioTaskRecord({
      ...genRecord({ recordStatus: RadioTaskRecordStatus.QUEUED }),
      auth: 'as-human',
      idem: IdempotencyMode.UPSERT,
    });
    const record = asRadioTaskRecordFromPush({
      key: 'a1b2c3d4e5f60718',
      push: { ...genPush({ description: null }), auth: null, idem: null },
      before,
      heldSeq: 3,
    });
    expect(record.auth).toEqual('as-human');
    expect(record.idem).toEqual(IdempotencyMode.UPSERT);
  });

  test('a re-push that names its own auth wins over the amend', () => {
    const before = new RadioTaskRecord({
      ...genRecord({ recordStatus: RadioTaskRecordStatus.QUEUED }),
      auth: 'as-human',
    });
    const record = asRadioTaskRecordFromPush({
      key: 'a1b2c3d4e5f60718',
      push: { ...genPush({ description: null }), auth: 'as-robot:env(TOKEN)' },
      before,
      heldSeq: 3,
    });
    expect(record.auth).toEqual('as-robot:env(TOKEN)');
  });
});
