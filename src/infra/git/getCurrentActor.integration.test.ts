import { given, then, when } from 'test-fns';

import { getCurrentActor, MS_GH_LOGIN_TIMEOUT } from './getCurrentActor';

// the bound for one real lookup: the declared gh cap, then the git read. the
// operation may spend its whole gh cap before git answers, so a bound at or under
// that cap fails on a slow box while the code is correct
jest.setTimeout(MS_GH_LOGIN_TIMEOUT + 10_000);

describe('getCurrentActor', () => {
  given('[case1] inside a git repo with config', () => {
    when('[t0] called from current repo', () => {
      then('returns actor name string', async () => {
        const actor = await getCurrentActor(
          {},
          { github: { auth: { token: null, role: 'as-human' } } },
        );
        expect(typeof actor).toBe('string');
        expect(actor.length).toBeGreaterThan(0);
      });
    });
  });
});
