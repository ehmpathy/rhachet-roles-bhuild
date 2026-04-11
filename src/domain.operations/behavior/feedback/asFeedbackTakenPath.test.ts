import { asFeedbackTakenPath } from './asFeedbackTakenPath';

const TEST_CASES = [
  {
    description: 'transforms standard [given] path to [taken] path',
    given: {
      givenPath:
        '.behavior/v2026_04_09.my-feature/feedback/execution.[feedback].v1.[given].by_human.md',
    },
    expect: {
      output:
        '.behavior/v2026_04_09.my-feature/feedback/execution.[feedback].v1.[taken].by_robot.md',
    },
  },
  {
    description: 'handles absolute paths',
    given: {
      givenPath:
        '/home/user/repo/.behavior/v2026_04_09.my-feature/feedback/vision.[feedback].v2.[given].by_human.md',
    },
    expect: {
      output:
        '/home/user/repo/.behavior/v2026_04_09.my-feature/feedback/vision.[feedback].v2.[taken].by_robot.md',
    },
  },
  {
    description: 'handles artifact name with dots',
    given: {
      givenPath:
        'feedback/3.3.1.blueprint.product.v1.[feedback].v1.[given].by_human.md',
    },
    expect: {
      output:
        'feedback/3.3.1.blueprint.product.v1.[feedback].v1.[taken].by_robot.md',
    },
  },
  {
    description: 'handles feedback v2',
    given: {
      givenPath: 'feedback/criteria.[feedback].v2.[given].by_human.md',
    },
    expect: {
      output: 'feedback/criteria.[feedback].v2.[taken].by_robot.md',
    },
  },
];

describe('asFeedbackTakenPath', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = asFeedbackTakenPath(thisCase.given);
      expect(output).toEqual(thisCase.expect.output);
    }),
  );
});
