import { MalfunctionError } from 'helpful-errors';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import {
  invokeDecomposeSkill,
  MS_DECOMPOSE_SKILL_TIMEOUT,
} from './invokeDecomposeSkill';

const ASSETS_DIR = path.join(
  __dirname,
  '../../domain.roles/decomposer/skills/.test/assets/example.repo',
);

/**
 * .what = clamps the decompose helper against a kill read as an exit code
 * .why = a 10s kill on a loaded box once read as exit 1 with empty output,
 *        which failed five cases and silently passed every non-zero-exit case
 */
describe('invokeDecomposeSkill', () => {
  given('[case1] a run the timeout kills', () => {
    when('[t0] the budget is 1ms', () => {
      then('it throws a MalfunctionError, never returns an exit code', async () => {
        const error = await getError(async () =>
          invokeDecomposeSkill({
            behaviorName: 'feature',
            mode: 'plan',
            dir: path.join(ASSETS_DIR, 'already-decomposed'),
            timeout: 1,
          }),
        );
        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toContain('decompose.behavior.sh was killed');
      });
    });
  });

  given('[case2] a run that completes', () => {
    when('[t0] the default budget applies', () => {
      then('the default budget sits under the 90s jest limit', () => {
        expect(MS_DECOMPOSE_SKILL_TIMEOUT).toBeLessThan(90_000);
      });

      then('a real non-zero exit is returned, not thrown', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'feature',
          mode: 'apply',
          dir: path.join(ASSETS_DIR, 'already-decomposed'),
          planFile: '/tmp/fake-plan.json',
        });
        expect(result.exitCode).not.toEqual(0);
      });
    });
  });
});
