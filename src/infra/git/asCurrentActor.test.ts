import { asCurrentActor } from './asCurrentActor';

const TEST_CASES = [
  {
    description: 'prefers the github login when both answered',
    given: { ghLogin: 'surfer-bert', gitName: 'Bert' },
    expect: { output: 'surfer-bert' },
  },
  {
    description: 'falls back to the git name when gh did not answer',
    given: { ghLogin: null, gitName: 'Bert' },
    expect: { output: 'Bert' },
  },
  {
    description: 'falls back to the git name when the gh login is blank',
    given: { ghLogin: '  \n', gitName: 'Bert\n' },
    expect: { output: 'Bert' },
  },
  {
    description: 'trims the github login',
    given: { ghLogin: 'surfer-bert\n', gitName: null },
    expect: { output: 'surfer-bert' },
  },
  {
    description: 'returns unknown when neither answered',
    given: { ghLogin: null, gitName: null },
    expect: { output: 'unknown' },
  },
  {
    description: 'returns unknown when both are blank',
    given: { ghLogin: '', gitName: ' ' },
    expect: { output: 'unknown' },
  },
];

describe('asCurrentActor', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asCurrentActor(thisCase.given)).toEqual(thisCase.expect.output);
    }),
  );
});
