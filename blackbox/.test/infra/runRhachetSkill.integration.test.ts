import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { runRhachetSkill } from './runRhachetSkill';

/**
 * .what = clamps runRhachetSkill against a kill read as an exit code
 * .why = a push killed at its budget on a loaded box once read as exit 1 with
 *        only the banner on stdout; a case that expects a non-zero exit then
 *        passes on the kill, a failhide
 */
describe('runRhachetSkill', () => {
  given('[case1] a run the timeout kills', () => {
    when('[t0] the budget is 1ms', () => {
      then('it throws a MalfunctionError, never returns an exit code', async () => {
        const error = await getError(async () =>
          runRhachetSkill({
            repo: 'bhuild',
            role: 'dispatcher',
            skill: 'radio.uses',
            args: 'get',
            repoDir: process.cwd(),
            timeout: 1,
          }),
        );
        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toContain('rhachet skill radio.uses was killed');
      });
    });
  });

  given('[case2] a run that exits non-zero on its own', () => {
    when('[t0] the skill does not exist', () => {
      then('the real exit code is returned, not thrown', () => {
        const result = runRhachetSkill({
          repo: 'bhuild',
          role: 'dispatcher',
          skill: 'no-such-skill',
          repoDir: process.cwd(),
        });
        expect(result.exitCode).not.toEqual(0);
        expect(result.output).toContain('no-such-skill');
      });
    });
  });
});
