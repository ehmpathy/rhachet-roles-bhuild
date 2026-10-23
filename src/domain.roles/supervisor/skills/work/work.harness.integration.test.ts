/**
 * .what = clamps on the shared bash driver of the `*work` harness
 *
 * .why  = every work clamp reads its verdict through `runDriver`. a driver the
 *         timeout killed once came back as `exit 1`, the shape of a real fault,
 *         so a saturated box read as a ductwork defect. these clamps hold that
 *         shut: a kill throws, and a real exit code still comes back as data
 */

import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import { runDriver } from './work.harness';

afterAll(() => tempDirs.delAll());

describe('runDriver', () => {
  given('[case1] a driver that outlives its timeout', () => {
    when('[t0] the harness ends it', () => {
      then('🔴 it throws a MalfunctionError, never an exit code', async () => {
        const error = await getError(async () =>
          runDriver(
            {
              body: 'echo began >&2\nsleep 5\n',
              dir: tempDirs.genOne({ slug: 'driver-killed' }),
              env: {},
              pathLog: null,
            },
            { timeoutMs: 500 },
          ),
        );
        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toContain('did not exit on its own');
        expect(error.message).toContain('began'); // the streams so far ride along
      });
    });
  });

  given('[case2] a driver that exits non-zero on its own', () => {
    when('[t0] it returns', () => {
      then('its real exit code comes back as data', () => {
        const result = runDriver({
          body: 'echo bad >&2\nexit 3\n',
          dir: tempDirs.genOne({ slug: 'driver-exit3' }),
          env: {},
          pathLog: null,
        });
        expect(result).toMatchObject({ exit: 3, stderr: 'bad\n' });
      });
    });
  });
});
