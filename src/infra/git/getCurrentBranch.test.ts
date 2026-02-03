import { given, then, when } from 'test-fns';

import { getCurrentBranch } from './getCurrentBranch';

describe('getCurrentBranch', () => {
  given('[case1] inside a git repo', () => {
    when('[t0] called from current repo', () => {
      then('returns branch name string', async () => {
        const branch = await getCurrentBranch();
        expect(typeof branch).toBe('string');
        expect(branch.length).toBeGreaterThan(0);
      });
    });
  });
});
