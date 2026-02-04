import { given, then, when } from 'test-fns';

import { getRepoFromGitContext } from './getRepoFromGitContext';

describe('getRepoFromGitContext', () => {
  given('[case1] inside a git repo', () => {
    when('[t0] called from current repo', () => {
      then('returns RadioTaskRepo with owner and name', async () => {
        const repo = await getRepoFromGitContext();
        expect(repo).not.toBeNull();
        expect(repo?.owner).toBeDefined();
        expect(repo?.name).toBeDefined();
      });
    });
  });
});
