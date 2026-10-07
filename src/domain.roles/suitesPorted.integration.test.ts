/**
 * .what = clamps that the port carried every lifted TEST SUITE — the ones a
 *         `work/`-scoped glob cannot see above all
 *
 * .why  = 🔴 most lifted suites sit under `skills/work/`. some do not — they
 *         sit BESIDE the skills, one rung up. so a port glob written as
 *         `skills/work/**` carries the first set, drops the second, and every
 *         gate stays green: the dropped suites simply do not run, and a suite
 *         that does not run reports no failure.
 *
 *         that is `rule.forbid.failhide`'s *"skips — hidden lies that pass
 *         ci"*, arrived at by absence rather than by a negation. worse than a
 *         negation, in fact — `suitesGated` can ratchet a negation because a
 *         negation is written down. an absent file is written down nowhere.
 *
 *         ⇒ so the census is keyed on the ONE axis the hazard lives on: is the
 *         suite inside `work/` or outside it? a plain count of eight would be
 *         blind to a drop that a later addition backfilled, which is the same
 *         sum-is-not-a-census lesson `testFixtures` [case2] pays for.
 *
 * .note = `case=6` [t4]/[t8] names ONE outlier —
 *         `git.grove.saturation.integration.test.ts`, *"the only test outside
 *         that dir"* — since cut into five `git.grove.saturation.*` parts.
 *         measured here, the class holds a second member:
 *         `prioritizer/skills/eco.seed.integration.test.ts` wears the identical
 *         shape and the vision missed it. ⇒ the vision named an INSTANCE and
 *         called it the class. this census grades the class, so the second
 *         outlier is covered by construction rather than by a second edit.
 *
 * .the bound = this grades PRESENCE, never health. whether a landed suite
 *         passes is `rhx git.repo.test`'s question, and whether it is allowed
 *         to be red is `suitesGated`'s. three claims, three files.
 */
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllFilesRecursive } from './.test/getAllFilesRecursive';

const DIR_ROLES = __dirname;

/**
 * .what = every lifted suite that sits UNDER `work/`, per role
 * .why  = a per-role EQUALITY, so a cross-role move goes red on both sides —
 *         the same axis `testFixtures` [case2] had to add after a peer counted.
 *         a floor would catch only the side that LOST a suite; the side that
 *         gained one would pass, and a cross-role move is exactly two such
 *         sides at once.
 *
 * ⚠️ .this number MOVES, deliberately, and each move owes a reason. an equality
 *         means a legitimately-added suite turns it red — that is the cost of
 *         the teeth, not a defect in them.
 *
 *         | when | role | quant | why |
 *         |------|------|-------|-----|
 *         | the lift | supervisor | 5 | as ported |
 *         | the lift | prioritizer | 1 | as ported |
 *         | i004 | prioritizer | 1 → 2 | `ecoworkGain.integration.test.ts` — the `F1` proof, extracted so it runs in the required gate |
 *         | F13 | supervisor | 5 → 7 | `ductwork` cut into `.verbs` / `.pane` / `.signal` parts, so one reviewer can hold each whole |
 *         | F13 | supervisor | 7 → 14 | `crewwork` cut into eight parts by subject — verbs, husk, heal, pane, modal, fell, poll, grove |
 *         | F13 | supervisor | 14 → 23 | `work.surface` cut into ten parts by subject — layout, remote, auth, classify, poll, rows, scope, heal, stones, alerts |
 *         | F13 | prioritizer | 2 → 8 | `ecowork` cut into seven parts by subject — quant, goal, migrate, graph, render, mirror, commit |
 *
 * 🔴 .and the comment at [t0] used to say "a ratchet floor rather than an
 *         equality, since a suite added later must not turn this red" while the
 *         assertion beside it was `toEqual`. the prose described a mechanism the
 *         code never had, and the contradiction went unnoticed until the i004
 *         extraction made the code's real behavior visible. the assertion was
 *         right and the comment was wrong, so the comment was repaired — a
 *         header is a cache, and this one had gone stale against its own line.
 */
const SUITES_PORTED = [
  { role: 'supervisor', inWork: true, quant: 23 },
  { role: 'prioritizer', inWork: true, quant: 8 },
];

/**
 * .what = the suites that sit BESIDE the skills, which a `work/` glob misses
 * .why  = 🔴 the whole subject. enumerated BY NAME rather than counted, since a
 *         count would let one silently replace the other
 * .note = `git.tree.behavior.gates` is not a port — it is the verification-stage
 *         clamp on vision case=1 `[t6]`–`[t9]`, the four sprout gates at the
 *         entrypoint. it sits beside the verb it grades, so it lands here
 */
const SUITES_OUTSIDE_WORK = [
  'prioritizer/skills/eco.seed.integration.test.ts',
  'supervisor/skills/git.grove.saturation.census.integration.test.ts',
  'supervisor/skills/git.grove.saturation.forks.integration.test.ts',
  'supervisor/skills/git.grove.saturation.spend.integration.test.ts',
  'supervisor/skills/git.grove.saturation.timeout.integration.test.ts',
  'supervisor/skills/git.grove.saturation.words.integration.test.ts',
  'supervisor/skills/git.tree.behavior.gates.integration.test.ts',
];

describe('suitesPorted', () => {
  const scene = useBeforeAll(async () => {
    const suites = ['supervisor', 'prioritizer']
      .flatMap((role) =>
        getAllFilesRecursive({ dir: join(DIR_ROLES, role, 'skills') }),
      )
      .filter((path) => path.endsWith('.test.ts'))
      .map((path) => path.slice(DIR_ROLES.length + 1));

    const inWork = suites.filter((path) => path.includes('/skills/work/'));
    const outsideWork = suites
      .filter((path) => !path.includes('/skills/work/'))
      .sort();

    return { suites, inWork, outsideWork };
  });

  given('[case1] the suites the lift carried', () => {
    when('[t0] the tree is walked for them', () => {
      // ANTI-VACUITY: a walk that found no suite would satisfy every claim
      // below over an empty set — which is precisely the total-absence shape
      // this clamp exists to catch, one level up
      then('the subject exists — the walk found the lifted suites', () => {
        expect(scene.suites.length).toBeGreaterThanOrEqual(
          SUITES_PORTED.reduce((sum, { quant }) => sum + quant, 0) +
            SUITES_OUTSIDE_WORK.length,
        );
      });

      // the `work/` half, per role — an EQUALITY, so a cross-role move goes
      // red on BOTH sides. a suite added later DOES turn this red, and the
      // reason then rides in `SUITES_PORTED`'s own table (see its .why)
      then('the `work/`-scoped suites landed, per role', () => {
        expect(
          SUITES_PORTED.map(({ role, inWork }) => ({
            role,
            inWork,
            quant: scene.inWork.filter((path) => path.startsWith(`${role}/`))
              .length,
          })),
        ).toEqual(SUITES_PORTED);
      });

      // 🔴 THE teeth. an EQUALITY, not a floor, and by name — these are the ones
      //    a `work/`-scoped glob drops, so the failure must name WHICH one is
      //    absent rather than report a number that fell by one
      then('🔴 and so did the ones that sit outside `work/`', () => {
        expect(scene.outsideWork).toEqual(SUITES_OUTSIDE_WORK);
      });
    });
  });
});
