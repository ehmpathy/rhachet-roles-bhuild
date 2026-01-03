import path from 'path';

import { getBoundBehaviorByBranch } from './getBoundBehaviorByBranch';

const ASSETS_DIR = path.join(
  __dirname,
  '../../../domain.roles/behaver/skills/.test/assets/example.repo/valid-behavior',
);

describe('getBoundBehaviorByBranch', () => {
  describe('given a repo with a bound behavior', () => {
    test('returns the behavior directory for a bound branch', () => {
      const result = getBoundBehaviorByBranch({
        branchName: 'test-branch',
        cwd: ASSETS_DIR,
      });

      expect(result.behaviorDir).toContain('v2025_01_01.get-weather-emoji');
      expect(result.binds).toHaveLength(1);
    });

    test('returns null for an unbound branch', () => {
      const result = getBoundBehaviorByBranch({
        branchName: 'unbound-branch',
        cwd: ASSETS_DIR,
      });

      expect(result.behaviorDir).toBeNull();
      expect(result.binds).toHaveLength(0);
    });
  });

  describe('given a repo without .behavior directory', () => {
    test('returns null with empty bindings', () => {
      const result = getBoundBehaviorByBranch({
        branchName: 'any-branch',
        cwd: '/tmp',
      });

      expect(result.behaviorDir).toBeNull();
      expect(result.binds).toHaveLength(0);
    });
  });
});
