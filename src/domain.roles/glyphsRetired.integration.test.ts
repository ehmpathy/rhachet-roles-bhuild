/**
 * .what = clamps that no RETIRED role glyph survives anywhere in this package
 *
 * .why  = 🌿 was the prioritizer's artifact at its source repo, and 🕯️ was a
 *         draft of the supervisor's. both are retired: the roles wear 🔦 and ⛺.
 *
 *         🔴 the ban is TOTAL — the glyph goes, never merely the role that wore
 *         it. a decorative use is not exempt, and the reason is the whole point:
 *         **a retired artifact that survives as decoration is a retired artifact
 *         a reader still meets.** it carries the old identity wherever it
 *         renders, so a half-ban leaves the package with two answers to "what
 *         does 🌿 mean here?" — the `rule.forbid.ambiguous-labels` failure the
 *         cutover exists to close.
 *
 *         ⇒ so this is package-wide rather than role-scoped, and it is a
 *         SEPARATE clamp from the per-role glyph check in
 *         `roleArtifacts.integration.test.ts` for exactly that reason: a walk
 *         over role dirs cannot see a bullet in a behaver skill.
 *
 * .how  = a real walk of `src/`. the subject is what the shipped tree holds, so
 *         a fixture would prove naught of it (rule.forbid.integration.mocks).
 *
 * .note = it reads the filesystem, so it is an integration test rather than a
 *         unit one (rule.forbid.unit.remote-boundaries).
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllFilesRecursive } from './.test/getAllFilesRecursive';

const DIR_SRC = join(__dirname, '..');

/**
 * .what = the glyphs a role once wore and no longer does
 * .why  = each named with what it WAS, so a reader of a failure learns why the
 *         character is forbidden rather than merely that it is
 */
const GLYPHS_RETIRED: { glyph: string; was: string; now: string }[] = [
  {
    glyph: '🌿',
    was: 'the prioritizer, at sandpine-notebook',
    now: '🔦',
  },
  { glyph: '🕯️', was: 'a draft of the supervisor, never at source', now: '⛺' },
];

/**
 * .what = the one file the ban cannot apply to — this one
 * .why  = a ban has to NAME what it bans, so the declaration holds every glyph
 *         it forbids. without this the clamp finds itself and fails always,
 *         which teaches a reader that the rule is broken rather than the tree
 */
const PATH_EXEMPT = __filename;

describe('glyphsRetired', () => {
  const scene = useBeforeAll(async () => {
    // the ban is over the SHIPPED tree, so the subject is the tree itself —
    // never a glob of the extensions someone remembered to list
    const files = getAllFilesRecursive({ dir: DIR_SRC }).filter(
      (path) => path !== PATH_EXEMPT,
    );
    const found = files.flatMap((path) => {
      const text = readFileSync(path, 'utf8');
      return GLYPHS_RETIRED.filter((retired) =>
        text.includes(retired.glyph),
      ).map((retired) => ({
        path: path.slice(DIR_SRC.length + 1),
        glyph: retired.glyph,
        was: retired.was,
        useInstead: retired.now,
      }));
    });
    return { files, found };
  });

  given('[case1] the whole of src/', () => {
    when('[t0] every file is read', () => {
      // ANTI-VACUITY: a walk that found no files would satisfy the ban below
      // over an empty set, which is the exact toothless shape
      // rule.require.clamp-edge-cases forbids
      then('the subject exists — the walk really reached the tree', () => {
        expect(scene.files.length).toBeGreaterThan(100);
      });

      // and the walk must reach the two lifted role dirs specifically, since
      // those are the trees the cutover moved
      then('and it reached both lifted role dirs', () => {
        const reached = [
          'domain.roles/supervisor/',
          'domain.roles/prioritizer/',
        ].map((prefix) => ({
          prefix,
          reached: scene.files.some((path) =>
            path.slice(DIR_SRC.length + 1).startsWith(prefix),
          ),
        }));
        expect(reached).toEqual([
          { prefix: 'domain.roles/supervisor/', reached: true },
          { prefix: 'domain.roles/prioritizer/', reached: true },
        ]);
      });

      // 🔴 THE teeth. the failure message names the path, the glyph, what it
      //    used to be, and what to write instead — so a human reads the fix
      //    rather than the symptom (rule.require.errors-name-the-fix)
      then('🔴 no retired glyph survives, decoration included', () => {
        expect(scene.found).toEqual([]);
      });
    });
  });
});
