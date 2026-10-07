import * as path from 'path';
import { given, then, when } from 'test-fns';

import { invokeDecomposeSkill } from '../../../.test/utils/invokeDecomposeSkill';

// extend timeout for brain-powered tests
jest.setTimeout(120000);

const ASSETS_DIR = path.join(__dirname, '.test/assets/example.repo');

// .skip.why = an infra defect in invokeBrainRepl, NOT a credential.
//
//   this suite drives the decompose skill, which reaches imaginePlan and so
//   the very same brain seam. its prior reason read "deprecated: anthropic
//   api key disabled, pending xai brain integration" — the identical text
//   its peer suite carried, and measured FALSE on 2026-09-28:
//
//   1. wrong credential. invokeBrainRepl shells out to `claude --print` —
//      the claude CLI on its OAuth session, never ANTHROPIC_API_KEY.
//   2. an xai/fireworks swap was never reachable. neither ships a brain
//      REPL at all, only atoms, and imaginePlan needs a repl.
//
//   with the CLI freshly authenticated the real run took 432s and still
//   exited non-zero. its stderr held no auth error — only THIS repo's own
//   hook warnings, because execSync inherits the repo root as cwd and the
//   child claude then boots every SessionStart hook declared here.
//
//   ⇒ the fix is isolation of that child (a clean cwd, hooks off, or an
//     SDK brain in place of the shell-out) — a redesign of an infra seam
//     this lift never opened, and one `rule.forbid.cwd-override` bounds.
//
//   ⚠️ a 7-minute deterministic failure in ci is worse than a recorded
//   skip, so the skip stands — now with a cause a reader can act on.
//   ⇒ caught: .dream/v2026_09_28.fix-invokebrainrepl-shells-claude-inside-a-hook-laden-repo.md
describe.skip('decompose.behavior.brain.case1.integration', () => {
  given('[case1] behavior that needs decomposition', () => {
    when('[t0] --mode plan invoked with brain', () => {
      // invoke brain once, reuse result across assertions
      let result: { stdout: string; exitCode: number };

      then('exit code is 0', () => {
        result = invokeDecomposeSkill({
          behaviorName: 'large-feature',
          mode: 'plan',
          dir: path.join(ASSETS_DIR, 'needs-decomposition'),
          timeout: 120000,
        });
        expect(result.exitCode).toEqual(0);
      });

      then('output contains plan generated message', () => {
        expect(result.stdout).toContain('plan generated');
      });

      then('output reports behaviors proposed count', () => {
        expect(result.stdout).toMatch(/behaviors proposed = \d+/);
      });

      then('output reports context window percentage', () => {
        expect(result.stdout).toMatch(/context window = [\d.]+%/);
      });

      then('output lists proposed behavior names', () => {
        expect(result.stdout).toContain('proposed behaviors');
      });

      then('output shows next step command', () => {
        expect(result.stdout).toContain('--mode apply');
      });
    });
  });
});
