import path from 'path';

import { getLatestBlueprintByBehavior } from './getLatestBlueprintByBehavior';

const ASSETS_DIR = path.join(
  __dirname,
  '../../../../blackbox/role=behaver/.test/assets/example.repo/valid-behavior',
);

describe('getLatestBlueprintByBehavior', () => {
  describe('given a behavior with multiple blueprint versions', () => {
    const behaviorDir = path.join(
      ASSETS_DIR,
      '.behavior/v2025_01_01.get-weather-emoji',
    );

    test('returns the latest product blueprint by version', () => {
      const result = getLatestBlueprintByBehavior({
        behaviorDir,
        which: 'product',
      });

      // should prefer v2.i1 over v1.i1 (higher major version)
      expect(result).toContain('3.3.blueprint.v2.i1.md');
    });

    test('returns null for factory blueprint when none exist', () => {
      const result = getLatestBlueprintByBehavior({
        behaviorDir,
        which: 'factory',
      });

      // test assets only have legacy product blueprints
      expect(result).toBeNull();
    });
  });

  describe('given a behavior without blueprints', () => {
    test('returns null for product', () => {
      const result = getLatestBlueprintByBehavior({
        behaviorDir: '/tmp',
        which: 'product',
      });

      expect(result).toBeNull();
    });

    test('returns null for factory', () => {
      const result = getLatestBlueprintByBehavior({
        behaviorDir: '/tmp',
        which: 'factory',
      });

      expect(result).toBeNull();
    });
  });
});
