/**
 * .what = clamps on the shared bash driver of the `*work` harness
 *
 * .why  = every work clamp reads its verdict through `runDriver`. a driver the
 *         timeout killed once came back as `exit 1`, the shape of a real fault,
 *         so a saturated box read as a ductwork defect. these clamps hold that
 *         shut: a kill throws, and a real exit code still comes back as data
 */

import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  utimesSync,
  writeFileSync,
} from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { tmpdir } from 'os';
import { join } from 'path';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import { delStaleTestDirs, MS_STALE_TEST_DIR, runDriver } from './work.harness';

afterAll(() => tempDirs.delAll());

describe('delStaleTestDirs', () => {
  given('[case3] a stale corpse that holds a read-only dir', () => {
    // the shape a read-only install fixture leaves: a dir its owner cannot unlink from
    const scene = useBeforeAll(async () => {
      const corpse = mkdtempSync(
        join(tmpdir(), `${tempDirs.prefix}corpse-ro-`),
      );
      const dirRo = join(corpse, 'node_modules', 'ro');
      mkdirSync(dirRo, { recursive: true });
      writeFileSync(join(dirRo, 'file.js'), '');
      chmodSync(dirRo, 0o555);
      const past = new Date(Date.now() - MS_STALE_TEST_DIR - 60_000);
      utimesSync(corpse, past, past);
      return { corpse };
    });

    when('[t0] the sweep reaps it', () => {
      const outcome = useBeforeAll(async () => ({
        dropped: delStaleTestDirs(),
      }));

      then('🔴 it removes the corpse whole, never throws EACCES', () => {
        expect(outcome.dropped).toContain(scene.corpse);
        expect(existsSync(scene.corpse)).toEqual(false);
      });
    });
  });
});

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
        // the bound and both streams so far ride along. their content is racy: on a
        // saturated box the kill can land before bash writes a byte, so only the fields
        // are asserted, never what the driver managed to print
        expect(error.message).toContain('"timeoutMs": 500');
        expect(error.message).toContain('"stdout"');
        expect(error.message).toContain('"stderr"');
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
