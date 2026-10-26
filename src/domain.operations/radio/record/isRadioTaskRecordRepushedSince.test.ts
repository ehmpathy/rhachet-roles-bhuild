import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { isRadioTaskRecordRepushedSince } from './isRadioTaskRecordRepushedSince';

const read = new RadioTaskRecord({
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
  recordStatus: RadioTaskRecordStatus.QUEUED,
  reason: null,
  heldSeq: 4,
  deliveredExid: null,
});

const TEST_CASES = [
  {
    description: 'the same record is no re-push',
    given: { current: read },
    expect: { output: false },
  },
  {
    description: "the drain's own fate change is no re-push",
    given: {
      current: new RadioTaskRecord({
        ...read,
        recordStatus: RadioTaskRecordStatus.DELIVERED,
        reason: null,
        deliveredExid: '42',
      }),
    },
    expect: { output: false },
  },
  {
    description: 'a new body is a re-push',
    given: {
      current: new RadioTaskRecord({
        ...read,
        description: 'remind each surfer two days ahead',
      }),
    },
    expect: { output: true },
  },
  {
    description: 'a new auth is a re-push',
    given: { current: new RadioTaskRecord({ ...read, auth: 'as-human' }) },
    expect: { output: true },
  },
  {
    description: 'a new target repo is a re-push',
    given: {
      current: new RadioTaskRecord({
        ...read,
        repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-rentals' }),
      }),
    },
    expect: { output: true },
  },
];

describe('isRadioTaskRecordRepushedSince', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        isRadioTaskRecordRepushedSince({
          read,
          current: thisCase.given.current,
        }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
