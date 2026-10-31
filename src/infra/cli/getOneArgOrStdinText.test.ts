import { getOneArgOrStdinText } from './getOneArgOrStdinText';

const TEST_CASES = [
  {
    description: 'the @stdin sentinel reads the pipe',
    given: { raw: '@stdin' },
    expect: { output: 'wax the longboards' },
  },
  {
    description: 'a plain value passes through',
    given: { raw: 'book a lesson at dawn' },
    expect: { output: 'book a lesson at dawn' },
  },
  {
    description: 'an absent value stays null',
    given: { raw: null },
    expect: { output: null },
  },
];

describe('getOneArgOrStdinText', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        getOneArgOrStdinText(
          { raw: thisCase.given.raw },
          { readStdin: () => 'wax the longboards' },
        ),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
