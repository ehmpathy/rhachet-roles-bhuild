import { given, then, when } from 'test-fns';

import { fetchRemoteRepoBehaviorsViaIssues } from './fetchRemoteRepoBehaviorsViaIssues';

describe('fetchRemoteRepoBehaviorsViaIssues', () => {
  given('[case1] a repo with issues', () => {
    when('[t0] fetching issue behaviors', () => {
      then(
        'returns synthetic behaviors from issues with behavior.wish label',
        async () => {
          const behaviors = await fetchRemoteRepoBehaviorsViaIssues({
            source: {
              org: 'ehmpathy',
              repo: 'rhachet-roles-bhuild',
              branch: 'main',
            },
          });

          // may or may not have issues with behavior.wish label
          expect(Array.isArray(behaviors)).toBe(true);

          // if there are behaviors, verify structure
          if (behaviors.length > 0) {
            const first = behaviors[0]!;
            expect(first.behavior.org).toEqual('ehmpathy');
            expect(first.behavior.repo).toEqual('rhachet-roles-bhuild');
            expect(first.status).toEqual('wish');
            expect(first.source.type).toEqual('repo.remote.via.issue');
            if (first.source.type === 'repo.remote.via.issue') {
              expect(first.source.issueNumber).toBeDefined();
            }
            expect(first.wish).toBeDefined();
            expect(first.files).toHaveLength(1);
            expect(first.files[0]!.path).toEqual('0.wish.md');
          }
        },
      );
    });
  });

  given('[case2] a repo without behavior.wish issues', () => {
    when('[t0] fetching issue behaviors', () => {
      then('returns empty array', async () => {
        const behaviors = await fetchRemoteRepoBehaviorsViaIssues({
          source: {
            org: 'ehmpathy',
            repo: 'domain-objects',
            branch: 'main',
          },
        });

        // should return empty array (no issues with behavior.wish label)
        expect(Array.isArray(behaviors)).toBe(true);
        expect(behaviors).toEqual([]);
      });
    });
  });
});
