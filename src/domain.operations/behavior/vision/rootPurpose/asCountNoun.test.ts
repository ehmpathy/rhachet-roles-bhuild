import { given, then, useThen, when } from 'test-fns';

import { asCountNoun } from './asCountNoun';

const TEST_CASES: {
  description: string;
  given: { count: number };
  expect: { output: string };
}[] = [
  {
    description: 'zero takes the plural',
    given: { count: 0 },
    expect: { output: '0 layers' },
  },
  {
    description: 'one takes the singular',
    given: { count: 1 },
    expect: { output: '1 layer' },
  },
  {
    description: 'two takes the plural',
    given: { count: 2 },
    expect: { output: '2 layers' },
  },
];

describe('asCountNoun', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the count is cast to words', () => {
        const result = useThen('it casts', async () => ({
          output: asCountNoun({
            count: thisCase.given.count,
            singular: 'layer',
            plural: 'layers',
          }),
        }));

        then('it reads with the noun its count takes', () => {
          expect(result.output).toEqual(thisCase.expect.output);
        });
      });
    }),
  );
});
