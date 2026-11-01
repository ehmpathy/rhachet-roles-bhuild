import { asCliHintText } from './asCliHintText';

const TEST_CASES = [
  {
    description: 'an absent hint prints naught',
    given: undefined,
    expect: null,
  },
  { description: 'a null hint prints naught', given: null, expect: null },
  { description: 'an empty string prints naught', given: '', expect: null },
  {
    description: 'a string hint prints as-is',
    given: 'run: rhx radio.task.queue get',
    expect: 'run: rhx radio.task.queue get',
  },
  {
    description: 'a list of steps prints one per line, never dropped',
    given: ['lift the gate', 'then drain'],
    expect: 'lift the gate\nthen drain',
  },
  {
    description: 'an object hint prints as json, never dropped',
    given: { fix: 'drain' },
    expect: '{"fix":"drain"}',
  },
];

describe('asCliHintText', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asCliHintText({ hint: thisCase.given })).toEqual(thisCase.expect);
    }),
  );
});
