import { given, then, when } from 'test-fns';

import { asRadioBacklogBranch } from './asRadioBacklogBranch';

const TEST_CASES = [
  {
    description: 'zero says the pond is clear',
    given: { backlog: 0 },
    expect: { line: 'backlog = 0' },
  },
  {
    description: 'one record reads singular',
    given: { backlog: 1 },
    expect: { line: 'backlog = 1 awaits the radio' },
  },
  {
    description: 'many records read plural',
    given: { backlog: 3 },
    expect: { line: 'backlog = 3 await the radio' },
  },
];

describe('asRadioBacklogBranch', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] a backlog of ${thisCase.given.backlog}`, () => {
      when('[t0] the branch renders', () => {
        then(thisCase.description, () => {
          const branch = asRadioBacklogBranch(thisCase.given);
          expect(branch).toEqual({ line: thisCase.expect.line, children: [] });
        });
      });
    }),
  );
});
