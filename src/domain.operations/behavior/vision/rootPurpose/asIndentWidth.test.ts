import { given, then, useThen, when } from 'test-fns';

import { asIndentWidth } from './asIndentWidth';

const CASES: {
  description: string;
  given: { indent: string };
  expect: number;
}[] = [
  { description: 'no indent', given: { indent: '' }, expect: 0 },
  { description: 'two spaces', given: { indent: '  ' }, expect: 2 },
  {
    description: 'one tab, to the first tab stop',
    given: { indent: '\t' },
    expect: 4,
  },
  {
    description: 'two spaces then a tab, to the same tab stop',
    given: { indent: '  \t' },
    expect: 4,
  },
  { description: 'two tabs', given: { indent: '\t\t' }, expect: 8 },
  {
    description: 'a tab then two spaces, past the tab stop',
    given: { indent: '\t  ' },
    expect: 6,
  },
];

describe('asIndentWidth', () => {
  CASES.forEach((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the indent is measured', () => {
        const result = useThen('it measures', async () => ({
          width: asIndentWidth(thisCase.given),
        }));

        then('it is the column the indent reaches', () => {
          expect(result.width).toEqual(thisCase.expect);
        });
      });
    }),
  );
});
