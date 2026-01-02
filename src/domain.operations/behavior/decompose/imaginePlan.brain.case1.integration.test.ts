import * as path from 'path';
import { given, then, when } from 'test-fns';

import { BehaviorDecompositionPlan } from '../../../domain.objects/BehaviorDecompositionPlan';
import { BehaviorPersisted } from '../../../domain.objects/BehaviorPersisted';
import { invokeBrainRepl } from '../../../infra/brain/invokeBrainRepl';
import { loadBriefs } from '../../../infra/brain/loadBriefs';
import { imaginePlan } from './imaginePlan';

// extend timeout for brain-powered tests
jest.setTimeout(120000);

const ASSETS_DIR = path.join(
  __dirname,
  '../../../domain.roles/decomposer/skills/.test/assets/example.repo',
);
const ROLE_DIR = path.join(__dirname, '../../../domain.roles/decomposer');

/**
 * .what = creates real brain.repl context for integration tests
 * .why = enables testing with actual brain invocation
 */
const createBrainContext = () => ({
  brain: {
    repl: {
      imagine: invokeBrainRepl,
    },
  },
});

describe('imaginePlan.brain.case1.integration', () => {
  given('[case1] behavior with multiple distinct usecases', () => {
    const behaviorPath = path.join(
      ASSETS_DIR,
      'needs-decomposition/.behavior/v2025_01_01.large-feature',
    );

    when('[t0] imaginePlan invoked with real brain', () => {
      // invoke brain once, reuse result across assertions
      let plan: BehaviorDecompositionPlan;

      then('returns valid BehaviorDecompositionPlan', async () => {
        const behavior = new BehaviorPersisted({
          name: 'large-feature',
          path: behaviorPath,
        });
        const briefs = await loadBriefs({
          roleDir: ROLE_DIR,
          skillName: 'decompose',
        });
        const role = { briefs };
        const context = createBrainContext();
        plan = await imaginePlan({ behavior, role }, context);
        expect(plan).toBeInstanceOf(BehaviorDecompositionPlan);
      });

      then('proposes multiple sub-behaviors', () => {
        expect(plan.behaviorsProposed.length).toBeGreaterThanOrEqual(2);
      });

      then('each proposed behavior has name and decomposed wish', () => {
        for (const proposed of plan.behaviorsProposed) {
          expect(proposed.name).toBeTruthy();
          expect(proposed.name.length).toBeGreaterThan(0);
          expect(proposed.decomposed.wish).toBeTruthy();
          expect(proposed.decomposed.wish.length).toBeGreaterThan(0);
        }
      });

      then('each proposed behavior has dependsOn array', () => {
        for (const proposed of plan.behaviorsProposed) {
          expect(Array.isArray(proposed.dependsOn)).toBe(true);
        }
      });

      then('context analysis is computed', () => {
        expect(plan.contextAnalysis.usage.characters.quantity).toBeGreaterThan(
          0,
        );
        expect(plan.contextAnalysis.usage.tokens.estimate).toBeGreaterThan(0);
        expect(plan.contextAnalysis.recommendation).toBeTruthy();
      });

      then('behavior source is preserved', () => {
        expect(plan.behaviorSource.name).toEqual('large-feature');
        expect(plan.behaviorSource.path).toEqual(behaviorPath);
      });
    });
  });
});
