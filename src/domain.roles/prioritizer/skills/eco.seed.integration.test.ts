/**
 * .what = clamps for `eco.seed` — the skill that asks "who else knows about this?"
 *
 * .why  = this skill exists because the BY-HAND version of it lied. five
 *         reads on 2026-09-13 produced a confident finding —
 *
 *           "two of three are tracked nowhere"
 *
 *         — off a `gh issue list` that prints an empty set both when a repo
 *         holds no issues AND when the token cannot read them. an absence
 *         and a blindness are byte-identical at the caller.
 *
 *         ⇒ so the ONE property worth clamping is the discriminator:
 *
 *           ✅ found N     the read succeeded, N records match
 *           ⚪ none        the read SUCCEEDED, and no record matched
 *           ⚠️ unreadable  the read FAILED. this is NOT "none"
 *
 *         a regression that collapses the last two does not error and does
 *         not warn. it returns a report that reads CLEAN and is a
 *         term=partial-audit — which is exactly the defect the skill
 *         replaces (rule.require.clamp-edge-cases).
 *
 * .how  = the REAL skill, over a real temp store, against real gh and real
 *         repo reads. no mock — the whole subject here is whether a FAILED
 *         read is distinguishable from an EMPTY one, and a mock decides
 *         that by fiat (rule.forbid.integration.mocks)
 *
 * .note = ⚠️ the clamps below prove their teeth against the GH source. each
 *         was run with its own lever removed and watched go red:
 *
 *           [t2] the render     — collapse the `unreadable` branch → red
 *           [t3] the exit code  — set UNREADABLE=0 on a failed pull → red
 *
 *         two separate levers, because the report a human reads and the
 *         code a caller reads are two independent claims.
 *
 *         🔴 the GARDENS source runs the same three states and is NOT
 *         clamped here. a garden read fails only under a broken auth or a
 *         network fault, and neither is reachable from a test that may not
 *         fake its inputs. ⇒ the gap is named rather than hidden; the
 *         cure is a seam that lets the garden read be pointed at a repo
 *         that refuses (.dream/v2026_09_14.feat.clamp-the-gardens-unreadable-state.md)
 */
import { execFileSync, spawnSync } from 'child_process';
import { join } from 'path';
import { given, then, useBeforeAll } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';

const PATH_ECOWORK_DB = join(__dirname, 'work', 'ecowork.db.mjs');
const PATH_ECO_SEED_SH = join(__dirname, 'eco.seed.sh');

/**
 * .what = run eco.seed against one store, and hand back its whole verdict
 * .why  = the exit code carries half the contract — a report that names an
 *         unreadable source and still exits 0 is the defect, so stdout
 *         alone is never enough to grade a run
 */
const seed = (input: { db: string; args: string }) =>
  spawnSync('bash', ['-c', `'${PATH_ECO_SEED_SH}' ${input.args}`], {
    encoding: 'utf8',
    env: { ...process.env, ECOWORK_DB: input.db },
    timeout: 180_000,
  });

/**
 * .what = read one row's refTask list straight out of the store
 * .why  = `gen` writes in two places — a foreign repo, then this row. the
 *         clamps that matter grade the ROW, because stdout and the exit
 *         code are correlates of the record rather than the record itself
 *         (rule.require.trust-but-verify)
 */
const readRefTask = (input: { db: string; slug: string }): string[] => {
  const raw = execFileSync('node', [PATH_ECOWORK_DB, 'get', input.db], {
    input: '{}',
    encoding: 'utf8',
    timeout: 30_000,
  });
  const row = JSON.parse(raw).priorities.find(
    (p: { slug: string }) => p.slug === input.slug,
  );
  if (!row)
    throw new Error(`readRefTask: no row holds the slug '${input.slug}'`);
  return row.refTask ?? [];
};

/** .what = a db path nobody else holds, so no clamp can see another's rows */
const genDbPath = (input: { slug: string }) =>
  join(tempDirs.genOne({ slug: input.slug }), 'priority.db');

