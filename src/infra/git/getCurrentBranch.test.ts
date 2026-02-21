import { given, then, when } from 'test-fns';

import { getCurrentBranch } from './getCurrentBranch';

describe('getCurrentBranch', () => {
  given('[case1] inside a git repo', () => {
    when('[t0] called from current repo', () => {
      then('returns a string', async () => {
        const result = await getCurrentBranch();
        expect(typeof result).toBe('string');
      });

      then('returns branch or tag name', async () => {
        // ci may run on a branch or a tag - either is valid
        const result = await getCurrentBranch();
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });
});
