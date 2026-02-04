import { given, then, when } from 'test-fns';

import { getCurrentActor } from './getCurrentActor';

describe('getCurrentActor', () => {
  given('[case1] inside a git repo with config', () => {
    when('[t0] called from current repo', () => {
      then('returns actor name string', async () => {
        const actor = await getCurrentActor();
        expect(typeof actor).toBe('string');
        expect(actor.length).toBeGreaterThan(0);
      });
    });
  });
});
