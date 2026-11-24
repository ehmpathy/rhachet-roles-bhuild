import { getColumnWidth } from './getColumnWidth';

const TEST_CASES = [
  {
    description: 'an empty list falls back to min',
    given: { values: [], min: 4 },
    expect: { width: 4 },
  },
  {
    description: 'min wins over a list of short values',
    given: { values: ['a', 'bc'], min: 4 },
    expect: { width: 4 },
  },
  {
    description: 'the longest value wins over min',
    given: { values: ['lane', 'arch-opport-decomposition'], min: 4 },
    expect: { width: 25 },
  },
];

describe('getColumnWidth', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getColumnWidth(thisCase.given)).toEqual(thisCase.expect.width);
    }),
  );
});
