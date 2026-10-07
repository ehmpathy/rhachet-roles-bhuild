import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = the clamp that keeps a real operator's people, orgs, repos, and
 *         initiatives out of the source tree
 *
 * .why  = the supervisor + prioritizer roles were lifted from one fleet, and
 *        their briefs cited its humans and its business by name. a published
 *        package is read by every consumer, so names are scrubbed to the demo
 *        business (`sandpine`) and a placeholder human (`bert`) — and
 *        this goes red if a later lift carries one back.
 *
 * .note = this file names the terms; it is a test, so it never enters `dist/`
 */
describe('orgNamesAbsent', () => {
  const DIR_ROLES = __dirname;

  // the names scrubbed at the lift; matched case-insensitive, as substrings
  //
  // .note = a published role teaches with the demo business `sandpine`, never
  //         the operator it was lifted from — a real org is harmless to name
  //         and still wrong to teach from. people stay forbidden as well
  //         (rule.forbid.private-business-in-published-roles,
  //         rule.forbid.real-identities-in-fixtures).
  const TERMS_FORBIDDEN = [
    // people
    'uladkasach',
    'vlad',
    // orgs, and the private notebook the roles were lifted from
    'ahbode',
    'nheuron',
    // the source operator's repos, services, and initiatives
    'hometools',
    'proknow',
    'svc-gateway',
    'scan-to-save',
    'leadfaucet',
    'caller-region',
    'marketplace-lead-capture',
    '10kpm',
  ];

  // what `build:complete:dist` copies into `dist/` — every shipped kind
  const isShipped = (path: string): boolean =>
    !/\.test\.[a-z]+$/.test(path) &&
    !path.includes('__snapshots__') &&
    !path.includes('/.test/') &&
    /\.(md|md\.min|sh|mjs|jsonc|yml|stone|guard)$|\.guard\.[a-z]+$/.test(path);

  const getAllFilesUnder = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? getAllFilesUnder(path) : [path];
    });

  const scene = useBeforeAll(async () => {
    const files = getAllFilesUnder(DIR_ROLES).filter(isShipped);
    const hits = files.flatMap((path) => {
      const text = readFileSync(path, 'utf-8').toLowerCase();
      return TERMS_FORBIDDEN.filter((term) => text.includes(term)).map(
        (term) => `${relative(DIR_ROLES, path)}: ${term}`,
      );
    });
    return { files, hits };
  });

  given('[case1] every file under src/domain.roles that ships', () => {
    when('[t0] each is read for the forbidden org names', () => {
      then('the scan is not vacuous — it read the lifted roles', () => {
        // ANTI-VACUITY: a filter that matched naught would pass over naught
        const rel = scene.files.map((f) => relative(DIR_ROLES, f));
        expect(rel.some((f) => f.startsWith('supervisor/briefs/'))).toEqual(
          true,
        );
        expect(rel.some((f) => f.startsWith('prioritizer/skills/'))).toEqual(
          true,
        );
      });

      then('🔴 no shipped file names the org', () => {
        expect(scene.hits).toEqual([]);
      });
    });
  });

  given('[case2] a shipped brief that names the handle', () => {
    when('[t0] it is held against the same scan', () => {
      then('🔴 it goes RED — the bite proof', () => {
        const text = 'source: ULADKASACH/repo:src/handoff.md'.toLowerCase();
        expect(TERMS_FORBIDDEN.filter((t) => text.includes(t))).toEqual([
          'uladkasach',
        ]);
      });
    });
  });

  // 🔴 [case1] scopes to SHIPPED kinds under src/domain.roles, because its harm
  //    is a consumer who reads the package. that scope has a hole, and the hole
  //    is not hypothetical: a forbidden name in a TEST, or in a tree outside
  //    src/domain.roles (e.g. `src/domain.operations/radio/permission/`), is
  //    one [case1] could never see — and a scrub held by hand is not a clamp.
  //
  //    `rule.forbid.real-identities-in-fixtures` reaches further than `isShipped`
  //    does: "test code, fixtures, and snapshots must never carry a real
  //    person's name" — because a name in a fixture "ships to every clone of
  //    the repo and every fork, forever". `uladkasach` is a real person's
  //    handle, so the test corpus is in scope for the identity harm even though
  //    it never enters dist/.
  //
  //    ⇒ so this case drops `isShipped` and widens to EVERY file under src/ and
  //      blackbox/. one carve-out: this file, which must name the terms to test
  //      for them.
  given('[case3] every file under src/ and blackbox/, shipped or not', () => {
    const sceneWide = useBeforeAll(async () => {
      const dirRepo = join(DIR_ROLES, '..', '..');
      const roots = ['src', 'blackbox']
        .map((name) => join(dirRepo, name))
        .filter((path) => existsSync(path));
      const files = roots
        .flatMap(getAllFilesUnder)
        .filter((path) => path !== __filename);
      const hits = files.flatMap((path) => {
        const text = readFileSync(path, 'utf-8').toLowerCase();
        return TERMS_FORBIDDEN.filter((term) => text.includes(term)).map(
          (term) => `${relative(dirRepo, path)}: ${term}`,
        );
      });
      return { files, hits };
    });

    when('[t0] each is read for the forbidden org names', () => {
      then(
        'the scan is not vacuous — it reached past the shipped kinds',
        () => {
          // ANTI-VACUITY, and it is the whole point of this case: prove the walk
          // sees the two shapes [case1] filters out — a `.test.ts`, and a file
          // outside src/domain.roles
          const rel = sceneWide.files.map((f) => relative(DIR_ROLES, f));
          expect(rel.some((f) => /\.test\.ts$/.test(f))).toEqual(true);
          expect(
            rel.some((f) =>
              f.includes(join('domain.operations', 'radio', 'permission')),
            ),
          ).toEqual(true);
          // and it is strictly wider than [case1], never a re-run of it
          expect(sceneWide.files.length).toBeGreaterThan(scene.files.length);
        },
      );

      then('🔴 no file in the source tree names the org', () => {
        expect(sceneWide.hits).toEqual([]);
      });
    });
  });
});
