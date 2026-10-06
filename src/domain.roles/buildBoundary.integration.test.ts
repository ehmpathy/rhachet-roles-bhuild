/**
 * .what = clamps that no DEV-ONLY asset compiles into `dist/`
 *
 * .why  = 🔴 a `skills/` dir ships SHELL. `tsc` does not know that — it compiles
 *         every `.ts` under `src/` that matches no exclude, so a dev-only `.ts`
 *         dropped into a skills dir becomes a **shipped asset** of the package.
 *
 *         this is `case=8`'s mirror half, and it already fired once:
 *         `work/work.harness.ts` carries no `.test` in its name (jest would
 *         then run it as a suite), so it matched no exclude at all and compiled
 *         into `dist/`. the repair was a `**‌/*.harness.ts` exclude — this is the
 *         clamp that keeps it (rule.require.clamp-edge-cases).
 *
 *         ⚠️ the failure is SILENT in every direction a test normally looks. a
 *         package with an extra file still installs, still resolves, still runs
 *         — so an acceptance test that invokes through `dist/` passes clean.
 *         the vision recorded this as a gap with "no guard possible", which is
 *         true of an ACCEPTANCE grain and false of a CONFIG-PARITY one.
 *
 * .how  = two claims, and the second is what makes the first load-central:
 *
 *         1. every `.ts` under a `skills/` dir carries a dev-only marker
 *         2. every marker claim 1 leans on is genuinely excluded by the build
 *
 *         ⇒ claim 1 alone would pass while the build config quietly dropped an
 *         exclude, and claim 2 alone would pass while a `.ts` arrived with no
 *         marker. neither question answers the other.
 *
 * .note = it reads the filesystem and the build config, so it is an integration
 *         test rather than a unit one (rule.forbid.unit.remote-boundaries).
 *
 * 🔴 .what this does NOT cover — and the name invites the misread
 *
 *         "buildBoundary" sounds like it grades the whole build. it does not.
 *         it grades ONE direction at CONFIG-PARITY grain: that no dev-only
 *         `.ts` SHIPS. it is blind to the mirror defect — a runtime asset the
 *         build FAILS to ship — because a config read can see only what the
 *         config states, and the rsync allowlist's `--exclude='*'` tail carried
 *         no `*.mjs` rule to read.
 *
 *         ⇒ that half is `case=8`'s real teeth and it lives elsewhere, at the
 *         only grain that can see it — an ACCEPTANCE test that invokes through
 *         the built package:
 *
 *           blackbox/role=prioritizer/skill.eco.priority.acceptance.test.ts
 *
 *         it is the clamp for `ecowork.db.mjs`, which `ecowork.sh:138` resolves
 *         at runtime and which the build dropped. **read the two together**;
 *         neither is the build's guard alone.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllFilesRecursive } from './.test/getAllFilesRecursive';

const DIR_ROLES = __dirname;
const PATH_TSCONFIG_BUILD = join(DIR_ROLES, '..', '..', 'tsconfig.build.json');

/**
 * .what = the dev-only markers a `.ts` may wear inside a `skills/` dir
 * .why  = each is a real exclude in `tsconfig.build.json`, asserted by [t1].
 *         they are kept as a named set so the two claims below grade the SAME
 *         list — a guard that hardcodes one list per claim can drift silently
 */
const MARKERS_DEVONLY = [
  { marker: '.test.ts', excludedBy: '**/*.test.ts' },
  { marker: '.harness.ts', excludedBy: '**/*.harness.ts' },
  { marker: join('.test', ''), excludedBy: '**/.test/**/*' },
];

/** .what = the `exclude` entries declared by the build's tsconfig */
const getAllExcludes = (input: { said: string }): string[] => {
  const fromExclude = input.said.slice(input.said.indexOf('"exclude"'));
  const untilClose = fromExclude.slice(0, fromExclude.indexOf(']'));
  return (untilClose.match(/"[^"]+"/g) ?? [])
    .map((quoted) => quoted.slice(1, -1))
    .filter((entry) => entry !== 'exclude');
};

describe('buildBoundary', () => {
  const scene = useBeforeAll(async () => {
    const skills = getAllFilesRecursive({ dir: DIR_ROLES })
      .filter((path) => path.endsWith('.ts'))
      .filter((path) => path.includes(join('', 'skills', '')));
    const shipped = skills.filter(
      (path) => !MARKERS_DEVONLY.some(({ marker }) => path.includes(marker)),
    );
    const excludes = getAllExcludes({
      said: readFileSync(PATH_TSCONFIG_BUILD, 'utf8'),
    });
    return { skills, shipped, excludes };
  });

  given('[case1] every .ts that sits inside a skills dir', () => {
    when('[t0] the build boundary is read', () => {
      // ANTI-VACUITY: a walk that found no skills `.ts` would satisfy the
      // teeth below over an empty set — the same silent-absence shape this
      // clamp exists to catch, one level up
      then('the subject exists — the walk found skills code', () => {
        expect(scene.skills.length).toBeGreaterThan(5);
      });

      // and it must reach BOTH lifted seats. a walk bounded to one role would
      // clear the floor above while the other seat went ungraded
      then('and it reached both lifted seats', () => {
        expect(
          ['supervisor', 'prioritizer'].map((role) => ({
            role,
            reached: scene.skills.some((path) =>
              path.includes(join('', role, 'skills', '')),
            ),
          })),
        ).toEqual([
          { role: 'supervisor', reached: true },
          { role: 'prioritizer', reached: true },
        ]);
      });

      // 🔴 THE teeth — a skills dir ships shell, so every .ts in it is dev-only
      then('🔴 none would compile into dist — all are dev-only', () => {
        expect(scene.shipped).toEqual([]);
      });
    });

    when('[t1] the markers are checked against the build config', () => {
      // ANTI-VACUITY: a parse that read zero excludes would satisfy the claim
      // below vacuously, and [t0] would still be green — so the whole guard
      // would assert naught while it reported three passes
      then('the parse found the declared excludes', () => {
        expect(scene.excludes.length).toBeGreaterThan(5);
      });

      // 🔴 and this is what makes [t0] load-central. [t0] trusts that each
      //    marker really is excluded; drop `**/*.harness.ts` from the build
      //    config and [t0] stays GREEN while the harness ships again
      then(
        '🔴 every marker [t0] leans on is truly excluded by the build',
        () => {
          expect(
            MARKERS_DEVONLY.map(({ marker, excludedBy }) => ({
              marker,
              declared: scene.excludes.includes(excludedBy),
            })),
          ).toEqual(
            MARKERS_DEVONLY.map(({ marker }) => ({ marker, declared: true })),
          );
        },
      );
    });
  });
});
