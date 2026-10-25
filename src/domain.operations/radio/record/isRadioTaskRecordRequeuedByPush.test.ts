import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { isRadioTaskRecordRequeuedByPush } from './isRadioTaskRecordRequeuedByPush';

const genRecord = (input: {
  recordStatus: RadioTaskRecordStatus;
}): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: 'lesson reminders',
    description: 'remind each surfer a day ahead',
    exid: null,
    status: null,
    recordStatus: input.recordStatus,
    reason: null,
    heldSeq: 1,
    deliveredExid: null,
  });

const TEST_CASES = [
  {
    description: 'a new push is queued',
    given: { before: null, description: 'remind each surfer a day ahead' },
    expect: { output: true },
  },
  {
    description: 'a refused record re-queues, since a human re-ran it',
    given: {
      before: genRecord({ recordStatus: RadioTaskRecordStatus.REFUSED }),
      description: 'remind each surfer a day ahead',
    },
    expect: { output: true },
  },
  {
    description: 'a dropped record re-queues, since a human re-ran it',
    given: {
      before: genRecord({ recordStatus: RadioTaskRecordStatus.DROPPED }),
      description: 'remind each surfer a day ahead',
    },
    expect: { output: true },
  },
  {
    description: 'a held record stays in its place; its fate is not reset',
    given: {
      before: genRecord({ recordStatus: RadioTaskRecordStatus.QUEUED }),
      description: 'remind each surfer two days ahead',
    },
    expect: { output: false },
  },
  {
    description: 'a verbatim re-push of a delivered task is a no-op',
    given: {
      before: genRecord({ recordStatus: RadioTaskRecordStatus.DELIVERED }),
      description: 'remind each surfer a day ahead',
    },
    expect: { output: false },
  },
  {
    description: 'a delivered task with a new body is a new request',
    given: {
      before: genRecord({ recordStatus: RadioTaskRecordStatus.DELIVERED }),
      description: 'remind each surfer two days ahead',
    },
    expect: { output: true },
  },
];

describe('isRadioTaskRecordRequeuedByPush', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        isRadioTaskRecordRequeuedByPush({
          before: thisCase.given.before,
          push: { description: thisCase.given.description },
        }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
