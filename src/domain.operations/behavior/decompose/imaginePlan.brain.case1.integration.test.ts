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
      imagine: (input: {
        prompt: string;
        role: { briefs: Array<{ name: string; content: string }> };
        outputFormat: 'json' | 'text';
      }) =>
        invokeBrainRepl({
          prompt: input.prompt,
          role: input.role,
          outputFormat: input.outputFormat,
        }),
    },
  },
});

// .skip.why = an infra defect in invokeBrainRepl, NOT a credential.
//
//   this suite's prior reason read "deprecated: anthropic api key disabled,
//   pending xai brain integration". that reason was FALSE in two ways, and it
//   was measured false on 2026-09-28 by a lift of the skip and a real run:
//
//   1. it names the wrong credential. imaginePlan needs a brain.REPL, and
//      invokeBrainRepl shells out to `claude --print` — the claude CLI on its
//      OAuth session, never ANTHROPIC_API_KEY.
//   2. an xai/fireworks swap could never have been the unblocker. neither
//      ships a repl at all, only atoms — so the named remedy was unreachable.
//
//   with the CLI freshly authenticated, the real run took 432s and still
//   exited non-zero. its captured stderr holds no auth error — only THIS
//   repo's own hook warnings, because execSync inherits the repo root as cwd
//   and so the child claude boots every SessionStart hook this repo declares.
//
//   ⇒ the cause is the design of invokeBrainRepl (see its own
//     `.todo = liftout generalized into rhachet repo`): a bare `claude
//     --print` from inside a hook-laden repo is not a usable brain seam. the
//     fix is isolation (a clean cwd, hooks off, or an SDK brain in place of a
//     shell-out) — a redesign of an infra seam this lift never opened.
//
//   ⚠️ a 7-minute deterministic failure in ci is worse than a recorded skip,
//   so the skip stands — now with a cause a reader can act on.
//   ⇒ caught: .dream/v2026_09_28.fix-invokebrainrepl-shells-claude-inside-a-hook-laden-repo.md
describe.skip('imaginePlan.brain.case1.integration', () => {
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
