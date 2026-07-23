import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { genAuthFromKeyrack } from './genAuthFromKeyrack';

/**
 * .what = fake shx that records calls and returns empty output
 * .why = enables unit test of the auto-unlock path without real shell execution
 */
const genFakeShx = () => jest.fn(async () => ({ stdout: '', stderr: '' }));

/**
 * .what = fake keyrack.get injected via context (not a module mock)
 * .why = keyrack is a remote boundary (vault i/o). per
 *        rule.forbid.unit.remote-boundaries, unit tests inject a fake through
 *        the context seam instead of a jest.mock of the real sdk module.
 */
const genFakeKeyrackGet = () => jest.fn();

describe('genAuthFromKeyrack', () => {
  given('[case1] keyrack returns granted status', () => {
    when('[t0] called with valid input', () => {
      then('returns token from grant', async () => {
        const keyrackGet = genFakeKeyrackGet();
        keyrackGet.mockResolvedValue({
          attempt: {
            status: 'granted',
            grant: { key: { secret: 'ghs_test_token_123' } },
          },
          emit: { stdout: '✅ granted: EHMPATH_BEAVER_GITHUB_TOKEN' },
        });

        const shx = genFakeShx();
        const result = await genAuthFromKeyrack(
          {
            owner: 'ehmpath',
            env: 'prep',
            key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          { shx, keyrackGet },
        );

        expect(result).toEqual({ token: 'ghs_test_token_123' });
        expect(keyrackGet).toHaveBeenCalledWith({
          for: { key: 'EHMPATH_BEAVER_GITHUB_TOKEN' },
          env: 'prep',
          owner: 'ehmpath',
        });
        // no unlock needed on the happy path
        expect(shx).not.toHaveBeenCalled();
      });
    });
  });

  given(
    '[case2] keyrack returns locked, then granted after auto-unlock',
    () => {
      when('[t0] first grant is locked and unlock succeeds', () => {
        then('auto-unlocks then returns the token', async () => {
          const keyrackGet = genFakeKeyrackGet();
          keyrackGet
            .mockResolvedValueOnce({
              attempt: {
                status: 'locked',
                slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
              },
              emit: { stdout: '🔒 locked' },
            })
            .mockResolvedValueOnce({
              attempt: {
                status: 'granted',
                grant: { key: { secret: 'ghs_after_unlock' } },
              },
              emit: { stdout: '✅ granted' },
            });

          const logSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => undefined);

          const shx = genFakeShx();
          const result = await genAuthFromKeyrack(
            {
              owner: 'ehmpath',
              env: 'prep',
              key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
            },
            { shx, keyrackGet },
          );

          expect(result).toEqual({ token: 'ghs_after_unlock' });
          // unlock was invoked via cli with the expected args
          expect(shx).toHaveBeenCalledWith(
            'rhx keyrack unlock --owner ehmpath --env prep --key EHMPATH_BEAVER_GITHUB_TOKEN',
          );
          // keyrackGet was retried after unlock
          expect(keyrackGet).toHaveBeenCalledTimes(2);
          // the unlock note was emitted for observability
          expect(logSpy).toHaveBeenCalledWith('🔓 unlocked keyrack');

          logSpy.mockRestore();
        });
      });
    },
  );

  given('[case3] keyrack stays locked even after auto-unlock', () => {
    when('[t0] unlock does not clear the lock', () => {
      then('throws ConstraintError with the as-human nudge', async () => {
        const keyrackGet = genFakeKeyrackGet();
        keyrackGet.mockResolvedValue({
          attempt: {
            status: 'locked',
            slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          emit: { stdout: '🔒 locked: credential is locked' },
        });

        const shx = genFakeShx();
        const error = await getError(
          genAuthFromKeyrack(
            {
              owner: 'ehmpath',
              env: 'prep',
              key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
            },
            { shx, keyrackGet },
          ),
        );

        // a keyrack failure is caller-fixable → ✋ ConstraintError, not 💥
        expect(error).toBeInstanceOf(ConstraintError);
        // guides to the as-human unblock and the keyrack-UNLOCK fix (locked is
        // sealed, not absent — `keyrack set` would not clear a present-but-locked key)
        expect(error.message).toContain('--auth as-human');
        expect(error.message).toContain('rhx keyrack unlock');
        expect(error.message).toContain('status: locked');
        // raw keyrack stdout preserved in metadata, not the headline
        expect((error as ConstraintError).metadata).toMatchObject({
          status: 'locked',
          keyrack: '🔒 locked: credential is locked',
        });
        // lock the exact user-faced message so drift is caught in review
        expect(error.message).toMatchSnapshot();
        // unlock was attempted before the failure
        expect(shx).toHaveBeenCalledTimes(1);
      });
    });
  });

  given('[case4] keyrack returns absent status', () => {
    when('[t0] key was never set', () => {
      then('throws ConstraintError with a two-path nudge', async () => {
        const keyrackGet = genFakeKeyrackGet();
        keyrackGet.mockResolvedValue({
          attempt: {
            status: 'absent',
            slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          emit: { stdout: '❌ absent: does not exist' },
        });

        const shx = genFakeShx();
        const error = await getError(
          genAuthFromKeyrack(
            {
              owner: 'ehmpath',
              env: 'prep',
              key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
            },
            { shx, keyrackGet },
          ),
        );

        expect(error).toBeInstanceOf(ConstraintError);
        // guides to set the beaver key
        expect(error.message).toContain('rhx keyrack set');
        expect(error.message).toContain('EHMPATH_BEAVER_GITHUB_TOKEN');
        // and to the as-human fallback
        expect(error.message).toContain('--auth as-human');
        // lock the exact two-path nudge so drift is caught in review
        expect(error.message).toMatchSnapshot();
        // absent must not attempt an unlock
        expect(shx).not.toHaveBeenCalled();
      });
    });
  });

  given('[case5] keyrack returns blocked status', () => {
    when('[t0] value blocked by mechanism firewall', () => {
      then('throws ConstraintError with the as-human nudge', async () => {
        const keyrackGet = genFakeKeyrackGet();
        keyrackGet.mockResolvedValue({
          attempt: {
            status: 'blocked',
            slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          emit: {
            stdout: '🚫 blocked: credential blocked by mechanism firewall',
          },
        });

        const shx = genFakeShx();
        const error = await getError(
          genAuthFromKeyrack(
            {
              owner: 'ehmpath',
              env: 'prep',
              key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
            },
            { shx, keyrackGet },
          ),
        );

        // a keyrack failure is caller-fixable → ✋ ConstraintError, not 💥
        expect(error).toBeInstanceOf(ConstraintError);
        // lock the exit-code reclassification: blocked was formerly a
        // MalfunctionError (exit 1); it must now exit 2 (caller-fixable ✋).
        // this guards the vision's central claim against a silent 💥 regression.
        const code = (error as ConstraintError).code as { exit?: number };
        expect(code.exit).toEqual(2);
        expect(error.message).toContain('--auth as-human');
        expect(error.message).toContain('status: blocked');
        // raw keyrack stdout preserved in metadata, not the headline
        expect((error as ConstraintError).metadata).toMatchObject({
          status: 'blocked',
          keyrack: '🚫 blocked: credential blocked by mechanism firewall',
        });
        // lock the exact user-faced message so drift is caught in review
        expect(error.message).toMatchSnapshot();
        // blocked must not attempt an unlock
        expect(shx).not.toHaveBeenCalled();
      });
    });
  });

  given('[case6] keyrack is locked and the auto-unlock command fails', () => {
    when('[t0] rhx keyrack unlock itself exits non-zero', () => {
      then(
        'throws the same graceful ✋, raw cause kept in metadata',
        async () => {
          // first grant is locked → the unlock command runs, but the command
          // itself rejects (e.g. absent host manifest, unfilled credential, rhx
          // not on PATH, unreachable vault). the raw exec bubble must NOT reach
          // the caller — it must become the same graceful nudge.
          const keyrackGet = genFakeKeyrackGet();
          keyrackGet.mockResolvedValue({
            attempt: {
              status: 'locked',
              slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
            },
            emit: { stdout: '🔒 locked' },
          });

          // shx rejects with a raw exec-style error (the class the wish eliminates)
          const shx = jest.fn(async () => {
            throw new Error(
              'Command failed: rhx keyrack unlock --owner ehmpath --env prep --key EHMPATH_BEAVER_GITHUB_TOKEN\nhost manifest not found',
            );
          });

          const error = await getError(
            genAuthFromKeyrack(
              {
                owner: 'ehmpath',
                env: 'prep',
                key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
              },
              { shx, keyrackGet },
            ),
          );

          // a keyrack failure is caller-fixable → ✋ ConstraintError, not 💥
          expect(error).toBeInstanceOf(ConstraintError);
          // exit 2 (caller-fixable), never a raw crash / exit 1
          const code = (error as ConstraintError).code as { exit?: number };
          expect(code.exit).toEqual(2);
          // guides to the as-human unblock and the keyrack-UNLOCK fix (locked)
          expect(error.message).toContain('--auth as-human');
          expect(error.message).toContain('rhx keyrack unlock');
          expect(error.message).toContain('status: locked');
          // the raw `Command failed` bubble is demoted OUT of the headline — the
          // first line is the graceful nudge, not the exec error (the raw cause
          // still lives in metadata.unlockFailure, asserted below)
          expect(error.message.split('\n')[0]).not.toContain('Command failed');
          // raw unlock cause preserved in metadata for debug, not the headline
          expect((error as ConstraintError).metadata).toMatchObject({
            status: 'locked',
            unlockFailure:
              'Command failed: rhx keyrack unlock --owner ehmpath --env prep --key EHMPATH_BEAVER_GITHUB_TOKEN\nhost manifest not found',
          });
          // unlock was attempted (and it is what failed)
          expect(shx).toHaveBeenCalledTimes(1);
          // the retry keyrackGet must NOT run when the unlock command threw
          expect(keyrackGet).toHaveBeenCalledTimes(1);
        },
      );
    });
  });
});
