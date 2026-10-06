/**
 * .what = clamps that every captured-pane FIXTURE reaches the commit
 *
 * .why  = 🔴 a captured pane wears `.log`, because that is what `tmux
 *         capture-pane` writes. this repo's `.gitignore` opens with `*.log`.
 *
 *         ⇒ so the whole fixture corpus — 56 files, each one a bug that
 *         already shipped — lands on disk, passes every suite locally, and is
 *         **absent from the commit**. the failure is silent in every
 *         direction: no error on write, no error on test, and a clean `git
 *         status` because an ignored file is not untracked.
 *
 *         it then fails on a machine that never had them, as "the classifier
 *         is broken" rather than "the corpus never arrived".
 *
 *         the cause-level repair is a negation in `.gitignore`. this is the
 *         clamp that keeps it: a future edit that drops the negation, or a new
 *         asset dir under a differently-named path, goes RED here
 *         (rule.require.clamp-edge-cases).
 *
 * .how  = it asks GIT, never the filesystem. the subject is precisely the gap
 *         between "on disk" and "in the commit", so a filesystem read answers
 *         the wrong question and answers it green.
 *
 * .note = it shells out and reads the tree, so it is an integration test
 *         rather than a unit one (rule.forbid.unit.remote-boundaries).
 */
import { execFileSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllFilesRecursive } from './.test/getAllFilesRecursive';

const DIR_SRC = join(__dirname, '..');
const DIR_REPO = join(DIR_SRC, '..');

/**
 * .what = the measured size of the fixture corpus, as a RATCHET floor
 *
 * .why  = every fixture is a bug that already shipped
 *         (rule.always.clamp-the-verbatim-pane-your-classifier-judged), so the
 *         corpus only ever grows. ⇒ a fall is always a defect, and a rise is
 *         always a deliberate edit to this one line.
 *
 *         🔴 a ROUND floor cannot do this job. the prior `> 20`, over a corpus
 *         of 56, answered only "did the walk grade at all?" — it stayed green
 *         through a 62% drop, which is the exact partial-absence this clamp
 *         exists to catch. an anti-vacuity threshold and a completeness floor
 *         are two different questions, and one number cannot answer both.
 *
 * .note = 56 = 51 `pane.*` + 4 `render.*` + 1 `eco.priority.*`, measured
 *         2026-09-25. cite the count, never the `pane.` prefix — the corpus is
 *         named for its commonest member, never bounded by it.
 *
 *         🔴 this note read "51 panes + 5 renders" until a peer reviewer
 *         counted. `51 + 5 = 56` is arithmetically true and factually false:
 *         there are FOUR renders, and the 56th is a captured eco.priority
 *         body. the wrong decomposition summed to the right total, so every
 *         check of the TOTAL passed over it. ⇒ a sum is not a census.
 */
const QUANT_FIXTURES = 56;

/**
 * .what = the fixture census, per role dir
 *
 * .why  = 🔴 the corpus-wide count above CANNOT see a cross-role move. shift a
 *         fixture from supervisor/ to prioritizer/ and the sum is unchanged, so
 *         [case1] stays green — which is precisely the split `case=6` warns of
 *         by name ("classifiers land with their fixtures").
 *
 *         ⇒ the same lesson as the ratchet, one axis over: a TOTAL answers "is
 *         the corpus whole?" and is blind to "is each fixture where its
 *         classifier is?". two questions, two asserts.
 *
 * .note = every fixture is consumed by a supervisor suite today, and that
 *         covers `eco.priority.get.truncated-body.log` too — it is named for
 *         the prioritizer skill whose output it CAPTURES, and it is read by
 *         `crewwork.poll.integration.test.ts` [case29], a supervisor test of
 *         `__crew_eco_star_verdict`. so it is a supervisor fixture wearing a
 *         prioritizer-shaped name, and a census keyed on the NAME would move it
 *         wrongly. this census keys on the dir, which keys on its reader.
 */
const QUANT_FIXTURES_BY_ROLE = [
  { role: 'supervisor', quant: 56 },
  { role: 'prioritizer', quant: 0 },
];

/** .what = every file under a `.test/.assets/` dir anywhere in src/ */
const getAllFixtures = (input: { dir: string }): string[] =>
  readdirSync(input.dir).flatMap((entry) => {
    const path = join(input.dir, entry);
    if (!statSync(path).isDirectory()) return [];
    if (path.endsWith(join('.test', '.assets')))
      return getAllFilesRecursive({ dir: path });
    return getAllFixtures({ dir: path });
  });

