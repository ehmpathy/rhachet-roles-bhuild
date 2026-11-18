import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { getAllRadioFatesAwaitPromise } from './getAllRadioFatesAwaitPromise';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

const genRecord = (input: { reason: string | null }): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'f0e1d2c3b4a59687',
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'wave-feed' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: 'wave feed repair',
    description: 'the feed lags a tide',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: input.reason,
    heldSeq: 1,
    deliveredExid: null,
    promise: null,
  });

const genHeld = (input: { reason: string | null }): RadioTaskRecordFate => ({
  fate: 'held',
  record: genRecord(input),
  dir: '.behavior/.radio',
  lift: null,
  detail: null,
  halt: false,
});

const TEST_CASES: {
  description: string;
  given: { fates: RadioTaskRecordFate[] };
  expect: { count: number };
}[] = [
  {
    description: 'no fates: none await a promise',
    given: { fates: [] },
    expect: { count: 0 },
  },
  {
    description:
      'a held record with an upstream fault does not await a promise',
    given: { fates: [genHeld({ reason: 'upstream:transient' })] },
    expect: { count: 0 },
  },
  {
    description: 'each held record the promise gate set awaits a promise',
    given: {
      fates: [
        genHeld({ reason: 'upstream:transient' }),
        genHeld({ reason: 'public-repo:unreadable-auth' }),
        genHeld({ reason: 'public-repo:unpromised' }),
      ],
    },
    expect: { count: 2 },
  },
  {
    description: 'a refused record with a promise reason does not wait at all',
    given: {
      fates: [
        {
          fate: 'refused',
          record: genRecord({ reason: 'public-repo:unpromised' }),
          detail: 'refused',
        },
      ],
    },
    expect: { count: 0 },
  },
];

describe('getAllRadioFatesAwaitPromise', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the fates that await a promise are picked', () => {
        then(`${thisCase.expect.count} are picked, each held`, () => {
          const output = getAllRadioFatesAwaitPromise(thisCase.given);
          expect(output).toHaveLength(thisCase.expect.count);
          expect(output.every((fate) => fate.fate === 'held')).toEqual(true);
        });
      });
    }),
  );
});
