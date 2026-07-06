import { ConstraintError, MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { genAuthFromKeyrack } from './genAuthFromKeyrack';

// mock the keyrack module
jest.mock('rhachet/keyrack', () => ({
  keyrack: {
    get: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { keyrack } = require('rhachet/keyrack');

/**
 * .what = mock shx that records calls and returns empty output
 * .why = enables unit test of the auto-unlock path without real shell execution
 */
const genMockShx = () => jest.fn(async () => ({ stdout: '', stderr: '' }));

describe('genAuthFromKeyrack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('[case1] keyrack returns granted status', () => {
    when('[t0] called with valid input', () => {
      then('returns token from grant', async () => {
        keyrack.get.mockResolvedValue({
          attempt: {
            status: 'granted',
            grant: { key: { secret: 'ghs_test_token_123' } },
          },
          emit: { stdout: '✅ granted: EHMPATH_BEAVER_GITHUB_TOKEN' },
        });

        const shx = genMockShx();
        const result = await genAuthFromKeyrack(
          {
            owner: 'ehmpath',
            env: 'prep',
            key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          { shx },
        );

        expect(result).toEqual({ token: 'ghs_test_token_123' });
        expect(keyrack.get).toHaveBeenCalledWith({
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
          keyrack.get
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

          const shx = genMockShx();
          const result = await genAuthFromKeyrack(
            {
              owner: 'ehmpath',
              env: 'prep',
              key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
            },
            { shx },
          );

          expect(result).toEqual({ token: 'ghs_after_unlock' });
          // unlock was invoked via cli with the expected args
          expect(shx).toHaveBeenCalledWith(
            'rhx keyrack unlock --owner ehmpath --env prep --key EHMPATH_BEAVER_GITHUB_TOKEN',
          );
          // keyrack.get was retried after unlock
          expect(keyrack.get).toHaveBeenCalledTimes(2);
          // the unlock note was emitted for observability
          expect(logSpy).toHaveBeenCalledWith('🔓 unlocked keyrack');

          logSpy.mockRestore();
        });
      });
    },
  );

  given('[case3] keyrack stays locked even after auto-unlock', () => {
    when('[t0] unlock does not clear the lock', () => {
      then('throws MalfunctionError with keyrack output', async () => {
        keyrack.get.mockResolvedValue({
          attempt: {
            status: 'locked',
            slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          emit: { stdout: '🔒 locked: credential is locked' },
        });

        const shx = genMockShx();
        const error = await getError(
          genAuthFromKeyrack(
            {
              owner: 'ehmpath',
              env: 'prep',
              key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
            },
            { shx },
          ),
        );

        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toMatch(/keyrack:[\s\S]*is locked/);
        // lock the exact user-faced message so drift is caught in review
        expect(error.message).toMatchSnapshot();
        // unlock was attempted before the malfunction
        expect(shx).toHaveBeenCalledTimes(1);
      });
    });
  });

  given('[case4] keyrack returns absent status', () => {
    when('[t0] key was never set', () => {
      then('throws ConstraintError with a two-path nudge', async () => {
        keyrack.get.mockResolvedValue({
          attempt: {
            status: 'absent',
            slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          emit: { stdout: '❌ absent: does not exist' },
        });

        const shx = genMockShx();
        const error = await getError(
          genAuthFromKeyrack(
            {
              owner: 'ehmpath',
              env: 'prep',
              key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
            },
            { shx },
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
      then('throws MalfunctionError with keyrack output', async () => {
        keyrack.get.mockResolvedValue({
          attempt: {
            status: 'blocked',
            slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          emit: {
            stdout: '🚫 blocked: credential blocked by mechanism firewall',
          },
        });

        const shx = genMockShx();
        const error = await getError(
          genAuthFromKeyrack(
            {
              owner: 'ehmpath',
              env: 'prep',
              key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
            },
            { shx },
          ),
        );

        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toMatch(/keyrack:[\s\S]*blocked/);
        // lock the exact user-faced message so drift is caught in review
        expect(error.message).toMatchSnapshot();
        // blocked is a real malfunction — do not attempt an unlock
        expect(shx).not.toHaveBeenCalled();
      });
    });
  });
});
