import { given, then, useThen, when } from 'test-fns';

import { asPhoneDaemonOutcomeOfAll } from './asPhoneDaemonOutcomeOfAll';

const TEST_CASES: {
  description: string;
  given: Parameters<typeof asPhoneDaemonOutcomeOfAll>[0];
  expect: ReturnType<typeof asPhoneDaemonOutcomeOfAll>;
}[] = [
  {
    description: '[case1] no tree on this grove was woke',
    given: { outcomes: [] },
    expect: 'NONE',
  },
  {
    description: '[case2] one tree, a daemon found',
    given: { outcomes: ['FOUND'] },
    expect: 'FOUND',
  },
  {
    description: '[case3] one tree, a daemon started',
    given: { outcomes: ['STARTED'] },
    expect: 'STARTED',
  },
  {
    description: '[case4] one tree, no daemon seen',
    given: { outcomes: ['UNCONFIRMED'] },
    expect: 'UNCONFIRMED',
  },
  {
    description: '[case5] two trees, both found',
    given: { outcomes: ['FOUND', 'FOUND'] },
    expect: 'FOUND',
  },
  {
    description:
      '[case6] a found tree and a started one: the started names the send',
    given: { outcomes: ['FOUND', 'STARTED'] },
    expect: 'STARTED',
  },
  {
    description:
      '[case7] a tree with no daemon is never hidden behind the rest',
    given: { outcomes: ['FOUND', 'STARTED', 'UNCONFIRMED', 'FOUND'] },
    expect: 'UNCONFIRMED',
  },
  {
    description: '[case8] the unconfirmed tree leads, wherever it sits',
    given: { outcomes: ['UNCONFIRMED', 'STARTED'] },
    expect: 'UNCONFIRMED',
  },
];

describe('asPhoneDaemonOutcomeOfAll', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the outcomes are folded', () => {
        const result = useThen('it folds', () => ({
          outcome: asPhoneDaemonOutcomeOfAll(thisCase.given),
        }));

        then('it names the worst outcome seen', () => {
          expect(result.outcome).toEqual(thisCase.expect);
        });
      });
    }),
  );
});
