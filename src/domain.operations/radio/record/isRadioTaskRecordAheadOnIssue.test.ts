import { given, then } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { isRadioTaskRecordAheadOnIssue } from './isRadioTaskRecordAheadOnIssue';

const genRecord = (input: {
  kind: RadioTaskRecord['kind'];
  exid: string | null;
  name?: string;
}): RadioTaskRecord =>
  new RadioTaskRecord({
    key: `${input.kind}-${input.exid}`,
    kind: input.kind,
    repo: new RadioTaskRepo({
      owner: 'sandpine',
      name: input.name ?? 'svc-lessons',
    }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: input.kind === 'create' ? 'lesson reminders' : null,
    description: input.kind === 'comment' ? 'the tide table test passes' : null,
    exid: input.exid,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: null,
    heldSeq: 1,
    deliveredExid: null,
  });

const TEST_CASES: {
  description: string;
  given: { ahead: RadioTaskRecord; behind: RadioTaskRecord };
  expect: boolean;
}[] = [
  {
    description: 'a held update holds back a later update on its issue',
    given: {
      ahead: genRecord({ kind: 'update', exid: '489' }),
      behind: genRecord({ kind: 'update', exid: '489' }),
    },
    expect: true,
  },
  {
    description: 'a held update holds back a later comment on its issue (F6)',
    given: {
      ahead: genRecord({ kind: 'update', exid: '489' }),
      behind: genRecord({ kind: 'comment', exid: '489' }),
    },
    expect: true,
  },
  {
    description: 'a held comment never holds back a later update on its issue',
    given: {
      ahead: genRecord({ kind: 'comment', exid: '489' }),
      behind: genRecord({ kind: 'update', exid: '489' }),
    },
    expect: false,
  },
  {
    description: 'a held comment never holds back a later comment',
    given: {
      ahead: genRecord({ kind: 'comment', exid: '489' }),
      behind: genRecord({ kind: 'comment', exid: '489' }),
    },
    expect: false,
  },
  {
    description: 'an update on another issue holds naught back',
    given: {
      ahead: genRecord({ kind: 'update', exid: '489' }),
      behind: genRecord({ kind: 'update', exid: '652' }),
    },
    expect: false,
  },
  {
    description:
      'an update with the same exid in another repo holds naught back',
    given: {
      ahead: genRecord({ kind: 'update', exid: '489' }),
      behind: genRecord({ kind: 'update', exid: '489', name: 'board-rentals' }),
    },
    expect: false,
  },
  {
    description: 'a create names no issue, so it waits on naught',
    given: {
      ahead: genRecord({ kind: 'update', exid: '489' }),
      behind: genRecord({ kind: 'create', exid: null }),
    },
    expect: false,
  },
];

describe('isRadioTaskRecordAheadOnIssue', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then(`it reads ${thisCase.expect}`, () => {
        expect(isRadioTaskRecordAheadOnIssue(thisCase.given)).toEqual(
          thisCase.expect,
        );
      });
    }),
  );
});
