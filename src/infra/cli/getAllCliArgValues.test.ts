import { getAllCliArgValues } from './getAllCliArgValues';

const TEST_CASES = [
  {
    description: 'collects each value of a repeated flag, in order',
    given: { key: 'to', argv: ['--to', '@:a', '--what', 'hi', '--to', '@:b'] },
    expect: ['@:a', '@:b'],
  },
  {
    description: 'skips a flag with no value after it',
    given: { key: 'to', argv: ['--to', '--what', 'hi'] },
    expect: [],
  },
  {
    description: 'collects the joined form beside the spaced form, in order',
    given: { key: 'to', argv: ['--to=@:a', '--what', 'hi', '--to', '@:b'] },
    expect: ['@:a', '@:b'],
  },
  {
    description: 'returns naught when the flag is absent',
    given: { key: 'to', argv: ['--what', 'hi'] },
    expect: [],
  },
];

describe('getAllCliArgValues', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllCliArgValues(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
