import { given, then } from 'test-fns';

import { asGhFaultText } from './asGhFaultText';

const TEST_CASES: {
  description: string;
  given: { error: unknown };
  expect: string;
}[] = [
  {
    description: 'an exec rejection: the message and the stderr',
    given: {
      error: Object.assign(new Error('Command failed: gh issue view 489'), {
        stderr: 'no issue found with number 489',
      }),
    },
    expect: 'Command failed: gh issue view 489 no issue found with number 489',
  },
  {
    description: 'an error with no stderr field',
    given: { error: new Error('spawn gh ENOENT') },
    expect: 'spawn gh ENOENT',
  },
  {
    description: 'an error whose stderr is not text',
    given: { error: Object.assign(new Error('boom'), { stderr: 7 }) },
    expect: 'boom',
  },
  {
    description: 'a thrown string',
    given: { error: 'timed out' },
    expect: 'timed out',
  },
];

describe('asGhFaultText', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then('it reads the fault text', () => {
        expect(asGhFaultText(thisCase.given)).toEqual(thisCase.expect);
      });
    }),
  );
});