/**
 * .what = the paths git refuses to track, of those handed to it
 * .why  = `git check-ignore` is the one authority on this. a `.gitignore` read
 *         by hand would have to re-implement precedence, negation, and nested
 *         scopes — and the defect this clamps is exactly a precedence subtlety
 */
const getAllIgnored = (input: { paths: string[] }): string[] => {
  if (!input.paths.length) return [];
  try {
    const said = execFileSync('git', ['check-ignore', '--stdin'], {
      cwd: DIR_REPO,
      input: input.paths.join('\n'),
      encoding: 'utf8',
    });
    return said.split('\n').filter((line) => line.trim());
  } catch (error) {
    // node throws an Error that CARRIES `status`, which its own types do not
    // declare. so we NARROW to reach it, never cast (rule.forbid.as-cast) —
    // a cast would assert a shape the runtime is free to withhold, and the
    // withheld case is the one that matters: a git that broke for some OTHER
    // reason must rethrow, never read as "no path is ignored"
    //
    // 🔴 and the narrow must NOT lead with `instanceof Error`. jest runs this
    //    file in a sandboxed realm, so an error minted inside `child_process`
    //    carries a DIFFERENT `Error` than the one in scope here, and the check
    //    is false for a real node error. `typeof === 'object'` is realm-safe;
    //    `instanceof` is not. (this clamp caught exactly that, on itself.)
    const status =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number'
        ? error.status
        : null;

    // git check-ignore exits 1 when NO path is ignored — the goal state
    if (status === 1) return [];
    throw error;
  }
};

describe('testFixtures', () => {
  const scene = useBeforeAll(async () => {
    const fixtures = getAllFixtures({ dir: DIR_SRC });
    const ignored = getAllIgnored({ paths: fixtures });
    return { fixtures, ignored };
  });

  given('[case1] the captured-pane corpus', () => {
    when('[t0] git is asked what it would track', () => {
      // ANTI-VACUITY: a walk that found no asset dir would satisfy the claim
      // below over an empty set — which is the same silent-absence shape this
      // whole clamp exists to catch, one level up
      then('the subject exists — the walk found the whole corpus', () => {
        expect(scene.fixtures.length).toBeGreaterThanOrEqual(QUANT_FIXTURES);
      });

      // and it must be the `.log` half specifically, since `*.log` is the
      // rule that swallows them. a corpus of only `.md` assets would pass the
      // claim below while the hazard sat untouched
      then('and the swallowed extension covers the corpus', () => {
        const panes = scene.fixtures.filter((path) => path.endsWith('.log'));
        expect(panes.length).toBeGreaterThanOrEqual(QUANT_FIXTURES);
      });

      // 🔴 THE teeth
      then(
        '🔴 git would track every one — none is swallowed by an ignore',
        () => {
          expect(scene.ignored).toEqual([]);
        },
      );
    });
  });

  given('[case2] the census, per role dir', () => {
    when('[t1] each role dir is counted on its own', () => {
      // ANTI-VACUITY: a census over zero role dirs would satisfy the teeth
      // below vacuously, and [case1] would stay green — so the whole guard
      // would report two passes over an unwalked tree
      then('the subject exists — the roles under census are real dirs', () => {
        expect(
          QUANT_FIXTURES_BY_ROLE.map(({ role }) => ({
            role,
            exists: existsSync(join(__dirname, role)),
          })),
        ).toEqual(
          QUANT_FIXTURES_BY_ROLE.map(({ role }) => ({ role, exists: true })),
        );
      });

      // 🔴 THE teeth — an exact count per role, so a cross-role move goes red
      //    on BOTH sides at once: the source falls short, the target overshoots.
      //    [case1]'s corpus-wide sum sees neither, because a move conserves it
      then('🔴 each role holds exactly the fixtures it reads', () => {
        expect(
          QUANT_FIXTURES_BY_ROLE.map(({ role }) => ({
            role,
            quant: getAllFixtures({ dir: join(__dirname, role) }).length,
          })),
        ).toEqual(QUANT_FIXTURES_BY_ROLE);
      });

      // and the two claims must RECONCILE. without this, [case1] could count 56
      // corpus-wide while the census summed to 40 over its two roles — each
      // green, and 16 fixtures sat in a role dir no census names
      then('and the census accounts for the whole corpus', () => {
        const counted = QUANT_FIXTURES_BY_ROLE.reduce(
          (sum, { quant }) => sum + quant,
          0,
        );
        expect(counted).toEqual(scene.fixtures.length);
      });
    });
  });
});
