import { given, then, when } from 'test-fns';

import { fetchRemoteRepoBehaviorsViaPrs } from './fetchRemoteRepoBehaviorsViaPrs';

const hasGithubToken = !!process.env.GITHUB_TOKEN;

describe('fetchRemoteRepoBehaviorsViaPrs', () => {
  given.skipIf(!hasGithubToken)('[case1] a repo with PRs', () => {
    when('[t0] fetching PR behaviors', () => {
      then('returns behaviors from PRs with behavior label', async () => {
        const behaviors = await fetchRemoteRepoBehaviorsViaPrs({
          source: {
            org: 'ehmpathy',
            repo: 'rhachet-roles-bhuild',
            branch: 'main',
          },
        });

        // may or may not have PRs with behavior label
        expect(Array.isArray(behaviors)).toBe(true);

        // if there are behaviors, verify structure
        if (behaviors.length > 0) {
          const first = behaviors[0]!;
          expect(first.behavior.org).toEqual('ehmpathy');
          expect(first.behavior.repo).toEqual('rhachet-roles-bhuild');
          expect(first.source.type).toEqual('repo.remote.via.pr');
          if (first.source.type === 'repo.remote.via.pr') {
            expect(first.source.prNumber).toBeDefined();
            expect(first.source.prBranch).toBeDefined();
          }
        }
      });
    });
  });

  given.skipIf(!hasGithubToken)(
    '[case2] a repo without behavior-labeled PRs',
    () => {
      when('[t0] fetching PR behaviors', () => {
        then('returns empty array', async () => {
          const behaviors = await fetchRemoteRepoBehaviorsViaPrs({
            source: {
              org: 'ehmpathy',
              repo: 'domain-objects',
              branch: 'main',
            },
          });

          // should return empty array (no PRs with behavior label)
          expect(Array.isArray(behaviors)).toBe(true);
          expect(behaviors).toEqual([]);
        });
      });
    },
  );
});
