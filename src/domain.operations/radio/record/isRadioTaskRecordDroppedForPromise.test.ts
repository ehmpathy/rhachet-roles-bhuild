import { given, then, when } from 'test-fns';

import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';

import { isRadioTaskRecordDroppedForPromise } from './isRadioTaskRecordDroppedForPromise';

const TEST_CASES: {
  description: string;
  given: { recordStatus: RadioTaskRecordStatus; reason: string | null };
  expect: { output: boolean };
}[] = [
  {
    description: 'a record the gate dropped for its promise',
    given: {
      recordStatus: RadioTaskRecordStatus.DROPPED,
      reason: 'public-repo:unpromised',
    },
    expect: { output: true },
  },
  {
    description: 'a record a human dropped, with a why',
    given: {
      recordStatus: RadioTaskRecordStatus.DROPPED,
      reason: 'a twin of the lesson reminder',
    },
    expect: { output: false },
  },
  {
    description: 'a record held for its promise, not dropped',
    given: {
      recordStatus: RadioTaskRecordStatus.QUEUED,
      reason: 'public-repo:unreadable',
    },
    expect: { output: false },
  },
];

describe('isRadioTaskRecordDroppedForPromise', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the record is asked whether the gate dropped it', () => {
        then(`it reads ${thisCase.expect.output}`, () => {
          expect(isRadioTaskRecordDroppedForPromise(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
