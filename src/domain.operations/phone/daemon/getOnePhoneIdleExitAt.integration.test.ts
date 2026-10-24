import { spawnSync } from 'child_process';
import { join } from 'path';
import { given, then, useThen, when } from 'test-fns';

/**
 * .what = the idle clock lands one idle span after now, on a grove in any timezone
 * .why = a stamp cast that formats local time with a literal `Z` skews `now()` by the grove
 *        offset, and `addDuration` applies the skew twice. on a grove west of utc the rest instant
 *        then lands hours in the past, and a daemon with a held text never sleeps between ticks
 * .note = the jest config pins TZ=UTC for its own process, where the skew is zero; so each case
 *         reads the clock in a child process that runs under the grove timezone it names
 */
const TIMEZONES = ['UTC', 'America/Chicago', 'Asia/Tokyo'];
const MODULE_PATH = join(__dirname, 'getOnePhoneIdleExitAt.ts');
const TSX_BIN = join(process.cwd(), 'node_modules', '.bin', 'tsx');

/**
 * .what = reads how far ahead of now the rest instant lands, in a child under one timezone
 */
const getMsAheadUnderTimezone = (input: {
  timezone: string;
}): { msAhead: number; stderr: string } => {
  const program = [
    `const { getOnePhoneIdleExitAt } = require(${JSON.stringify(MODULE_PATH)});`,
    `const exitAt = getOnePhoneIdleExitAt({ idleExit: { minutes: 30 } });`,
    `process.stdout.write(String(new Date(exitAt).getTime() - Date.now()));`,
  ].join('\n');
  const result = spawnSync(TSX_BIN, ['-e', program], {
    env: { ...process.env, TZ: input.timezone },
    encoding: 'utf8',
  });
  return { msAhead: Number(result.stdout), stderr: result.stderr };
};

describe('getOnePhoneIdleExitAt', () => {
  TIMEZONES.map((timezone) =>
    given(`[case] a grove in ${timezone}`, () => {
      when('[t0] the rest instant is read for a 30 minute idle span', () => {
        const result = useThen('the child reads the clock', async () =>
          getMsAheadUnderTimezone({ timezone }),
        );

        then('it lands 30 minutes after now, not offset by the grove', () => {
          expect(result.stderr).toEqual('');
          expect(result.msAhead).toBeGreaterThan(29 * 60 * 1000);
          expect(result.msAhead).toBeLessThanOrEqual(30 * 60 * 1000);
        });
      });
    }),
  );
});
