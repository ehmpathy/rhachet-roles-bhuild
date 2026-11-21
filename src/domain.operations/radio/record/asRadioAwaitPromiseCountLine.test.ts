import { given, then, when } from 'test-fns';

import { asRadioAwaitPromiseCountLine } from './asRadioAwaitPromiseCountLine';

const TEST_CASES: {
  description: string;
  given: { count: number };
  expect: { output: string };
}[] = [
  {
    description: 'one record awaits',
    given: { count: 1 },
    expect: { output: '1 awaits an anonymized promise: `drain --promise`' },
  },
  {
    description: 'several records await',
    given: { count: 3 },
    expect: { output: '3 await an anonymized promise: `drain --promise`' },
  },
];

describe('asRadioAwaitPromiseCountLine', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the count line renders', () => {
        then(`it reads: ${thisCase.expect.output}`, () => {
          expect(asRadioAwaitPromiseCountLine(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
