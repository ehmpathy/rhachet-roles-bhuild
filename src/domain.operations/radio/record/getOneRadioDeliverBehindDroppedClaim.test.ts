import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { getOneRadioDeliverBehindDroppedClaim } from './getOneRadioDeliverBehindDroppedClaim';

const genRecord = (input: {
  key: string;
  status: RadioTaskStatus | null;
  heldSeq: number;
}): RadioTaskRecord =>
  new RadioTaskRecord({
    key: input.key,
    kind: 'update',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: null,
    description: null,
    exid: '599',
    status: input.status,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: null,
    heldSeq: input.heldSeq,
    deliveredExid: null,
  });

const claim = genRecord({
  key: 'c1',
  status: RadioTaskStatus.CLAIMED,
  heldSeq: 1,
});
const edit = genRecord({ key: 'e1', status: null, heldSeq: 1 });
const deliver = genRecord({
  key: 'd1',
  status: RadioTaskStatus.DELIVERED,
  heldSeq: 2,
});
const editLater = genRecord({ key: 'e2', status: null, heldSeq: 2 });

const TEST_CASES = [
  {
    description: 'a dropped claim with a deliver behind it names the deliver',
    given: { dropped: claim, behind: [editLater, deliver] },
    expect: { key: 'd1' },
  },
  {
    description: 'a dropped claim with only edits behind it names none',
    given: { dropped: claim, behind: [editLater] },
    expect: { key: null },
  },
  {
    description: 'a dropped edit with a deliver behind it names none',
    given: { dropped: edit, behind: [deliver] },
    expect: { key: null },
  },
];

describe('getOneRadioDeliverBehindDroppedClaim', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const found = getOneRadioDeliverBehindDroppedClaim(thisCase.given);
      expect(found?.key ?? null).toEqual(thisCase.expect.key);
    }),
  );
});
