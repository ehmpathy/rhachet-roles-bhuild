import path from 'path';

import { getLatestBlueprintByBehavior } from './getLatestBlueprintByBehavior';

const ASSETS_DIR = path.join(
  __dirname,
  '../../../domain.roles/behaver/skills/.test/assets/example.repo/valid-behavior',
);

describe('getLatestBlueprintByBehavior', () => {
  describe('given a behavior with multiple blueprint versions', () => {
    const behaviorDir = path.join(
      ASSETS_DIR,
      '.behavior/v2025_01_01.get-weather-emoji',
    );

    test('returns the latest blueprint by version', () => {
      const result = getLatestBlueprintByBehavior({ behaviorDir });

      // should prefer v2.i1 over v1.i1 (higher major version)
      expect(result).toContain('3.3.blueprint.v2.i1.md');
    });
  });

  describe('given a behavior without blueprints', () => {
    test('returns null', () => {
      const result = getLatestBlueprintByBehavior({ behaviorDir: '/tmp' });

      expect(result).toBeNull();
    });
  });
});
