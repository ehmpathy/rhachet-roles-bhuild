import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { extractOrgFromRepo } from './extractOrgFromRepo';

const VALID_CASES = [
  {
    description: 'extracts org from standard owner/repo',
    given: { repo: 'ehmpathy/svc-quotes' },
    expect: { output: 'ehmpathy' },
  },
  {
    description: 'extracts org with dashes in name',
    given: { repo: 'my-org/my-repo' },
    expect: { output: 'my-org' },
  },
  {
    description: 'extracts org with underscores in name',
    given: { repo: 'my_org/my_repo' },
    expect: { output: 'my_org' },
  },
  {
    description: 'extracts single character org',
    given: { repo: 'a/repo' },
    expect: { output: 'a' },
  },
];

describe('extractOrgFromRepo', () => {
  describe('valid inputs', () => {
    VALID_CASES.map((thisCase) =>
      test(thisCase.description, () => {
        const output = extractOrgFromRepo(thisCase.given);
        expect(output).toEqual(thisCase.expect.output);
      }),
    );
  });

  describe('invalid inputs', () => {
    given('[case1] repo with no slash', () => {
      when('[t0] extractOrgFromRepo is called', () => {
        then('throws BadRequestError', async () => {
          const error = await getError(async () =>
            extractOrgFromRepo({ repo: 'repo-only' }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('invalid repo format');
        });
      });
    });

    given('[case2] empty repo', () => {
      when('[t0] extractOrgFromRepo is called with empty string', () => {
        then('throws BadRequestError', async () => {
          const error = await getError(async () =>
            extractOrgFromRepo({ repo: '' }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('repo cannot be empty');
        });
      });

      when('[t1] extractOrgFromRepo is called with whitespace', () => {
        then('throws BadRequestError', async () => {
          const error = await getError(async () =>
            extractOrgFromRepo({ repo: '   ' }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('repo cannot be empty');
        });
      });
    });

    given('[case3] repo with only slash', () => {
      when('[t0] extractOrgFromRepo is called', () => {
        then('throws BadRequestError', async () => {
          const error = await getError(async () =>
            extractOrgFromRepo({ repo: '/' }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('invalid repo format');
        });
      });
    });
  });
});
