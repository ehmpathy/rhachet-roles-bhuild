import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioFateFromSettledRecord } from './asRadioFateFromSettledRecord';

const genRecord = (input: {
  recordStatus: RadioTaskRecordStatus;
  reason: string | null;
}): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: 'lesson reminder flakes',
    description: 'the 9am reminder sends twice',
    exid: null,
    status: null,
    recordStatus: input.recordStatus,
    reason: input.reason,
    heldSeq: 1,
    deliveredExid: null,
    promise: null,
  });

const TEST_CASES = [
  {
    description: 'a delivered record reads landed',
    given: { recordStatus: RadioTaskRecordStatus.DELIVERED, reason: null },
    expect: { fate: 'landed', detail: null },
  },
  {
    description: 'a refused record reads refused, its reason the detail',
    given: {
      recordStatus: RadioTaskRecordStatus.REFUSED,
      reason: 'upstream:access',
    },
    expect: { fate: 'refused', detail: 'upstream:access' },
  },
  {
    description: 'a record a human dropped reads refused, its why the detail',
    given: {
      recordStatus: RadioTaskRecordStatus.DROPPED,
      reason: 'dropped: wrong repo',
    },
    expect: { fate: 'refused', detail: 'dropped: wrong repo' },
  },
  {
    description:
      'a record the promise gate dropped renders the human why, never the raw code',
    given: {
      recordStatus: RadioTaskRecordStatus.DROPPED,
      reason: 'public-repo:unpromised',
    },
    expect: {
      fate: 'refused',
      detail: 'dropped: public repo, no anonymized promise on this record',
    },
  },
  {
    description: 'a queued record has no settled fate',
    given: { recordStatus: RadioTaskRecordStatus.QUEUED, reason: null },
    expect: { fate: null, detail: null },
  },
];

describe('asRadioFateFromSettledRecord', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the fate is read', () => {
        then('it reads as expected', () => {
          const fate = asRadioFateFromSettledRecord({
            record: genRecord(thisCase.given),
          });
          expect(fate?.fate ?? null).toEqual(thisCase.expect.fate);
          expect(fate && 'detail' in fate ? fate.detail : null).toEqual(
            thisCase.expect.detail,
          );
        });
      });
    }),
  );
});
