import { flattenBranchName } from './flattenBranchName';

const TEST_CASES = [
  {
    description: 'replaces forward slashes with dots',
    given: { branchName: 'vlad/dispatch-behavior-hooks' },
    expect: { output: 'vlad.dispatch-behavior-hooks' },
  },
  {
    description: 'handles multiple nested slashes',
    given: { branchName: 'feature/epic/task/subtask' },
    expect: { output: 'feature.epic.task.subtask' },
  },
  {
    description: 'preserves simple branch names',
    given: { branchName: 'main' },
    expect: { output: 'main' },
  },
  {
    description: 'normalizes special characters to underscores',
    given: { branchName: 'feature@v2#test' },
    expect: { output: 'feature_v2_test' },
  },
  {
    description: 'removes trailing underscore',
    given: { branchName: 'feature@' },
    expect: { output: 'feature' },
  },
  {
    description: 'preserves dashes and underscores',
    given: { branchName: 'feature_name-test' },
    expect: { output: 'feature_name-test' },
  },
];

describe('flattenBranchName', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = flattenBranchName(thisCase.given);
      expect(output).toEqual(thisCase.expect.output);
    }),
  );
});
