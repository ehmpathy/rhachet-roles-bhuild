import { computeBehaviorFeedbackName } from './computeBehaviorFeedbackName';

const TEST_CASES = [
  {
    description: 'execution with version/attempt',
    given: {
      artifactFileName: '5.1.execution.phase0.v1.i1.md',
      feedbackVersion: 1,
    },
    expect: {
      output: '5.1.execution.phase0.v1.i1.md.[feedback].v1.[given].by_human.md',
    },
  },
  {
    description: 'criteria without version',
    given: { artifactFileName: '2.criteria.blackbox.md', feedbackVersion: 1 },
    expect: {
      output: '2.criteria.blackbox.md.[feedback].v1.[given].by_human.md',
    },
  },
  {
    description: 'wish without version',
    given: { artifactFileName: '0.wish.md', feedbackVersion: 1 },
    expect: { output: '0.wish.md.[feedback].v1.[given].by_human.md' },
  },
  {
    description: 'feedback v2',
    given: { artifactFileName: '0.wish.md', feedbackVersion: 2 },
    expect: { output: '0.wish.md.[feedback].v2.[given].by_human.md' },
  },
];

describe('computeBehaviorFeedbackName', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = computeBehaviorFeedbackName(thisCase.given);
      expect(output).toEqual(thisCase.expect.output);
    }),
  );
});
