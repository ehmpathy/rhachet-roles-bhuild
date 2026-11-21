import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { isRadioTaskRecordTextUnvouched } from './isRadioTaskRecordTextUnvouched';

const base = new RadioTaskRecord({
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
  reason: 'radio.uses:blocked',
  heldSeq: 1,
  deliveredExid: null,
  promise: null,
});

const TEST_CASES = [
  {
    description: 'gh.issues text with no promise',
    given: { record: base },
    expect: { output: true },
  },
  {
    description: 'gh.issues text with a promise',
    given: {
      record: new RadioTaskRecord({
        ...base,
        promise: 'task-to-public-repo-is-anonymized',
      }),
    },
    expect: { output: false },
  },
  {
    description: 'a status-only gh.issues update',
    given: {
      record: new RadioTaskRecord({
        ...base,
        kind: 'update',
        exid: '5',
        title: null,
        description: null,
        status: RadioTaskStatus.CLAIMED,
      }),
    },
    expect: { output: false },
  },
  {
    description: 'os.fileops text with no promise',
    given: {
      record: new RadioTaskRecord({ ...base, via: RadioChannel.OS_FILEOPS }),
    },
    expect: { output: false },
  },
];

describe('isRadioTaskRecordTextUnvouched', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isRadioTaskRecordTextUnvouched(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
