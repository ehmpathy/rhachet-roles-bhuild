import path from 'path';

import { getBranchBehaviorBind } from './getBranchBehaviorBind';

const ASSETS_DIR = path.join(
  __dirname,
  '../../../../blackbox/role=behaver/.test/assets/example.repo/valid-behavior',
);

describe('getBranchBehaviorBind', () => {
  describe('given a repo with a bound behavior', () => {
    test('returns the behavior directory for a bound branch', () => {
      const result = getBranchBehaviorBind(
        { branchName: 'test-branch' },
        { cwd: ASSETS_DIR },
      );

      expect(result.behaviorDir).toContain('v2025_01_01.get-weather-emoji');
      expect(result.binds).toHaveLength(1);
    });

    test('returns null for an unbound branch', () => {
      const result = getBranchBehaviorBind(
        { branchName: 'unbound-branch' },
        { cwd: ASSETS_DIR },
      );

      expect(result.behaviorDir).toBeNull();
      expect(result.binds).toHaveLength(0);
    });
  });

  describe('given a repo without .behavior directory', () => {
    test('returns null with empty bindings', () => {
      const result = getBranchBehaviorBind(
        { branchName: 'any-branch' },
        { cwd: '/tmp' },
      );

      expect(result.behaviorDir).toBeNull();
      expect(result.binds).toHaveLength(0);
    });
  });
});
