import { given, then, when } from 'test-fns';

import { fetchRemoteRepoBehaviorsViaClone } from './fetchRemoteRepoBehaviorsViaClone';

describe('fetchRemoteRepoBehaviorsViaClone', () => {
  given('[case1] a public repo with behaviors', () => {
    when('[t0] fetching behaviors from main branch', () => {
      then('returns behaviors from .behavior directories', async () => {
        const behaviors = await fetchRemoteRepoBehaviorsViaClone({
          source: {
            org: 'ehmpathy',
            repo: 'rhachet-roles-bhuild',
            branch: 'main',
          },
        });

        // should find at least one behavior
        expect(behaviors.length).toBeGreaterThan(0);

        // each behavior should have required fields
        const first = behaviors[0]!;
        expect(first.behavior.org).toEqual('ehmpathy');
        expect(first.behavior.repo).toEqual('rhachet-roles-bhuild');
        expect(first.behavior.name).toBeDefined();
        expect(first.contentHash).toBeDefined();
        expect(first.gatheredAt).toBeDefined();
      });

      then(
        'returns correctly structured BehaviorGathered objects',
        async () => {
          const behaviors = await fetchRemoteRepoBehaviorsViaClone({
            source: {
              org: 'ehmpathy',
              repo: 'rhachet-roles-bhuild',
              branch: 'main',
            },
          });

          // verify structure matches BehaviorGathered interface
          for (const behavior of behaviors) {
            expect(behavior.gatheredAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
            expect(typeof behavior.contentHash).toBe('string');
            expect([
              'wished',
              'envisioned',
              'constrained',
              'blueprinted',
              'inflight',
              'delivered',
            ]).toContain(behavior.status);
            expect(Array.isArray(behavior.files)).toBe(true);
          }
        },
      );
    });
  });
});
