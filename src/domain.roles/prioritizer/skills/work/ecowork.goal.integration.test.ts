/**
 * .what = clamps on the goal uri — rock kinds, roots, promotion, paths, the slug leaf
 *
 * .note = a PART of the `ecowork.db` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in ecowork.harness.ts.
 */
import { execFileSync, spawnSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { given, then, useBeforeAll } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import {
  eco,
  genDbPath,
  PATH_ECOWORK_DB,
  PATH_ECOWORK_SH,
} from './ecowork.harness';

afterAll(() => tempDirs.delAll());

describe('ecowork.db', () => {
  given(
    '[case10] two priorities that serve one bigrock, beside an unrelated root',
    () => {
      const db = genDbPath({ slug: 'eco-goal' });

      const shell = (args: string) =>
        spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
          encoding: 'utf8',
          env: { ...process.env, ECOWORK_DB: db },
          timeout: 30_000,
        });

      // 🔴 .this case once read "and one that serves NONE", and that row can no
      //    longer be written — rewritten 2026-09-16.
      //
      //    the slug IS the goal uri (assertSlugIsGoal), and a create with no
      //    --goal now derives one from the slug. measured: even the `none`
      //    sentinel is overridden on create. so a goalless row is unexpressible,
      //    and the `serves no stated objective` render below it is dead for
      //    every new row — a clamp on an unreachable state proves naught
      //    (rule.forbid.failhide).
      //
      //    ⇒ the subject that survives is the one this case was really for: a
      //      goal NARROWS a set and never reorders it. so the third row becomes
      //      an unrelated ROOT rather than a goalless one, which grades the same
      //      claim against a state the store can actually hold.
      //      the door-close is booked:
      //      .dream/v2026_09_16.fix.the-slug-is-the-goal-only-at-birth.md
      const ROOT = 'bigrock://sandpine.decost';
      const ACU = 'subrock://sandpine.decost/acu-tune';
      const PG = 'subrock://sandpine.decost/pg-upgrade';
      const OTHER = 'bigrock://unrelated';

      const scene = useBeforeAll(async () => {
        // the root first — a part of a whole nobody declared is refused
        shell(
          `eco.priority set --slug '${ROOT}' --sev p3 --urg 1m --what 'cut infra cost'`,
        );
        shell(
          `eco.priority set --slug '${ACU}' --sev p1 --urg 1w ` +
            `--what 'tune the svc-lessons ACU floor'`,
        );
        shell(
          `eco.priority set --slug '${PG}' --sev p2 --urg 1m ` +
            `--what 'upgrade svc-lessons postgres off extended support'`,
        );
        shell(
          `eco.priority set --slug '${OTHER}' --sev p1 --urg 1d --what 'serves no bigrock'`,
        );
        return {
          all: shell('eco.priority get --output json'),
          // ✅ the ROLLUP is read through the SHELL, as a human reads it.
          //    this reached past the surface into the db until 2026-09-21,
          //    because `--goal` was refused and `--slug` matched EXACTLY — so
          //    no shell flag rolled up at all, and the gap was booked as
          //    finding 5 of the dream above. the retirement closed it: the
          //    slug IS the uri, so `--slug` is the rollup key
          scoped: JSON.parse(
            shell(`eco.priority get --slug '${ROOT}' --output json`).stdout,
          ),
          render: shell('eco.priority get'),
        };
      });

      then('[t0] every set landed, and the store holds four', () => {
        expect({ exit: scene.all.status, stderr: scene.all.stderr }).toEqual({
          exit: 0,
          stderr: '',
        });
        expect(JSON.parse(scene.all.stdout).count).toEqual(4);
      });

      // ⚠️ the filter ROLLS UP, so the root comes back with its parts — an exact
      //    match would return the root alone and omit every row that does the
      //    work, while it reported a count that read complete
      then(
        '[t1] a goal filter narrows to the rows that serve it, root included',
        () => {
          expect(scene.scoped.count).toEqual(3);
          expect(
            scene.scoped.priorities.map((p: { slug: string }) => p.slug),
          ).toEqual([ACU, PG, ROOT]);
        },
      );

      // 🔴 the goal must NOT reorder — the rank is opine-first, always
      //    (define.invariant.eco.quant-informs-opine). a goal filter narrows
      //    the set; it never promotes a row within it
      then('[t2] the goal narrows the set and does NOT reorder it', () => {
        const all = JSON.parse(scene.all.stdout);
        expect(all.priorities.map((p: { slug: string }) => p.slug)).toEqual([
          OTHER, // p1 · 1d — the soonest of the two p1s
          ACU, // p1 · 1w
          PG, // p2 · 1m
          ROOT, // p3 · 1m
        ]);
      });

      // ⚠️ it read `.goal` off the row until 2026-09-21. that column is retired
      //    and the slug carries the uri, so the claim is unchanged and the field
      //    it is read from is not
      then('[t3] a partial set PRESERVES the goal uri', () => {
        shell(`eco.priority set --slug '${ACU}' --output json`);
        const got = JSON.parse(
          shell(`eco.priority get --slug '${ACU}' --output json`).stdout,
        );
        expect(got.priorities[0].slug).toEqual(ACU);
      });

      // 🔴 the render names each row by its URI, and prints no second `goal:`
      //    line — that line WAS the second name, and it is gone with it
      then('[t4] the human surface names every row by its goal uri', () => {
        expect(scene.render.stdout).toContain(ROOT);
        expect(scene.render.stdout).toContain(ACU);
        expect(scene.render.stdout).toContain(PG);
      });

      // 🔴 it read `not.toContain('goal: null')` until 2026-09-21 — a guard
      //    against a BLANK where a goal belonged. the column is retired, so
      //    that state is now unreachable and a clamp on it proves naught
      //    (rule.forbid.failhide).
      //
      //    ⇒ the subject that survives is sharper: the `goal:` LINE itself must
      //      never come back. it printed the slug's own value a second time
      //      under a second heading, and a reader cannot tell one fact stated
      //      twice from two facts that happen to agree
      then('[t5] the render prints NO `goal:` line at all', () => {
        expect(scene.render.stdout).not.toContain('goal:');
      });

      // .why the kind rides derived beside the whole uri
      //   a caller that splits on '://' at every site is a caller that
      //   decodes N times over (rule.forbid.inline-decode-friction)
      then(
        '[t6] the kind and the root ride DERIVED, so no caller parses',
        () => {
          const root = scene.scoped.priorities.find(
            (p: { slug: string }) => p.slug === ROOT,
          );
          expect(root.goalKind).toEqual('bigrock');
          expect(root.goalRoot).toEqual('sandpine.decost');
          expect(root.goalPath).toEqual(null);
        },
      );

      // and a PART carries its path, so the tail is readable without a split
      then('[t7] a subrock reports its root and its path apart', () => {
        const part = scene.scoped.priorities.find(
          (p: { slug: string }) => p.slug === ACU,
        );
        expect(part.goalKind).toEqual('subrock');
        expect(part.goalRoot).toEqual('sandpine.decost');
        expect(part.goalPath).toEqual('acu-tune');
      });
    },
  );

  given('[case11] a sidequest beside a mainquest', () => {
    const db = genDbPath({ slug: 'eco-altrock' });

    const shell = (args: string) =>
      spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
        encoding: 'utf8',
        env: { ...process.env, ECOWORK_DB: db },
        timeout: 30_000,
      });

    // the slug IS the goal uri, so each row is named by the quest it serves
    const MAIN = 'bigrock://sandpine.decost';
    const SIDE = 'altrock://dev-ergonomics';

    const scene = useBeforeAll(async () => {
      shell(
        `eco.priority set --slug '${MAIN}' --sev p2 --urg 1m ` +
          `--what 'tune the svc-lessons ACU floor'`,
      );
      shell(
        `eco.priority set --slug '${SIDE}' --sev p1 --urg 1w ` +
          `--what 'grepsafe --glob matches basename, so a path-glob returns a false 0'`,
      );
      return {
        all: shell('eco.priority get --output json'),
        render: shell('eco.priority get'),
      };
    });

    // 🔴 the kind is a LENS, never a sort key. a p1 altrock outranks a p2
    //    bigrock, because sev already asks "how bad if unfixed" — to let a
    //    categorical label reorder would smuggle a sort past the
    //    opine-first invariant (define.invariant.eco.quant-informs-opine)
    then('[t0] a p1 SIDEQUEST outranks a p2 MAINQUEST', () => {
      const all = JSON.parse(scene.all.stdout);
      expect(all.priorities.map((p: { slug: string }) => p.slug)).toEqual([
        SIDE, // p1, and an altrock
        MAIN, // p2, and a bigrock
      ]);
    });

    then('[t1] each kind renders in words, so neither is decoded', () => {
      expect(scene.render.stdout).toContain('🪨 mainquest');
      expect(scene.render.stdout).toContain('🪶 sidequest');
    });

    // ✅ read through `--slug`, which IS the rollup key since 2026-09-21.
    //    it read the db directly while `--goal` was refused and `--slug`
    //    matched exactly — the lens then had no human surface at all
    then('[t2] one lens returns one kind, and never the other', () => {
      const got = eco({ db, verb: 'get', payload: { slug: SIDE } });
      expect(got.count).toEqual(1);
      expect(got.priorities[0].slug).toEqual(SIDE);
    });
  });

  given('[case12] a goal that records no kind', () => {
    const db = genDbPath({ slug: 'eco-goal-bare' });

    // .why the stderr rides beside the exit code, rather than the code alone
    //   a bare `expect(status).toEqual(2)` proves a refusal and proves
    //   naught about WHICH refusal, so the wrong error passes it
    const refuse = (input: { verb: 'set' | 'get'; payload: object }) =>
      spawnSync('node', [PATH_ECOWORK_DB, input.verb, db], {
        input: JSON.stringify(input.payload),
        encoding: 'utf8',
        timeout: 30_000,
      });

    // ⚠️ the shape under test rides on the SLUG, never on a separate --goal.
    //   the slug IS the goal (assertSlugIsGoal), so a fixture that put the
    //   bad shape on a `goal:` field beside a bare slug would be refused for
    //   the slug and never reach the claim it names (rule.forbid.failhide)
    then(
      '[t0] a BARE slug is refused on set, and the error names both kinds',
      () => {
        const got = refuse({
          verb: 'set',
          payload: {
            slug: 'sandpine.decost',
            sev: 'p1',
            urg: '1w',
            what: 'x',
          },
        });
        expect(got.status).toEqual(2);
        expect(got.stderr).toContain('is not a goal uri');
        expect(got.stderr).toContain('bigrock');
        expect(got.stderr).toContain('altrock');
      },
    );

    // 🔴 a typo'd scheme is the WORST case: left open, it files the row under
    //    a kind nobody declared and silently splits the goal in two, so
    //    `get --slug bigrock://x` returns a partial set that reads complete
    then('[t1] a scheme outside the closed set is refused, never filed', () => {
      const got = refuse({
        verb: 'set',
        payload: {
          slug: 'bigrok://sandpine.decost',
          sev: 'p1',
          urg: '1w',
          what: 'y',
        },
      });
      expect(got.status).toEqual(2);
      expect(got.stderr).toContain('is not a goal uri');
    });

    // 🔴 a bare FILTER is the sharper harm: it matches no row, so it exits 0
    //    with an empty set — "no priority serves that objective", when it
    //    means "you typed the wrong shape". a confident naught
    then(
      '[t2] a bare slug is refused as a FILTER, rather than a match on naught',
      () => {
        // ⚠️ the bare shape rides on `slug`, the one filter key there is. it
        //    rode on `goal` until 2026-09-21 — and once that key was cut, an
        //    unknown key is simply IGNORED, so this clamp would have matched
        //    every row and exited 0 while it claimed to prove a refusal
        const got = refuse({
          verb: 'get',
          payload: { slug: 'sandpine.decost' },
        });
        expect(got.status).toEqual(2);
        // ⚠️ the assertion tracks the CURRENT refusal, which names `--slug`
        expect(got.stderr).toContain('is not a filter');
      },
    );

    // a decomposition of naught is not a decomposition
    then('[t3] a subrock with no path is refused', () => {
      const got = refuse({
        verb: 'set',
        payload: {
          slug: 'subrock://sandpine.decost',
          sev: 'p1',
          urg: '1w',
          what: 'a',
        },
      });
      expect(got.status).toEqual(2);
    });

    // 🔴 REVERSED 2026-09-13. this once clamped "a root rock WITH a path is
    //    refused", on the claim that such a root claims to be someone's child.
    //    the wisher struck that claim: a path is a NAMESPACE first, and sandpine
    //    files its mainquests under concerns it never declares as rocks
    //    (`bigrock://sandpine/entool/coachbook`). the old rule made all three
    //    sandpine mainquests unwritable by construction.
    //    ⇒ the invariant it was thought to protect — a subrock names its root's
    //      SLUG, never its KIND — is untouched, and stays clamped in [case13]
    //      and [case30].
    then(
      '[t4] a root rock WITH a path is accepted — the path is a namespace',
      () => {
        const got = eco({
          db,
          verb: 'set',
          payload: {
            slug: 'bigrock://x/y',
            sev: 'p1',
            urg: '1w',
            what: 'a pathed root',
          },
        });
        expect(got.wrote).toEqual('created');
      },
    );

    // 🔴 WIDENED 2026-09-17. a segment may hold `=`, so a uri can decompose
    //    by DIMENSION rather than by place — `role=prioritizer`, the shape
    //    s3 and hive partition on, and the shape this repo's own agent tree
    //    is addressed by. before the widen, `subrock://a/b/role=prioritizer`
    //    was refused and the only legal form dropped the key entirely
    then(
      '[t5] a segment may carry `=`, so a uri decomposes by dimension',
      () => {
        // the FK is top-down, so the whole is declared before its part —
        // otherwise this case fails on a parentage gap and reads as a shape
        // refusal, which is the claim it is here to make (rule.forbid.failhide)
        eco({
          db,
          verb: 'set',
          payload: {
            slug: 'bigrock://x/y/bhuild',
            sev: 'p1',
            urg: '1w',
            what: 'the whole',
          },
        });
        const got = eco({
          db,
          verb: 'set',
          payload: {
            slug: 'subrock://x/y/bhuild/role=prioritizer',
            sev: 'p1',
            urg: '1w',
            what: 'a dimension-keyed segment',
          },
        });
        expect(got.wrote).toEqual('created');
      },
    );

    // ⚠️ the BOUND, clamped beside the widen: `=` is legal inside a segment
    //    and never at its head. a segment that opens with `=` names an absent
    //    key, so `/=prioritizer` is a typo rather than a dimension
    then('[t6] a segment that OPENS with `=` is still refused', () => {
      const got = refuse({
        verb: 'set',
        payload: {
          slug: 'subrock://x/entool/=prioritizer',
          sev: 'p1',
          urg: '1w',
          what: 'an absent key',
        },
      });
      expect(got.status).toEqual(2);
      expect(got.stderr).toContain('is not a goal uri');
    });
  });

  // 🔴 THE invariant of the whole goal shape:
  //    a subrock names the root's SLUG and never the root's KIND, so a
  //    root may flip alt<->big at any moment and not one child is edited
  given('[case13] a root rock that gets promoted mid-life', () => {
    const db = genDbPath({ slug: 'eco-promote' });

    const shell = (args: string) =>
      spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
        encoding: 'utf8',
        env: { ...process.env, ECOWORK_DB: db },
        timeout: 30_000,
      });

    // the slug IS the goal uri, so each row is born under the uri it declares.
    // `goal.mv` moves the root's uri — and with it the root's slug — to PROMOTED
    const ROOT = 'altrock://sandpine.decost';
    const PROMOTED = 'bigrock://sandpine.decost';
    const TUNE = 'subrock://sandpine.decost/acu-tune';
    const QUERY = 'subrock://sandpine.decost/acu-tune/query-audit';

    const scene = useBeforeAll(async () => {
      // it starts life as a SIDEQUEST, with two decompositions beneath it
      shell(
        `eco.priority set --slug '${ROOT}' --sev p2 --urg 1m --what 'cut the sandpine run cost'`,
      );
      shell(
        `eco.priority set --slug '${TUNE}' --sev p2 --urg 1m ` +
          `--what 'tune the svc-lessons ACU floor'`,
      );
      shell(
        `eco.priority set --slug '${QUERY}' --sev p3 --urg 1m ` +
          `--what 'audit the query that over-ramps'`,
      );
      // ⚠️ the rollup is read at the DB — the shell refuses `--goal` and
      //    `--slug` matches exactly, so it offers no rollup at all
      const before = eco({ db, verb: 'get', payload: { slug: ROOT } });

      // 🔴 THE PROMOTION — one row, one field. no child is touched
      //
      // ⚠️ it goes through `goal.mv`, never `set --goal`, and the strict FK is
      //   why: `decost-root` is the last declarant of `altrock://sandpine.decost`,
      //   so a `set` that retyped its goal would strand two rows that name it
      //   as their parent — and the store refuses it, by design
      //   (define.invariant.eco.a-surgoal-must-be-declared-first).
      //
      //   ⇒ so a KIND FLIP is a rename of the root's uri, which is a goal-shaped
      //     fact rather than a row-shaped one. that it still touches exactly ONE
      //     row is the payoff of the slug-not-kind rule, and [t2] clamps it
      shell(
        `eco.priority goal.mv --from '${ROOT}' --to 'bigrock://sandpine.decost'`,
      );

      return {
        before,
        after: eco({
          db,
          verb: 'get',
          payload: { slug: 'bigrock://sandpine.decost' },
        }),
        rows: shell('eco.priority get --output json'),
        render: shell('eco.priority get'),
      };
    });

    then(
      '[t0] a filter ROLLS UP — the root, plus every subrock beneath it',
      () => {
        expect(scene.before.count).toEqual(3);
      },
    );

    // 🔴 the whole point. the rollup keys on the ROOT SLUG, so it survives
    //    a kind flip that would break any scheme-keyed match
    then('[t1] after the promotion the rollup still returns all three', () => {
      expect(scene.after.count).toEqual(3);
      expect(
        scene.after.priorities.map((p: { slug: string }) => p.slug).sort(),
      ).toEqual([PROMOTED, TUNE, QUERY].sort());
    });

    then(
      '[t2] NOT ONE child uri changed — the promotion was a one-row edit',
      () => {
        // the slug IS the goal uri, so the uri set is the slug set
        const slugs = (
          JSON.parse(scene.rows.stdout).priorities as { slug: string }[]
        ).map((r) => r.slug);
        expect(slugs).toContain(TUNE);
        expect(slugs).toContain(QUERY);
        // the root alone moved — `goal.mv` carries the slug with the uri
        expect(slugs).toContain(PROMOTED);
        expect(slugs).not.toContain(ROOT);
      },
    );

    then(
      '[t3] every row traces to ONE root, whatever kind that root wears',
      () => {
        const rows = JSON.parse(scene.rows.stdout).priorities as {
          goalRoot: string;
        }[];
        expect(rows.map((r) => r.goalRoot)).toEqual([
          'sandpine.decost',
          'sandpine.decost',
          'sandpine.decost',
        ]);
      },
    );

    then(
      '[t4] a MID-tree filter rolls up its own descendants, and no more',
      () => {
        const got = eco({ db, verb: 'get', payload: { slug: TUNE } });
        expect(got.count).toEqual(2); // acu-tune itself + query-audit beneath it
      },
    );

    // a subrock never names its root's kind, so a reader of the row alone
    // cannot tell main from side. the render supplies the trace from the WHOLE
    // end — the root lists its parts by uri, and each part's own name carries
    // the root it descends from
    then('[t5] the render traces the tree, root to part and back', () => {
      expect(scene.render.stdout).toContain(`parts: ${TUNE}, ${QUERY}`);
      expect(scene.render.stdout).toContain(TUNE);
      expect(scene.render.stdout).toContain(QUERY);
    });

    // 🔴 the render names each row by its SLUG, and `goal.mv` carries the slug —
    //    so a human who promotes a root sees the new kind in the header at once
    then('[t6] a promoted root RENDERS under its promoted uri', () => {
      expect(scene.render.stdout).toContain(PROMOTED);
      expect(scene.render.stdout).not.toContain(ROOT);
    });
  });

  // 🔴 CREATE TABLE IF NOT EXISTS adds no column to an extant table, so a
  //    schema that gains a field works on a fresh db and dies on every db
  //    that already exists. no other clamp can see this: they all
  //    provision a FRESH db, which is blind to migration by construction
  given(
    '[case14] a db built by the PRIOR schema, before `goal` existed',
    () => {
      const db = genDbPath({ slug: 'eco-migrate' });

      const scene = useBeforeAll(async () => {
        // build the v1 table by hand — no `goal` column, exactly as shipped
        execFileSync(
          'node',
          [
            '-e',
            `const { DatabaseSync } = require('node:sqlite');
           const db = new DatabaseSync(process.argv[1]);
           db.exec(\`CREATE TABLE priority (
             slug TEXT PRIMARY KEY, what TEXT NOT NULL, why TEXT,
             opine_sev TEXT NOT NULL, opine_urg TEXT NOT NULL,
             quant_gain_cash TEXT, quant_gain_per TEXT NOT NULL DEFAULT 'once',
             quant_gain_duration TEXT NOT NULL DEFAULT '1y', quant_gain_time TEXT,
             quant_cost_cash TEXT, quant_cost_per TEXT NOT NULL DEFAULT 'once',
             quant_cost_duration TEXT NOT NULL DEFAULT '1y', quant_cost_time TEXT,
             quant_asks INTEGER NOT NULL DEFAULT 1,
             ref_task TEXT NOT NULL DEFAULT '[]', ref_tree TEXT NOT NULL DEFAULT '[]',
             seen_at TEXT NOT NULL, set_at TEXT NOT NULL);\`);
           db.prepare(\`INSERT INTO priority (slug, what, opine_sev, opine_urg, seen_at, set_at)
             VALUES ('legacy', 'a row from before goal existed', 'p1', '1w', 'x', 'x')\`).run();
           db.close();`,
            db,
          ],
          { encoding: 'utf8', timeout: 30_000 },
        );
        return { got: eco({ db, verb: 'get', payload: {} }) };
      });

      then(
        '[t0] a get against the stale db SUCCEEDS rather than malfunctions',
        () => {
          expect(scene.got.count).toEqual(1);
        },
      );

      // 🔴 it asserted `.goal === null` until 2026-09-21. that column is retired,
      //    so the claim is now about the SLUG — and the interesting half is that
      //    this row keeps its BARE one.
      //
      //    a v1 db holds no `goal` column at all, so `setGoalColumnRetired`
      //    returns early and migrates naught. that is deliberate: a priority IS
      //    a goal, this row names none, and a uri cannot be invented for it
      //    (rule.forbid.fabricated-opines, one rung up — a store may not author
      //    the kind a human never declared)
      then(
        '[t1] the legacy row keeps its BARE slug, and loses no other field',
        () => {
          expect(scene.got.priorities[0].slug).toEqual('legacy');
          expect(scene.got.priorities[0].what).toEqual(
            'a row from before goal existed',
          );
          expect(scene.got.priorities[0].opine).toEqual({
            sev: 'p1',
            urg: '1w',
          });
        },
      );

      // 🔴 it wrote a `goal:` and read it back until 2026-09-21 — the claim was
      //    "the migrated column is a real column", and there is no column now.
      //
      //    ⇒ the subject that survives is the one that still bites: a legacy row
      //      whose slug is BARE must still accept a PARTIAL write. the uri-shape
      //      guard refuses a bare slug on CREATE, and if it fired on update too,
      //      every one of these rows would be frozen — readable, and unwritable,
      //      with no migration path left open
      then(
        '[t2] the migrated store ACCEPTS a partial write on a BARE legacy slug',
        () => {
          const wrote = eco({
            db,
            verb: 'set',
            payload: { slug: 'legacy', asks: 2 },
          });
          expect(wrote.priority.quant.asks).toEqual(2);
          const got = eco({ db, verb: 'get', payload: { slug: 'legacy' } });
          expect(got.count).toEqual(1);
          expect(got.priorities[0].what).toEqual(
            'a row from before goal existed',
          );
        },
      );

      // 🔴 a gate on a bare legacy row has no uuid to hold, so it is refused —
      //    and the refusal must name a repair that RUNS: a rename in place.
      //    a fresh `set` under a uri would mint a second row beside the first
      then(
        '[t3] a gate on the bare legacy row is refused, and names goal.mv',
        () => {
          const gated = spawnSync('node', [PATH_ECOWORK_DB, 'set', db], {
            input: JSON.stringify({
              slug: 'bigrock://gated',
              what: 'a row that waits on the legacy one',
              sev: 'p2',
              urg: '1m',
              gatedBy: ['legacy'],
            }),
            encoding: 'utf8',
            timeout: 30_000,
          });
          expect(gated.status).toEqual(2);
          expect(gated.stderr).toContain(
            "goal.mv --from 'legacy' --to 'bigrock://legacy'",
          );
        },
      );

      then(
        '[t4] and that repair renames the legacy row in place, fields intact',
        () => {
          const moved = eco({
            db,
            verb: 'goal.mv',
            payload: { from: 'legacy', to: 'bigrock://legacy' },
          });
          expect(moved.count).toEqual(1);
          const got = eco({ db, verb: 'get', payload: {} });
          const slugs = got.priorities.map((p: { slug: string }) => p.slug);
          expect(slugs).toContain('bigrock://legacy');
          expect(slugs).not.toContain('legacy');
          const row = got.priorities.find(
            (p: { slug: string }) => p.slug === 'bigrock://legacy',
          );
          expect(row.what).toEqual('a row from before goal existed');
          expect(row.quant.asks).toEqual(2);
        },
      );
    },
  );

  // 🔴 .why a ROOT ROCK may carry a PATH — the measured defect, 2026-09-13
  //    `bigrock://sandpine/entool/coachbook` was refused outright (exit 2), on
  //    the claim that "a root that claims a path claims to be someone's
  //    child". that conflated a NAMESPACE with a parentage claim: sandpine
  //    files its mainquests under CONCERNS (`entool`, `ensell`), and a
  //    concern is not a rock — no priority declares it and none ever will.
  //    ⇒ so the old rule demanded a parent that cannot exist, and all three
  //      sandpine mainquests were unwritable by construction.
  given(
    '[case30] a root rock filed under a concern, so its uri carries a path',
    () => {
      const db = genDbPath({ slug: 'eco-goal-pathed-root' });

      const setRaw = (payload: object) =>
        spawnSync('node', [PATH_ECOWORK_DB, 'set', db], {
          input: JSON.stringify(payload),
          encoding: 'utf8',
          timeout: 30_000,
        });

      // 🔴 the exact uri the store refused. it now seeds a tree from empty,
      //    because a ROOT KIND owes no parent whatever its path depth
      then('[t0] a pathed bigrock is accepted, and owes no surgoal', () => {
        const root = eco({
          db,
          verb: 'set',
          payload: {
            slug: 'bigrock://sandpine/entool/coachbook',
            what: 'the coachbook mainquest',
            sev: 'p2',
            urg: '1m',
          },
        });
        expect(root.wrote).toEqual('created');
      });

      // 🔴 the second half of the same fix. a child of a pathed root must find
      //    its parent — and that parent is a BIGROCK three segments deep, never
      //    the `subrock://sandpine/entool/coachbook` the old derivation sought
      then('[t1] a child of a pathed root satisfies its reference', () => {
        expect(
          setRaw({
            slug: 'subrock://sandpine/entool/coachbook/cert-ingest',
            what: 'ingest licenses',
            sev: 'p2',
            urg: '1m',
          }).status,
        ).toEqual(0);
      });

      // ⚠️ the FK is NOT loosened — only the root-kind case is. an undeclared
      //    concern still cannot host a subrock
      then(
        '[t2] a subrock under an undeclared concern is still refused',
        () => {
          const orphan = setRaw({
            slug: 'subrock://sandpine/never-declared/x',
            what: 'a part of naught',
            sev: 'p2',
            urg: '1m',
          });
          expect(orphan.status).toEqual(2);
          expect(orphan.stderr).toContain('no priority declares that goal yet');
        },
      );

      // ⚠️ the one shape the split still refuses, unchanged: a decomposition
      //    of naught is not a decomposition
      then('[t3] a pathless subrock is still refused', () => {
        expect(
          setRaw({
            slug: 'subrock://sandpine',
            what: 'x',
            sev: 'p2',
            urg: '1m',
          }).status,
        ).toEqual(2);
      });

      // 🔴 the rollup is what the whole uri shape exists to serve. a pathed
      //    root that did not roll up would report a count that reads complete
      //    while it omits every row that does the work (term=partial-audit)
      then('[t4] the rollup gathers a pathed root and its children', () => {
        const found = eco({
          db,
          verb: 'get',
          payload: { slug: 'bigrock://sandpine/entool/coachbook' },
        });
        expect(
          found.priorities.map((p: { slug: string }) => p.slug).sort(),
        ).toEqual([
          'bigrock://sandpine/entool/coachbook',
          'subrock://sandpine/entool/coachbook/cert-ingest',
        ]);
      });
    },
  );

  // 🔴 .why this case exists — TWO invariants that were mutually unsatisfiable
  //
  //   `assertSlugIsGoal` merged a row's two names into one: the slug BECAME
  //   the goal uri. `assertTreeGrain` was authored before that merge and held
  //   the WHOLE slug up against the bare tree name, so after the merge the
  //   pair demanded, of one string, that it be:
  //
  //     a uri            (assertSlugIsGoal)
  //     a bare tree name (assertTreeGrain)
  //     never bare       (the uri shape check)
  //
  //   ⇒ no string satisfies all three, so EVERY write that carried a tree was
  //     refused. measured 2026-09-15: 8 clamps in this suite were red, and the
  //     live store could not take a sponsored tree row at all.
  //
  //   ⚠️ it survived because the refusal READS like a scold about names — it
  //     cites a rule and a `should be`, so a caller re-types the slug and is
  //     refused again, with no hint that the two demands cannot both be met.
  given('[case58] a row that carries a tree, graded on the slug LEAF', () => {
    const db = genDbPath({ slug: 'eco-tree-grain-leaf' });
    const TREE = 'rhachet-roles-bhrain.beav.feat-acceptance-under-5min';

    const shell = (args: string) =>
      spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
        encoding: 'utf8',
        env: { ...process.env, ECOWORK_DB: db },
        timeout: 30_000,
      });

    then('[t0] a nested slug whose LEAF is the tree is accepted', () => {
      // the FK wants every rung declared top-down before its part
      for (const rung of ['bigrock://rhachet', 'subrock://rhachet/entool'])
        expect(
          shell(
            `eco.priority set --slug '${rung}' --sev p1 --urg 1m --what 'a rung'`,
          ).status,
        ).toEqual(0);
      const set = shell(
        `eco.priority set --slug 'subrock://rhachet/entool/${TREE}' ` +
          `--sev p1 --urg 1d --what 'the leaf borrows the branch' --ref-tree '${TREE}'`,
      );
      expect(set.status).toEqual(0);
      expect(shell(`eco.priority get --output json`).stdout).toContain(TREE);
    });

    then(
      '[t1] a ROOT slug is graded on its root segment, since it has no path',
      () => {
        expect(
          shell(
            `eco.priority set --slug 'bigrock://${TREE}' --sev p1 --urg 1d ` +
              `--what 'a root that is a tree' --ref-tree '${TREE}'`,
          ).status,
        ).toEqual(0);
      },
    );

    // 🔴 the rule still BITES — a cure that accepted every slug would pass
    //    [t0] and [t1] and forfeit the whole point of the check
    then('[t2] and a COINED leaf is still refused, with a runnable fix', () => {
      const set = shell(
        `eco.priority set --slug 'subrock://rhachet/entool/coined-at-the-keyboard' ` +
          `--sev p1 --urg 1d --what 'a synonym' --ref-tree '${TREE}'`,
      );
      expect(set.status).toEqual(2);
      expect(set.stderr).toContain(`leaf 'coined-at-the-keyboard'`);
      expect(set.stderr).toContain(`--slug 'subrock://rhachet/entool/${TREE}'`);
    });
  });

  // 🔴 44 rows in the live store predate the rekey and carry TWO names: a bare
  //   coined slug beside a goal uri. the create path can no longer mint that
  //   shape, so every clamp above was written against rows where slug === goal
  //   — and where the two are one string, a check that reads the wrong one of
  //   them looks correct.
  //
  //   measured 2026-09-18, on `set --slug dispute-or-concede --status done`:
  //     1. `Cannot read properties of undefined (reading 'split')`, exit 1 —
  //        `assertTreeGrain` was the ONE call site of `asGoalParts` that handed
  //        it a slug, and a bare slug has no `://`, so the parser tore
  //     2. once cured, exit 2 — the tree grain refused a write that supplied
  //        neither a slug the caller coined nor a tree. the scold was TRUE
  //        about the row and false about the WRITE, and it froze every status,
  //        ask, gate, and ref-task edit on all 44 behind a rename nobody asked
  //        for
  //
  //   ⇒ a stale disagreement is surfaced when a human touches the fields that
  //     hold it, never when they touch a neighbour.
  given(
    '[case59] a legacy TWO-NAME row, updated on a field it does not carry',
    () => {
      const db = genDbPath({ slug: 'eco-legacy-two-name' });
      const TREE = 'rhachet-roles-bhrain.beav.feat-peer-review-parallelism';
      const GOAL = 'subrock://rhachet/peer-review-parallelism';

      const shell = (args: string) =>
        spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
          encoding: 'utf8',
          env: { ...process.env, ECOWORK_DB: db },
          timeout: 30_000,
        });

      // 🔴 the row is PLANTED IN THE PLAINTEXT, and there is no other door.
      //   `assertSlugIsGoal` shuts the create path on this shape, on purpose —
      //   so a two-name row cannot be minted through the json contract at all,
      //   and a clamp that reached for it would assert a state the store forbids.
      //
      //   ⇒ the csv is the store and the db is a cache
      //     (define.invariant.eco.the-csv-is-truth-the-db-is-a-cache), so text
      //     with no db beside it is a SANCTIONED door, never a backdoor — it
      //     is the same door a `git pull` of a peer's rows comes through, and
      //     it is how all 44 legacy rows reach the live db today
      const plant = () => {
        const cols =
          'slug,goal,kind,what,why,opine_sev,opine_urg,quant_gain_cash,quant_gain_per,' +
          'quant_gain_duration,quant_gain_time,quant_cost_cash,quant_cost_per,' +
          'quant_cost_duration,quant_cost_time,quant_asks,status,ref_task,ref_tree,' +
          'ref_pull,seen_tree_at,seen_at,set_at';
        const stamp = '2026-09-18T00:00:00.000Z';
        const tail = `,,once,1y,,,once,1y,,1,enqueued,[]`;
        mkdirSync(dirname(db), { recursive: true });
        writeFileSync(
          join(dirname(db), 'priority.csv'),
          [
            cols,
            `bigrock://rhachet,bigrock://rhachet,,a rung,,p1,1m${tail},[],[],,${stamp},${stamp}`,
            `peer-review-parallelism,${GOAL},,a row born before the rekey,,p0,1d${tail},` +
              `"[""${TREE}""]",[],,${stamp},${stamp}`,
          ].join('\n') + '\n',
          'utf8',
        );
      };

      // 🔴 the rebuild retires the `goal` column: each two-name row moves onto
      //    the uri it declared, so the coined name does not survive the first
      //    open. every write below addresses the row by its GOAL, which is the
      //    only name it has once the store is read
      const scene = useBeforeAll(async () => {
        plant();

        return {
          done: shell(`eco.priority set --slug '${GOAL}' --status done`),
          row: eco({ db, verb: 'get', payload: {} }),
          stale: shell(
            `eco.priority set --slug peer-review-parallelism --status done`,
          ),
          tree: shell(
            `eco.priority set --slug '${GOAL}' --ref-tree 'some-other.beav.feat-x'`,
          ),
        };
      });

      then(
        '[t0] the partial lands on the migrated row rather than tears',
        () => {
          expect(scene.done.stderr).not.toContain(
            'Cannot read properties of undefined',
          );
          expect(scene.done.status).toEqual(0);
        },
      );

      then(
        '[t1] and it is not refused over a name the write never supplied',
        () => {
          expect(scene.done.stderr).not.toContain('does not carry its name');
        },
      );

      then('[t2] the field the human asked for actually moved', () => {
        const row = scene.row.priorities.find(
          (each: { slug: string }) => each.slug === GOAL,
        );
        expect(row.status).toEqual('done');
        // one row, under one name — the coined name is gone, not kept beside
        expect(
          scene.row.priorities.map((each: { slug: string }) => each.slug),
        ).not.toContain('peer-review-parallelism');
      });

      // 🔴 a human who still types the coined name is told what is wrong with
      //    the NAME — never that a row they can see "needs --sev"
      then(
        '[t2b] the retired coined name is refused as a name, not as a new row',
        () => {
          expect(scene.stale.status).toEqual(2);
          expect(scene.stale.stderr).toContain('is not a goal uri');
          expect(scene.stale.stderr).not.toContain('a new priority needs');
        },
      );

      // 🔴 the teeth on the negative side, and they are the ones that matter: a
      //    cure that simply deleted the check would pass [t0] and [t1] and give
      //    up the whole point of it
      then(
        '[t3] and a write that DOES supply a tree is graded exactly as before',
        () => {
          expect(scene.tree.status).toEqual(2);
          expect(scene.tree.stderr).toContain('does not carry its name');
        },
      );

      // 🔴 and the refusal is read off the GOAL, which is the only half of a
      //    two-name row that can be taken apart at all. read off the bare slug
      //    it still refuses — with `leaf ''` and a fix that reads `null://…`,
      //    an error that names a cure no shell can run
      //    (rule.require.errors-name-the-fix)
      then(
        '[t4] the refusal names the real leaf, and a fix a human can paste',
        () => {
          expect(scene.tree.stderr).toContain(`leaf 'peer-review-parallelism'`);
          expect(scene.tree.stderr).toContain(
            `--slug 'subrock://rhachet/some-other.beav.feat-x'`,
          );
          expect(scene.tree.stderr).not.toContain('null://');
        },
      );
    },
  );

  // 🔴 .why a PEAK ON A PEAK must survive its own rollup — measured 2026-09-18
  //
  //    a root kind may sit at ANY depth. `bigrock://sandpine/ensell/1klpm` is a
  //    pillar prominent enough to be named as one, nested under a concern that
  //    is itself a part (define.eco.priority-glyphs).
  //
  //    ⚠️ the SQL descendant clause hardcoded `subrock://` as the child scheme,
  //    while `isGoalBeneath` strips the scheme and compares root + path. one
  //    concept, two implementations — and only the JS half learned that a
  //    descendant may wear a root kind.
  //
  //    ⇒ the measured render: `get --slug subrock://sandpine/ensell` drew `1klpm/`
  //      as a BARE FOLDER — no glyph, no opine, no gain — while all six of its
  //      descendants rendered perfectly. the promoted row fell out of the one
  //      query a reader runs to inspect the pillar they just promoted.
  //
  //    🔴 and it is silent by construction. the count reads complete, the
  //      children are all present, and the only tell is a folder with no row
  //      behind it (term=partial-audit).
  given(
    '[case61] a root rock promoted mid-path, so a descendant wears a root kind',
    () => {
      const db = genDbPath({ slug: 'eco-goal-peak-on-peak' });

      const scene = useBeforeAll(async () => {
        // the root, the concern beneath it, the PEAK beneath that, and a part
        // of the peak — the exact shape the live store carries
        eco({
          db,
          verb: 'set',
          payload: {
            slug: 'bigrock://sandpine',
            what: 'the whole',
            sev: 'p0',
            urg: '1m',
          },
        });
        eco({
          db,
          verb: 'set',
          payload: {
            slug: 'subrock://sandpine/ensell',
            what: 'the concern',
            sev: 'p0',
            urg: '1m',
          },
        });
        eco({
          db,
          verb: 'set',
          payload: {
            slug: 'bigrock://sandpine/ensell/1klpm',
            what: 'the peak',
            sev: 'p0',
            urg: '1m',
          },
        });
        eco({
          db,
          verb: 'set',
          payload: {
            slug: 'subrock://sandpine/ensell/1klpm/walkins',
            what: 'a part of the peak',
            sev: 'p0',
            urg: '1m',
          },
        });
        return {};
      });

      // 🔴 THE teeth. under the hardcoded `subrock://` clause the peak is absent
      //    and its child is present — so a test that asserted only the child
      //    would pass on the broken build and clamp naught
      then(
        '[t0] the concern rollup reaches the peak AND the peak\u2019s part',
        () => {
          expect(scene).toBeDefined();
          const found = eco({
            db,
            verb: 'get',
            payload: { slug: 'subrock://sandpine/ensell' },
          });
          expect(
            found.priorities.map((p: { slug: string }) => p.slug).sort(),
          ).toEqual([
            'bigrock://sandpine/ensell/1klpm',
            'subrock://sandpine/ensell',
            'subrock://sandpine/ensell/1klpm/walkins',
          ]);
        },
      );

      // ⚠️ the peak read from the ROOT, two rungs up — the same miss, one level
      //    further out, and the level a human actually reads
      then('[t1] the root rollup reaches the peak too', () => {
        const found = eco({
          db,
          verb: 'get',
          payload: { slug: 'bigrock://sandpine' },
        });
        expect(found.priorities.map((p: { slug: string }) => p.slug)).toContain(
          'bigrock://sandpine/ensell/1klpm',
        );
      });

      // 🔴 the peak filtered by its OWN uri. this is the render the human ran,
      //    and the row it dropped was the row they had just promoted
      then(
        '[t2] the peak filtered by its own uri returns itself, not its parts alone',
        () => {
          const found = eco({
            db,
            verb: 'get',
            payload: { slug: 'bigrock://sandpine/ensell/1klpm' },
          });
          expect(
            found.priorities.map((p: { slug: string }) => p.slug).sort(),
          ).toEqual([
            'bigrock://sandpine/ensell/1klpm',
            'subrock://sandpine/ensell/1klpm/walkins',
          ]);
        },
      );

      // ⚠️ the NEGATIVE tooth — a scheme-blind clause must not reach ACROSS roots.
      //    the cure widens the kind and must leave the root slug strict
      then(
        '[t3] and the widened clause does not reach into a second root',
        () => {
          eco({
            db,
            verb: 'set',
            payload: {
              slug: 'bigrock://elsewhere',
              what: 'a peer root',
              sev: 'p2',
              urg: '1m',
            },
          });
          eco({
            db,
            verb: 'set',
            payload: {
              slug: 'bigrock://elsewhere/ensell/1klpm',
              what: 'a same-named peak, other root',
              sev: 'p2',
              urg: '1m',
            },
          });
          const found = eco({
            db,
            verb: 'get',
            payload: { slug: 'subrock://sandpine/ensell' },
          });
          expect(
            found.priorities.map((p: { slug: string }) => p.slug),
          ).not.toContain('bigrock://elsewhere/ensell/1klpm');
        },
      );
    },
  );
});