/**
 * .what = a gardens glob that matches no repo, so the gardens source is
 *         quiet and every claim below reads the GH source alone
 * .why   = eco.seed reads two sources per row. a clamp aimed at the gh
 *         discriminator must not go red because a garden read was slow
 */
const GARDENS_QUIET = 'ehmpathy/no-such-garden-for-a-clamp-*';

afterAll(() => tempDirs.delAll());

describe('eco.seed', () => {
  given('[case1] a human who reaches for --help', () => {
    const help = useBeforeAll(async () =>
      seed({ db: genDbPath({ slug: 'seed-help' }), args: '--help' }),
    );

    then('[t0] it exits 0 rather than "a verb is required"', () => {
      expect(help.status).toEqual(0);
    });

    // 🔴 the three states ARE the skill. a help that names two of them
    //    teaches the exact collapse the skill was built to prevent
    then('[t1] it teaches all THREE states, never two', () => {
      expect(help.stdout).toContain('found');
      expect(help.stdout).toContain('none');
      expect(help.stdout).toContain('unreadable');
    });

    then('[t2] it says out loud that unreadable is NOT none', () => {
      expect(help.stdout).toContain('this is not "none"');
    });
  });

  given('[case2] a call the skill cannot act on', () => {
    const db = genDbPath({ slug: 'seed-refuse' });

    const scene = useBeforeAll(async () => {
      execFileSync('node', [PATH_ECOWORK_DB, 'set', db], {
        input: JSON.stringify({
          slug: 'altrock://known-row',
          sev: 'p2',
          urg: '1w',
          what: 'a row that exists',
        }),
        encoding: 'utf8',
        timeout: 30_000,
      });
      return {
        subjectless: seed({ db, args: `--gardens '${GARDENS_QUIET}'` }),
        verbless: seed({
          db,
          args: `--for altrock://known-row --gardens '${GARDENS_QUIET}'`,
        }),
        badVerb: seed({
          db,
          args: `put --for altrock://known-row --gardens '${GARDENS_QUIET}'`,
        }),
        absent: seed({
          db,
          args: `get --for no-such-slug --gardens '${GARDENS_QUIET}'`,
        }),
      };
    });

    then(
      '[t0] a call with neither --for nor --all is refused, and names both',
      () => {
        expect(scene.subjectless.status).toEqual(2);
        expect(scene.subjectless.stderr).toContain('--for');
        expect(scene.subjectless.stderr).toContain('--all');
      },
    );

    // 🔴 a flag in the first slot is a FLAG, never a verb. the naive parse
    //    reads `--for` as the verb and refuses with "verb '--for' is not one
    //    of: get" — an error that names the wrong defect and hides the real
    //    one, which is the partial-audit shape at the ARGV layer
    then(
      '[t0b] a flag in the first slot is parsed as a flag, never a verb',
      () => {
        expect(scene.verbless.stderr).not.toContain("verb '--for'");
        expect(scene.verbless.status).toEqual(0);
      },
    );

    then(
      '[t1] a verb outside the closed set is refused, and names the set',
      () => {
        expect(scene.badVerb.status).toEqual(2);
        expect(scene.badVerb.stderr).toContain('get');
      },
    );

    // 🔴 a slug nobody declared must REFUSE, never render an empty report.
    //    an empty report over a subject that does not exist is the same
    //    partial-audit shape one level up — it reads "tracked nowhere"
    then(
      '[t2] a slug no row holds is refused rather than reported empty',
      () => {
        expect(scene.absent.status).toEqual(2);
        expect(scene.absent.stderr).toContain('no-such-slug');
      },
    );
  });

  given('[case3] a real row, read across the sources', () => {
    const db = genDbPath({ slug: 'seed-states' });

    const scene = useBeforeAll(async () => {
      execFileSync('node', [PATH_ECOWORK_DB, 'set', db], {
        input: JSON.stringify({
          slug: 'altrock://sms-tune',
          sev: 'p1',
          urg: '1w',
          what: 'a priority that may or may not be queued somewhere',
        }),
        encoding: 'utf8',
        timeout: 30_000,
      });
      return {
        unasked: seed({
          db,
          args: `get --for altrock://sms-tune --gardens '${GARDENS_QUIET}'`,
        }),
        // no --gardens at all — the package names no org's gardens, so the
        // source must say it was not asked rather than search a default
        gardenless: seed({
          db,
          args: `get --for altrock://sms-tune`,
        }),
        // a repo that cannot be read — the pull exits non-zero, which is
        // the property the whole discriminator rests on
        blind: seed({
          db,
          args:
            `get --for altrock://sms-tune --gardens '${GARDENS_QUIET}' ` +
            `--in 'ehmpathy/no-such-repo-for-an-eco-seed-clamp'`,
        }),
      };
    });

    // 🔴 "I was not asked" is a THIRD kind of quiet, and it must not read
    //    as "I looked and found naught". the skill refuses to guess which
    //    repo owns a priority, and the report has to say so
    then(
      '[t0] with no --in, the gh source reports NOT ASKED — never none',
      () => {
        expect(scene.unasked.stdout).toContain('NOT ASKED');
        expect(scene.unasked.stdout).not.toMatch(
          /gh\.issues[\s\S]{0,200}⚪ none/,
        );
      },
    );

    then('[t1] and it names the flag that would ask', () => {
      expect(scene.unasked.stdout).toContain('--in');
    });

    // 🔴 THE teeth. an unreadable source must be visibly unreadable AND
    //    must poison the exit code. if this ever goes green with the
    //    discriminator removed, the skill is back to the by-hand lie
    then('[t2] an unreadable repo reports UNREADABLE, never none', () => {
      expect(scene.blind.stdout).toContain('UNREADABLE');
      expect(scene.blind.stdout).toContain("this is NOT 'none'");
    });

    // stdout is read by a human; the exit code is read by a caller. a
    // report that names a blind source and exits 0 lets an automated
    // caller record "tracked nowhere" off an answer nobody has
    then(
      '[t3] an unreadable source exits 2, so no caller reads it as a verdict',
      () => {
        expect(scene.blind.status).toEqual(2);
        expect(scene.blind.stdout).toContain('do NOT record');
      },
    );

    // 🔴 a published package must not search one org's gardens by default.
    //    with no --gardens, the gardens source reports NOT ASKED and names
    //    the flag — never a read of a baked-in org glob
    then(
      '[t3b] with no --gardens, the gardens source reports NOT ASKED and names the flag',
      () => {
        expect(scene.gardenless.status).toEqual(0);
        expect(scene.gardenless.stdout).toMatch(
          /gardens\n[^\n]*⚪ NOT ASKED — name a garden glob with --gardens/,
        );
        expect(scene.gardenless.stdout).not.toContain('sandpine');
      },
    );

    then('[t4] a clean run exits 0 and says every source read clean', () => {
      expect(scene.unasked.status).toEqual(0);
      expect(scene.unasked.stdout).toContain('every source read clean');
    });
  });

  // 🔴 a slug names the WORK ('altrock://sms-tune'); a garden names the NEED
  //    ('sms-savings'). the two rarely share a string, so a slug-only
  //    search returns a ⚪ that read cleanly and concluded falsely
  given('[case4] a search term that is not the slug', () => {
    const db = genDbPath({ slug: 'seed-words' });

    const scene = useBeforeAll(async () => {
      execFileSync('node', [PATH_ECOWORK_DB, 'set', db], {
        input: JSON.stringify({
          slug: 'altrock://sms-tune',
          sev: 'p1',
          urg: '1w',
          what: 'the work, named for the work',
        }),
        encoding: 'utf8',
        timeout: 30_000,
      });
      return seed({
        db,
        args: `get --for altrock://sms-tune --gardens '${GARDENS_QUIET}' --words 'sms-savings'`,
      });
    });

    then('[t0] --words replaces the slug as the term searched', () => {
      expect(scene.stdout).toContain('sms-savings');
    });

    // the row is still addressed BY slug — --words changes what is hunted
    // for, never which priority the report is about
    then('[t1] and the row is still the one named by --for', () => {
      expect(scene.stdout).toContain('altrock://sms-tune');
    });
  });

  // 🔴 `gen` WRITES — to a foreign repo, and then back onto the row. so the
  //    clamps that matter are the ones which prove it writes naught when it
  //    must not (rule.require.safe-by-default)
  given('[case5] a gen call the skill must refuse, or merely preview', () => {
    const db = genDbPath({ slug: 'seed-gen-refuse' });

    const scene = useBeforeAll(async () => {
      execFileSync('node', [PATH_ECOWORK_DB, 'set', db], {
        input: JSON.stringify({
          slug: 'altrock://gen-row',
          sev: 'p2',
          urg: '1w',
          what: 'a row somebody else ought to know about',
          why: 'because the store holds it and their queue does not',
        }),
        encoding: 'utf8',
        timeout: 30_000,
      });
      return {
        bulk: seed({ db, args: `gen --all --into foo/bar` }),
        repoless: seed({ db, args: `gen --for altrock://gen-row` }),
        badMode: seed({
          db,
          args: `gen --for altrock://gen-row --into foo/bar --mode blah`,
        }),
        absent: seed({ db, args: `gen --for no-such-slug --into foo/bar` }),
        plan: seed({
          db,
          args: `gen --for altrock://gen-row --into ehmpathy/rhachet`,
        }),
        refsAfterPlan: readRefTask({ db, slug: 'altrock://gen-row' }),
      };
    });

    // a bulk seed would push one issue per row into ONE foreign repo, and
    // each push is unreversible on its own. refused at the argv layer
    then('[t0] --all is refused, and points back at --for', () => {
      expect(scene.bulk.status).toEqual(2);
      expect(scene.bulk.stderr).toContain('--for');
    });

    then('[t1] an absent --into is refused rather than guessed', () => {
      expect(scene.repoless.status).toEqual(2);
      expect(scene.repoless.stderr).toContain('--into');
    });

    then(
      '[t2] a mode outside the closed set is refused, and names the set',
      () => {
        expect(scene.badMode.status).toEqual(2);
        expect(scene.badMode.stderr).toContain('plan apply');
      },
    );

    then('[t3] a slug no row holds is refused before any push', () => {
      expect(scene.absent.status).toEqual(2);
      expect(scene.absent.stderr).toContain('no-such-slug');
    });

    // 🔴 THE teeth of this case. a plan that quietly pushed would be a
    //    write nobody asked for, into a repo this store does not own — and
    //    the exit code, the render, and the stdout would all read identical
    then('[t4] plan mode leaves the row exactly as it found it', () => {
      expect(scene.plan.status).toEqual(0);
      expect(scene.refsAfterPlan).toEqual([]);
    });

    then('[t5] and it says out loud that naught was written', () => {
      expect(scene.plan.stdout).toContain('naught was written');
      expect(scene.plan.stdout).toContain('--mode apply');
    });

    // a title without the slug cannot be found by the same term a later
    // `get` searches with, so the loop this verb closes would re-open
    then('[t6] the title it would push carries the slug', () => {
      expect(scene.plan.stdout).toContain(
        'title: 🔦 priority - altrock://gen-row',
      );
    });

    // 🔴 a sev pasted into a foreign queue with no owner reads as THAT
    //    repo's grade. it is this store's human judgment and must say so
    then(
      '[t7] the body marks the opine as the store own, never the repo own',
      () => {
        expect(scene.plan.stdout).toContain("this store's, not this repo's");
        expect(scene.plan.stdout).toContain('does not reach the store');
      },
    );

    then('[t8] and the body carries a runnable backref to the row', () => {
      expect(scene.plan.stdout).toContain(
        'rhx eco.priority get --slug altrock://gen-row',
      );
    });
  });

  // 🔴 the order is push → crossref → verify, so a failed push must halt
  //    BEFORE the row is touched. a ref written against a push that never
  //    landed points at an issue no reader can open, and the next `get`
  //    would report the priority TRACKED off it — a partial-audit the
  //    store itself authored
  given('[case6] a gen apply whose push cannot land', () => {
    const db = genDbPath({ slug: 'seed-gen-blind' });

    const scene = useBeforeAll(async () => {
      execFileSync('node', [PATH_ECOWORK_DB, 'set', db], {
        input: JSON.stringify({
          slug: 'altrock://doomed-push',
          sev: 'p3',
          urg: '1m',
          what: 'a row aimed at a repo that refuses the write',
        }),
        encoding: 'utf8',
        timeout: 30_000,
      });
      const run = seed({
        db,
        args: `gen --for altrock://doomed-push --into 'ehmpathy/no-such-repo-for-an-eco-seed-gen-clamp' --mode apply`,
      });
      return {
        run,
        refsAfter: readRefTask({ db, slug: 'altrock://doomed-push' }),
      };
    });

    then('[t0] it exits 1 rather than report a seed nobody can read', () => {
      expect(scene.run.status).toEqual(1);
    });

    // 🔴 the teeth. this is the one property the three-step order buys
    then(
      '[t1] and the row carries no ref to an issue that never landed',
      () => {
        expect(scene.refsAfter).toEqual([]);
      },
    );

    then(
      '[t2] and it says which half failed, and that the row is untouched',
      () => {
        expect(scene.run.stderr).toContain('the row is untouched');
      },
    );
  });

  // 🔴 a gate is named by SLUG, and a slug means naught in the repo the
  //    dispatch lands in. so a held row that merely said `held` would hand a
  //    crew unstartable work with no way to learn what holds it — which is
  //    why the gate is rendered as the ISSUE that tracks it
  given('[case7] a gen call on a row other rows hold shut', () => {
    const db = genDbPath({ slug: 'seed-gen-gates' });

    // ⚠️ a slug IS a goal uri, and the FK is top-down — so the whole is
    //    declared before any part. a bare slug here would die on the shape
    //    refusal and read as a gate defect, which is the claim under test
    const ROOT = 'bigrock://gates';
    const TRACKED = 'subrock://gates/tracked';
    const UNTRACKED = 'subrock://gates/untracked';
    const HELD = 'subrock://gates/held';
    const LONELY = 'subrock://gates/lonely';

    const scene = useBeforeAll(async () => {
      const set = (payload: Record<string, unknown>) =>
        execFileSync('node', [PATH_ECOWORK_DB, 'set', db], {
          input: JSON.stringify(payload),
          encoding: 'utf8',
          timeout: 30_000,
        });

      set({ slug: ROOT, sev: 'p2', urg: '1w', what: 'the whole' });

      // the gaters before the gated — a gate edge points at a row that exists
      set({
        slug: TRACKED,
        sev: 'p2',
        urg: '1w',
        what: 'the half somebody already queued',
        refTask: ['ehmpathy/rhachet#542'],
      });
      set({
        slug: UNTRACKED,
        sev: 'p3',
        urg: '1m',
        what: 'the half nobody queued anywhere',
      });
      set({
        slug: HELD,
        sev: 'p3',
        urg: '1m',
        what: 'the work both halves hold shut',
        gatedBy: [TRACKED, UNTRACKED],
      });
      set({
        slug: LONELY,
        sev: 'p3',
        urg: '1m',
        what: 'the work no other row holds shut',
      });

      return {
        gated: seed({
          db,
          args: `gen --for '${HELD}' --into ehmpathy/rhachet`,
        }),
        lonely: seed({
          db,
          args: `gen --for '${LONELY}' --into ehmpathy/rhachet`,
        }),
      };
    });

    then('[t0] the body names the hold outright', () => {
      expect(scene.gated.status).toEqual(0);
      expect(scene.gated.stdout).toContain('.the gates');
      expect(scene.gated.stdout).toContain('HELD');
    });

    // 🔴 THE teeth. a slug in a foreign queue is unreachable; an issue ref is
    //    a link github resolves, and it carries the gate's own live state
    then('[t1] a gate with a task renders as the ISSUE that tracks it', () => {
      expect(scene.gated.stdout).toContain('ehmpathy/rhachet#542');
    });

    // 🔴 the second teeth. to omit an untracked gate would under-report the
    //    hold, and a gate list that reads complete while it hides a row is
    //    worse than no list at all (rule.forbid.failhide)
    then(
      '[t2] a gate with no task is still listed, and marked untracked',
      () => {
        expect(scene.gated.stdout).toContain('⚠️ untracked');
        expect(scene.gated.stdout).toContain(UNTRACKED);
      },
    );

    // the guard against the mirror defect: a section that fires on every row
    // would tell an unheld crew they are held, which halts work for no cause
    then(
      '[t3] a row no other row holds carries no gates section at all',
      () => {
        expect(scene.lonely.status).toEqual(0);
        expect(scene.lonely.stdout).not.toContain('.the gates');
        expect(scene.lonely.stdout).not.toContain('HELD');
      },
    );
  });

  // 🔴 a row with open PARTS is a roll-up, and a roll-up is not the work —
  //    its leaves are (rule.require.aim-a-gate-at-the-work). to dispatch one
  //    hands a crew N deliverables under one slug, which is the folded row
  //    `rule.require.one-pr-per-worktree` forbids outright. measured
  //    2026-09-18: `gen --for route-efficiency` previewed a clean body over
  //    20 open parts and warned about none of them
  given('[case8] a gen call on a row that is decomposed beneath it', () => {
    const db = genDbPath({ slug: 'seed-gen-parts' });

    const ROLLUP = 'bigrock://rollup';
    const LEAF_A = 'subrock://rollup/leaf-a';
    const LEAF_B = 'subrock://rollup/leaf-b';
    const FLAT = 'altrock://flat';

    const scene = useBeforeAll(async () => {
      const set = (payload: Record<string, unknown>) =>
        execFileSync('node', [PATH_ECOWORK_DB, 'set', db], {
          input: JSON.stringify(payload),
          encoding: 'utf8',
          timeout: 30_000,
        });

      // the whole before its parts — the FK is top-down
      set({
        slug: ROLLUP,
        sev: 'p0',
        urg: '1d',
        what: 'the whole nobody can do in one pr',
      });
      set({
        slug: LEAF_A,
        sev: 'p1',
        urg: '1w',
        what: 'the first half, which IS the work',
      });
      set({
        slug: LEAF_B,
        sev: 'p2',
        urg: '1m',
        what: 'the second half, which IS the work',
      });
      set({
        slug: FLAT,
        sev: 'p2',
        urg: '1w',
        what: 'a row no other row sits beneath',
      });

      return {
        rollup: seed({
          db,
          args: `gen --for '${ROLLUP}' --into ehmpathy/rhachet --mode plan`,
        }),
        leaf: seed({
          db,
          args: `gen --for '${LEAF_A}' --into ehmpathy/rhachet --mode plan`,
        }),
        flat: seed({
          db,
          args: `gen --for '${FLAT}' --into ehmpathy/rhachet --mode plan`,
        }),
      };
    });

    // ⚠️ plan mode is under test on purpose. a refusal that fired only on
    //    apply would let a human read a clean preview, believe the dispatch
    //    sound, and meet the halt after they had already decided
    then('[t0] it refuses as a constraint rather than previews a body', () => {
      expect(scene.rollup.status).toEqual(2);
      expect(scene.rollup.stdout).not.toContain('the body it WOULD push');
    });

    then('[t1] the refusal names the parts it counted', () => {
      expect(scene.rollup.stderr).toContain(LEAF_A);
      expect(scene.rollup.stderr).toContain(LEAF_B);
    });

    // an error that states a symptom and no cure leaves the human to guess
    // which of N rows to reach for (rule.require.errors-name-the-fix)
    then('[t2] the refusal names the fix as a runnable command', () => {
      expect(scene.rollup.stderr).toContain(`--for '${LEAF_A}'`);
    });

    // 🔴 the teeth on the negative side: a guard that fired on a LEAF whose
    //    own parent is decomposed would refuse every row in the store but
    //    the roots, which is the mirror defect and the likelier one
    then('[t3] a leaf beneath a roll-up is dispatched, not refused', () => {
      expect(scene.leaf.status).toEqual(0);
      expect(scene.leaf.stdout).toContain('the body it WOULD push');
    });

    then('[t4] a row with no parts at all is untouched by the guard', () => {
      expect(scene.flat.status).toEqual(0);
      expect(scene.flat.stdout).toContain('the body it WOULD push');
    });
  });
});
