import * as path from 'path';
import { given, then, when } from 'test-fns';

import { BehaviorPersisted } from '../../../domain.objects/BehaviorPersisted';
import { computeContextConsumption } from './computeContextConsumption';

const ASSETS_DIR = path.join(
  __dirname,
  '../../../domain.roles/decomposer/skills/.test/assets/example.repo',
);

describe('computeContextConsumption', () => {
  given('[case1] behavior with large artifacts', () => {
    const behavior = new BehaviorPersisted({
      name: 'large-feature',
      path: path.join(
        ASSETS_DIR,
        'needs-decomposition/.behavior/v2025_01_01.large-feature',
      ),
    });

    when('[t0] context consumption computed', () => {
      then('returns character count > 0', async () => {
        const result = await computeContextConsumption({ behavior });
        expect(result.usage.characters.quantity).toBeGreaterThan(0);
      });

      then('returns token estimate based on chars / 4', async () => {
        const result = await computeContextConsumption({ behavior });
        expect(result.usage.tokens.estimate).toEqual(
          Math.ceil(result.usage.characters.quantity / 4),
        );
      });

      then('returns window percentage based on 200k context', async () => {
        const result = await computeContextConsumption({ behavior });
        const expected = Math.ceil(
          (result.usage.tokens.estimate * 100) / 200000,
        );
        expect(result.usage.window.percentage).toEqual(expected);
      });
    });
  });

  given('[case2] behavior with minimal artifacts', () => {
    const behavior = new BehaviorPersisted({
      name: 'feature',
      path: path.join(
        ASSETS_DIR,
        'already-decomposed/.behavior/v2025_01_01.feature',
      ),
    });

    when('[t0] context consumption computed', () => {
      then('recommendation is DECOMPOSE_UNNEEDED', async () => {
        const result = await computeContextConsumption({ behavior });
        expect(result.recommendation).toEqual('DECOMPOSE_UNNEEDED');
      });

      then('window percentage is below 30', async () => {
        const result = await computeContextConsumption({ behavior });
        expect(result.usage.window.percentage).toBeLessThanOrEqual(30);
      });
    });
  });

  given('[case3] behavior with no criteria', () => {
    const behavior = new BehaviorPersisted({
      name: 'incomplete',
      path: path.join(
        ASSETS_DIR,
        'no-criteria/.behavior/v2025_01_01.incomplete',
      ),
    });

    when('[t0] context consumption computed', () => {
      then('returns zero characters', async () => {
        const result = await computeContextConsumption({ behavior });
        expect(result.usage.characters.quantity).toEqual(0);
      });

      then('recommendation is DECOMPOSE_UNNEEDED', async () => {
        const result = await computeContextConsumption({ behavior });
        expect(result.recommendation).toEqual('DECOMPOSE_UNNEEDED');
      });
    });
  });
});
