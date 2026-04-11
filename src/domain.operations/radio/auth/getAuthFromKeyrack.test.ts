import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { getAuthFromKeyrack } from './getAuthFromKeyrack';

// mock the keyrack module
jest.mock('rhachet/keyrack', () => ({
  keyrack: {
    get: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { keyrack } = require('rhachet/keyrack');

describe('getAuthFromKeyrack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('[case1] keyrack returns granted status', () => {
    when('[t0] called with valid input', () => {
      then('returns token from grant', async () => {
        keyrack.get.mockResolvedValue({
          attempt: {
            status: 'granted',
            grant: {
              key: { secret: 'ghs_test_token_123' },
            },
          },
          emit: { stdout: '✅ granted: EHMPATH_BEAVER_GITHUB_TOKEN' },
        });

        const result = await getAuthFromKeyrack({
          owner: 'ehmpath',
          env: 'prep',
          key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
        });

        expect(result).toEqual({ token: 'ghs_test_token_123' });
        expect(keyrack.get).toHaveBeenCalledWith({
          for: { key: 'EHMPATH_BEAVER_GITHUB_TOKEN' },
          env: 'prep',
          owner: 'ehmpath',
        });
      });
    });
  });

  given('[case2] keyrack returns absent status', () => {
    when('[t0] key not found', () => {
      then('throws MalfunctionError with keyrack output', async () => {
        keyrack.get.mockResolvedValue({
          attempt: {
            status: 'absent',
            slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          emit: {
            stdout:
              "❌ absent: credential 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN' does not exist\n  fix: rhx keyrack set --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep",
          },
        });

        const error = await getError(
          getAuthFromKeyrack({
            owner: 'ehmpath',
            env: 'prep',
            key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
          }),
        );

        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toMatch(/keyrack:[\s\S]*does not exist/);
      });
    });
  });

  given('[case3] keyrack returns locked status', () => {
    when('[t0] keyrack not unlocked', () => {
      then('throws MalfunctionError with keyrack output', async () => {
        keyrack.get.mockResolvedValue({
          attempt: {
            status: 'locked',
            slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          emit: {
            stdout:
              "🔒 locked: credential 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN' is locked\n  fix: rhx keyrack unlock --env prep --key EHMPATH_BEAVER_GITHUB_TOKEN",
          },
        });

        const error = await getError(
          getAuthFromKeyrack({
            owner: 'ehmpath',
            env: 'prep',
            key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
          }),
        );

        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toMatch(/keyrack:[\s\S]*is locked/);
      });
    });
  });

  given('[case4] keyrack returns blocked status', () => {
    when('[t0] value blocked by mechanism', () => {
      then('throws MalfunctionError with keyrack output', async () => {
        keyrack.get.mockResolvedValue({
          attempt: {
            status: 'blocked',
            slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          emit: {
            stdout:
              '🚫 blocked: credential blocked by mechanism firewall\n  fix: update the stored value to use a short-lived credential',
          },
        });

        const error = await getError(
          getAuthFromKeyrack({
            owner: 'ehmpath',
            env: 'prep',
            key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
          }),
        );

        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toMatch(/keyrack:[\s\S]*blocked/);
      });
    });
  });
});
