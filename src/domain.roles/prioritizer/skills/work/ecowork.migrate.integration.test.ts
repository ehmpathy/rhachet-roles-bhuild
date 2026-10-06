/**
 * .what = clamps on sponsorship and on every db built by a PRIOR schema
 *
 * .note = a PART of the `ecowork.db` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in ecowork.harness.ts.
 */
import { execFileSync, spawnSync } from 'child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { given, then, useBeforeAll } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import {
  asCsvFields,
  eco,
  genDbPath,
  getStoreRows,
  PATH_ECOWORK_DB,
  PATH_ECOWORK_SH,
} from './ecowork.harness';

afterAll(() => tempDirs.delAll());

describe('ecowork.db', () => {
  // ///////////////////////////////////////////////////////////////////
  // SPONSORED — a human authorized budget; it tops the rank (⭐)
  //   prioritized = the org wants it (opine). sponsored = a human paid
  //   for it now (define.prioritized-vs-sponsored). orthogonal, and the
  //   budget OUTRANKS the opine — a funded p2 sorts above an unfunded p0
  //
  // 🔴 REWRITTEN 2026-09-15. `sponsored` was an INTEGER 0/1 column on
  //   `priority` until this date. it is now DERIVED, by the `priority_live`
  //   view, from an EPISODE in `goal_sponsorship` — who authorized the
  //   budget, why, since when, and until when.
  //
  //   ⇒ so several clamps below assert the OPPOSITE of what they did. a
  //     bare `--sponsor` is now REFUSED rather than accepted, because a
  //     budget nobody signed cannot be questioned, renewed, or revoked —
  //     which is the unanswerable state the flag left behind, and the
  //     whole reason the column was retired rather than kept beside the
  //     record (a flag beside a record is two homes for one fact).
  // ///////////////////////////////////////////////////////////////////

  given('[case32] a goal a human authorized budget on', () => {
    const db = genDbPath({ slug: 'eco-sponsored' });

    // ⚠️ a slug IS its goal uri (rule.require.rock-goal-treestruct) — a row
    //   named anything else is refused, so the two ride as one constant
    const UNFUNDED = 'bigrock://sandpine.unfunded';
    const FUNDED = 'bigrock://sandpine.funded';

    const shell = (args: string) =>
      spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
        encoding: 'utf8',
        env: { ...process.env, ECOWORK_DB: db },
        timeout: 30_000,
      });

    // .why the stderr rides beside the exit code — a bare `status === 2`
    //   proves a refusal and proves naught about WHICH refusal
    const refuse = (payload: object) =>
      spawnSync('node', [PATH_ECOWORK_DB, 'set', db], {
        input: JSON.stringify(payload),
        encoding: 'utf8',
        timeout: 30_000,
      });

    const scene = useBeforeAll(async () => {
      // a p0 nobody funded — the org wants it most, on opine alone
      eco({
        db,
        verb: 'set',
        payload: {
          slug: UNFUNDED,
          what: 'a p0 with no budget',
          sev: 'p0',
          urg: '1d',
        },
      });
      // a p2 a human funded — lower opine, but budget authorized, and the
      // authorization carries its author and its reason
      eco({
        db,
        verb: 'set',
        payload: {
          slug: FUNDED,
          what: 'a p2 a human funded',
          sev: 'p2',
          urg: '1m',
          sponsored: true,
          sponsorWho: 'bert',
          sponsorWhy: 'the support fees bleed every month',
        },
      });
      return { got: eco({ db, verb: 'get', payload: {} }) };
    });

    const at = (slug: string) =>
      scene.got.priorities.find((p: { slug: string }) => p.slug === slug);

    then(
      '[t0] sponsored is DERIVED true on the funded goal, false on the other',
      () => {
        expect(at(FUNDED).sponsored).toEqual(true);
        expect(at(UNFUNDED).sponsored).toEqual(false);
      },
    );

    // 🔴 the whole point: authorized budget outranks the opine. a p2 a
    //    human funded sorts ABOVE a p0 nobody did
    then('[t1] the sponsored p2 outranks the unsponsored p0', () => {
      expect(scene.got.priorities.map((p: { slug: string }) => p.slug)).toEqual(
        [FUNDED, UNFUNDED],
      );
    });

    // an omitted --sponsor must PRESERVE the authorization, exactly as every
    // other partial field does — a re-grade of sev must not silently drop a
    // human's budget authorization
    then('[t2] a partial set that names no sponsorship PRESERVES it', () => {
      eco({ db, verb: 'set', payload: { slug: FUNDED, sev: 'p1' } });
      expect(
        eco({ db, verb: 'get', payload: { slug: FUNDED } }).priorities[0]
          .sponsored,
      ).toEqual(true);
    });

    // 🔴 the record SURVIVES the close. `until` is stamped rather than the
    //    row dropped — "who funded this, and when did it stop?" is a
    //    question a deleted row answers with silence, which is the exact
    //    defect the retired flag had
    then('[t3] an unsponsor CLOSES the episode rather than deletes it', () => {
      eco({ db, verb: 'set', payload: { slug: FUNDED, sponsored: false } });
      expect(
        eco({ db, verb: 'get', payload: { slug: FUNDED } }).priorities[0]
          .sponsored,
      ).toEqual(false);

      const held = readFileSync(
        join(dirname(db), 'goal_sponsorship.csv'),
        'utf8',
      );
      expect(held).toContain('bert');
      expect(held).toContain('the support fees bleed every month');
    });

    // the bash surface: --sponsor reopens it, and the render leads the row ⭐
    then(
      '[t4] --sponsor on the bash surface reopens it, and the render shows ⭐',
      () => {
        const run = shell(
          `eco.priority set --slug '${FUNDED}' --sponsor --sponsor-who bert --sponsor-why 'still worth the spend'`,
        );
        expect(run.status).toEqual(0);
        const render = shell('eco.priority get');
        expect(render.status).toEqual(0);
        expect(render.stdout).toContain('⭐');
      },
    );

    // 🔥 = a hotfix still alight — urg 1h, and not yet done.
    //
    // 🔴 the ladder had no rung for "right now": 1d was its sharp end, so a
    //    live prod crash loop and a day's work graded identically. measured
    //    2026-09-20 — a human graded one `1h` and the store refused the word,
    //    at the one end of the ladder where precision is REAL.
    //
    // ⚠️ the glyph is DERIVED from urg + status, never stored. a `hotfix`
    //    column would be a second name for a fact the opine already carries,
    //    and a second name drifts (rule.forbid.domain-term-synonyms).
    then(
      '[t5a] urg 1h is accepted, and an unfinished 1h row renders 🔥',
      () => {
        const db2 = genDbPath({ slug: 'eco-hotfix-alight' });
        const sh2 = (args: string) =>
          spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
            encoding: 'utf8',
            env: { ...process.env, ECOWORK_DB: db2 },
            timeout: 30_000,
          });
        const set = sh2(
          `eco.priority set --slug 'bigrock://alight' --sev p0 --urg 1h --status inflight --what 'prod is down'`,
        );
        expect(set.status).toEqual(0);
        const render = sh2('eco.priority get');
        expect(render.stdout).toContain('🔥');
      },
    );

    // 🔴 "until they're done" is the whole ask — a 🔥 that never goes out is a
    //    decoration, and a reader soon looks past it
    then('[t5b] a DONE 1h row renders no 🔥 — the fire goes out', () => {
      const db2 = genDbPath({ slug: 'eco-hotfix-out' });
      const sh2 = (args: string) =>
        spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
          encoding: 'utf8',
          env: { ...process.env, ECOWORK_DB: db2 },
          timeout: 30_000,
        });
      sh2(
        `eco.priority set --slug 'bigrock://cooled' --sev p0 --urg 1h --status done --what 'prod was down'`,
      );
      const render = sh2('eco.priority get');
      expect(render.stdout).not.toContain('🔥');
    });

    // 🔥 is a detector, not decoration — a slower rung never lights
    then('[t5c] a 1d row renders no 🔥, however severe', () => {
      const db2 = genDbPath({ slug: 'eco-hotfix-false-positive' });
      const sh2 = (args: string) =>
        spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
          encoding: 'utf8',
          env: { ...process.env, ECOWORK_DB: db2 },
          timeout: 30_000,
        });
      sh2(
        `eco.priority set --slug 'bigrock://urgent' --sev p0 --urg 1d --status inflight --what 'p0 but not a hotfix'`,
      );
      const render = sh2('eco.priority get');
      expect(render.stdout).not.toContain('🔥');
    });

    // ⭐ is a detector, not decoration — a store with no sponsored row shows none
    then('[t5] a store with no sponsored row renders no ⭐', () => {
      const db2 = genDbPath({ slug: 'eco-none-sponsored' });
      const sh2 = (args: string) =>
        spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
          encoding: 'utf8',
          env: { ...process.env, ECOWORK_DB: db2 },
          timeout: 30_000,
        });
      sh2(
        `eco.priority set --slug 'bigrock://plain' --sev p1 --urg 1w --what 'no budget'`,
      );
      const render = sh2('eco.priority get');
      expect(render.stdout).not.toContain('⭐');
    });

    // 🔴 THE clamp this rewrite exists for. a bare --sponsor is precisely
    //    what the retired flag accepted, and it is now refused
    then(
      '[t6] a --sponsor with no author and no reason is REFUSED, and names the fix',
      () => {
        const got = refuse({ slug: UNFUNDED, sponsored: true });
        expect(got.status).toEqual(2);
        expect(got.stderr).toContain('owes an author and a reason');
        expect(got.stderr).toContain('--sponsor-who');
        expect(got.stderr).toContain('--sponsor-why');
      },
    );

    // a budget is authorized on an OBJECTIVE, and a sponsorship keys on it.
    //
    // 🔴 the slug IS the goal uri, so no row can be made goalless — not on a
    //    create, and not by an update that tries to clear it. the old path to
    //    a goalless row (`set --goal none`) is closed, so every sponsorship
    //    has a goal to key on, and this clamp grades that the door stays shut
    //
    // ⚠️ a probe db of its own, so the row it funds cannot join the funded
    //    set the siblings below grade
    then(
      '[t7] no write can strip a row of its goal, so a sponsorship always keys',
      () => {
        const db = genDbPath({ slug: 'eco-sponsor-goalless' });
        const refuse = (payload: object) =>
          spawnSync('node', [PATH_ECOWORK_DB, 'set', db], {
            input: JSON.stringify(payload),
            encoding: 'utf8',
            timeout: 30_000,
          });
        eco({
          db,
          verb: 'set',
          payload: {
            slug: 'bigrock://goalless',
            what: 'x',
            sev: 'p3',
            urg: '1m',
          },
        });
        // the old clear, retried: it is refused, and the row keeps its goal
        const cleared = refuse({ slug: 'bigrock://goalless', goal: 'none' });
        expect(cleared.status).toEqual(2);
        expect(cleared.stderr).toContain('set takes no goal');
        expect(
          eco({ db, verb: 'get', payload: { slug: 'bigrock://goalless' } })
            .priorities[0].slug,
        ).toEqual('bigrock://goalless');

        const got = refuse({
          slug: 'bigrock://goalless',
          sponsored: true,
          sponsorWho: 'bert',
          sponsorWhy: 'x',
        });
        expect(got.stderr).toEqual('');
        expect(got.status).toEqual(0);
      },
    );

    // 🔴 the capability no flag could ever have. `until` is what parts "a
    //    human funds this" from "a human funded this once" — and a lapsed
    //    episode stops the funding with no edit at all
    then(
      '[t8] a sponsorship whose until has PASSED no longer funds the row',
      () => {
        const db2 = genDbPath({ slug: 'eco-sponsor-lapsed' });
        eco({
          db: db2,
          verb: 'set',
          payload: {
            slug: 'bigrock://sandpine.lapsed',
            what: 'funded two years ago',
            sev: 'p2',
            urg: '1m',
            sponsored: true,
            sponsorWho: 'bert',
            sponsorWhy: 'a pilot, for one month',
            sponsorSince: '2024-01-01T00:00:00.000Z',
            sponsorUntil: '2024-02-01T00:00:00.000Z',
          },
        });
        const got = eco({
          db: db2,
          verb: 'get',
          payload: { slug: 'bigrock://sandpine.lapsed' },
        }).priorities[0];
        expect(got.sponsored).toEqual(false);
        // ⚠️ null here is the LAPSED state, never "open-ended" — the two are
        //   parted by `sponsored`, which is false. an expiry already past is
        //   not an expiry a reader is owed a countdown on
        expect(got.sponsoredUntil).toEqual(null);
      },
    );

    // ⇒ and the live-but-bounded case is the one a human must SEE, or the
    //   row drops off the rank on a date nobody was told about
    then(
      '[t9] a bounded live sponsorship reports its until, and the render counts down',
      () => {
        const db2 = genDbPath({ slug: 'eco-sponsor-bounded' });
        const until = new Date(Date.now() + 4 * 86_400_000).toISOString();
        eco({
          db: db2,
          verb: 'set',
          payload: {
            slug: 'bigrock://sandpine.bounded',
            what: 'funded to a date',
            sev: 'p2',
            urg: '1m',
            sponsored: true,
            sponsorWho: 'bert',
            sponsorWhy: 'one quarter of runway',
            sponsorUntil: until,
          },
        });
        const got = eco({
          db: db2,
          verb: 'get',
          payload: { slug: 'bigrock://sandpine.bounded' },
        }).priorities[0];
        expect(got.sponsored).toEqual(true);
        expect(got.sponsoredUntil).toEqual(until);

        const render = spawnSync(
          'bash',
          ['-c', `source '${PATH_ECOWORK_SH}'\neco.priority get`],
          {
            encoding: 'utf8',
            env: { ...process.env, ECOWORK_DB: db2 },
            timeout: 30_000,
          },
        );
        expect(render.stdout).toContain('⏳');
      },
    );

    // the filter was ABSENT while `sponsored` was a column — "what did we
    // actually fund?" had no answer but an eye over the whole render
    then(
      '[t10] --sponsored returns the funded set, --unsponsored its complement',
      () => {
        expect(
          eco({ db, verb: 'get', payload: { sponsored: true } }).priorities.map(
            (p: { slug: string }) => p.slug,
          ),
        ).toEqual([FUNDED]);
        expect(
          eco({
            db,
            verb: 'get',
            payload: { sponsored: false },
          }).priorities.map((p: { slug: string }) => p.slug),
        ).toContain(UNFUNDED);
      },
    );
  });

  given('[case33] a db built before `sponsored` existed', () => {
    const db = genDbPath({ slug: 'eco-migrate-sponsored' });

    const scene = useBeforeAll(async () => {
      // the v1 table by hand — no `sponsored` column, exactly as shipped
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
             VALUES ('legacy', 'a row from before sponsored existed', 'p1', '1w', 'x', 'x')\`).run();
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

    // the column is gone, so no backfill runs at all. `sponsored` is DERIVED,
    // and a goal with no episode derives false — never null, never a crash
    then('[t1] the legacy row derives sponsored=false', () => {
      expect(scene.got.priorities[0].sponsored).toEqual(false);
      expect(scene.got.priorities[0].sponsoredUntil).toEqual(null);
    });

    // ⚠️ the legacy row itself cannot be sponsored — its slug is not a goal
    //   uri, so it declares no goal to key an episode on. a NEW row proves
    //   the migrated store carries the whole record, tables and views alike
    then(
      '[t2] the migrated store then ACCEPTS a sponsorship, so the record is real',
      () => {
        const goal = 'bigrock://sandpine.legacy';
        eco({
          db,
          verb: 'set',
          payload: {
            slug: goal,
            what: 'a row born after the migration',
            sev: 'p2',
            urg: '1m',
            sponsored: true,
            sponsorWho: 'bert',
            sponsorWhy: 'it earns its budget',
          },
        });
        expect(
          eco({ db, verb: 'get', payload: { slug: goal } }).priorities[0]
            .sponsored,
        ).toEqual(true);
      },
    );
  });

  // ///////////////////////////////////////////////////////////////////
  // 🔴 the RETIREMENT of `priority.sponsored` — 2026-09-15
  //   the column shipped, carried real 1s, and was dropped. so the
  //   migration must carry those 1s FORWARD into `goal_sponsorship`, or
  //   the retirement is a silent un-funding of every row a human paid for.
  //
  //   ⚠️ and it must invent no author and no reason. the flag recorded
  //     neither, so both are NULL here — a store may not author a human's
  //     word (rule.forbid.fabricated-opines)
  // ///////////////////////////////////////////////////////////////////

  given(
    '[case58] a db built WHILE `sponsored` was a column, with a 1 in it',
    () => {
      const db = genDbPath({ slug: 'eco-retire-sponsored' });

      // the GOAL uris the fixture's two rows name — and, after the 2026-09-21
      // retirement, the slugs they end up under
      const PAID = 'bigrock://sandpine.paid';
      const FREE = 'bigrock://sandpine.free';

      const scene = useBeforeAll(async () => {
        // the v2 table by hand — `sponsored` present, exactly as it shipped
        execFileSync(
          'node',
          [
            '-e',
            `const { DatabaseSync } = require('node:sqlite');
           const db = new DatabaseSync(process.argv[1]);
           db.exec(\`CREATE TABLE priority (
             slug TEXT PRIMARY KEY, what TEXT NOT NULL, why TEXT, goal TEXT,
             opine_sev TEXT NOT NULL, opine_urg TEXT NOT NULL,
             sponsored INTEGER NOT NULL DEFAULT 0,
             quant_gain_cash TEXT, quant_gain_per TEXT NOT NULL DEFAULT 'once',
             quant_gain_duration TEXT NOT NULL DEFAULT '1y', quant_gain_time TEXT,
             quant_cost_cash TEXT, quant_cost_per TEXT NOT NULL DEFAULT 'once',
             quant_cost_duration TEXT NOT NULL DEFAULT '1y', quant_cost_time TEXT,
             quant_asks INTEGER NOT NULL DEFAULT 1,
             ref_task TEXT NOT NULL DEFAULT '[]', ref_tree TEXT NOT NULL DEFAULT '[]',
             seen_at TEXT NOT NULL, set_at TEXT NOT NULL);\`);
           db.exec(\`CREATE INDEX priority_sponsored ON priority (sponsored);\`);
           db.prepare(\`INSERT INTO priority (slug, what, goal, opine_sev, opine_urg, sponsored, seen_at, set_at)
             VALUES ('bigrock://was-funded', 'a row a human paid for', 'bigrock://sandpine.paid', 'p2', '1m', 1, 'x', 'x')\`).run();
           db.prepare(\`INSERT INTO priority (slug, what, goal, opine_sev, opine_urg, sponsored, seen_at, set_at)
             VALUES ('never-funded', 'a row nobody paid for', 'bigrock://sandpine.free', 'p0', '1d', 0, 'x', 'x')\`).run();
           db.close();`,
            db,
          ],
          { encoding: 'utf8', timeout: 30_000 },
        );
        return { got: eco({ db, verb: 'get', payload: {} }) };
      });

      then(
        '[t0] a get against the flagged db SUCCEEDS rather than malfunctions',
        () => {
          expect(scene.got.count).toEqual(2);
        },
      );

      // 🔴 the whole clamp. the 1 survives the drop of the column it lived in
      //
      // ⚠️ the rows are found under their GOAL uris, never the slugs the fixture
      //   typed — `bigrock://was-funded` and `never-funded` are both gone. this
      //   fixture predates 2026-09-21 and its two names DIFFER by design, so the
      //   goal retirement migrates each slug onto its goal, and that is the
      //   single most valuable thing this case now proves: the two retirements
      //   COMPOSE in one open, and in this order.
      //
      //   ⇒ the order is load-bearing. `setSponsorFlagRetired` reads `row.goal`
      //     to key each episode, so it must run BEFORE the column it reads is
      //     retired — and the episode's key then equals the migrated slug
      then(
        '[t1] the flagged row is STILL funded, and the unflagged one still is not',
        () => {
          const at = (slug: string) =>
            scene.got.priorities.find((p: { slug: string }) => p.slug === slug);
          expect(at(PAID).sponsored).toEqual(true);
          expect(at(FREE).sponsored).toEqual(false);
        },
      );

      // ⚠️ the flag named no author. so the carried episode names none either,
      //   and says so in its `why` rather than a name a store made up
      then(
        '[t2] the carried episode records a NULL author, and names the debt',
        () => {
          const held = readFileSync(
            join(dirname(db), 'goal_sponsorship.csv'),
            'utf8',
          );
          expect(held).toContain('retired priority.sponsored flag');
          expect(held).toContain('--sponsor-who');
          // exactly one episode — the 0 row carried naught
          expect(held.trim().split('\n').length).toEqual(2);
        },
      );

      // the column is GONE, so a second open must find no flag to carry, and
      // must not mint a rival episode on the same goal
      then('[t3] the retirement is idempotent across a re-open', () => {
        eco({ db, verb: 'get', payload: {} });
        eco({ db, verb: 'get', payload: {} });
        const held = readFileSync(
          join(dirname(db), 'goal_sponsorship.csv'),
          'utf8',
        );
        expect(held.trim().split('\n').length).toEqual(2);
        expect(
          eco({ db, verb: 'get', payload: { slug: PAID } }).priorities[0]
            .sponsored,
        ).toEqual(true);
      });

      // 🔴 ABSENT is not EMPTY — and the guard that says so must hold at the
      //    TABLE grain, never merely the store's.
      //
      //    the store-wide guard reads "one csv present ⇒ the text has spoken",
      //    then clears every table against its own file. a table whose file is
      //    ABSENT was therefore emptied, in silence, while its peers restored.
      //
      //    ⚠️ measured 2026-09-15 on the LIVE store: `goal_sponsorship.csv` was
      //      deleted by hand to force a re-dump, and the next open truncated
      //      five human-authorized sponsorships with no error at all.
      then(
        '[t4] one mirror deleted does NOT empty its table — the db bootstraps it',
        () => {
          const mirror = join(dirname(db), 'goal_sponsorship.csv');
          // the migration carried one episode, and it is on disk
          expect(existsSync(mirror)).toEqual(true);
          const before = readFileSync(mirror, 'utf8');

          // ⚠️ the PEER mirrors stay, so the store-wide `spoken` guard sees a
          //   store that has spoken — which is exactly the state that bit
          rmSync(mirror);
          expect(existsSync(join(dirname(db), 'priority.csv'))).toEqual(true);

          // the row survives the open…
          expect(
            eco({ db, verb: 'get', payload: { slug: PAID } }).priorities[0]
              .sponsored,
          ).toEqual(true);
          // …and the mirror is rebuilt from the db, byte for byte
          expect(existsSync(mirror)).toEqual(true);
          expect(readFileSync(mirror, 'utf8')).toEqual(before);
        },
      );

      // 🔴 and the column itself is gone — a read that still names it would
      //    mean two homes for one fact, which is the defect the drop repaired
      //
      // ⚠️ `goal` is asserted ABSENT here, and it read `toContain('goal')` until
      //   2026-09-21. that line was the control — it proved the drop was narrow,
      //   that it took `sponsored` and left its neighbour alone. the neighbour
      //   has since been retired by the same mechanism, so the line now clamps
      //   BOTH drops at once, and a re-appearance of either is a failure
      then(
        '[t5] BOTH retired columns are absent from the priority table',
        () => {
          const held = execFileSync(
            'node',
            [
              '-e',
              `const { DatabaseSync } = require('node:sqlite');
           const db = new DatabaseSync(process.argv[1]);
           process.stdout.write(
             db.prepare('PRAGMA table_info(priority)').all().map((c) => c.name).join(','),
           );
           db.close();`,
              db,
            ],
            { encoding: 'utf8', timeout: 30_000 },
          );
          expect(held.split(',')).not.toContain('sponsored');
          expect(held.split(',')).not.toContain('goal');
          // ✅ and the slug it migrated ONTO is the one the table holds
          expect(held.split(',')).toContain('slug');
        },
      );
    },
  );

  // 🔴 the same lesson [case14] paid for, on the second column to be added.
  //    every other clamp provisions a FRESH db, so the suite is blind to
  //    migration by construction — a green suite would declare the schema
  //    sound while the only real store threw `no such column: status`
  given('[case23] a db built before `status` and `gate` existed', () => {
    const db = genDbPath({ slug: 'eco-migrate-status' });

    const scene = useBeforeAll(async () => {
      // the v2 table — `goal` had landed, `status` had not, and no gate table
      execFileSync(
        'node',
        [
          '-e',
          `const { DatabaseSync } = require('node:sqlite');
           const db = new DatabaseSync(process.argv[1]);
           db.exec(\`CREATE TABLE priority (
             slug TEXT PRIMARY KEY, goal TEXT, what TEXT NOT NULL, why TEXT,
             opine_sev TEXT NOT NULL, opine_urg TEXT NOT NULL,
             quant_gain_cash TEXT, quant_gain_per TEXT NOT NULL DEFAULT 'once',
             quant_gain_duration TEXT NOT NULL DEFAULT '1y', quant_gain_time TEXT,
             quant_cost_cash TEXT, quant_cost_per TEXT NOT NULL DEFAULT 'once',
             quant_cost_duration TEXT NOT NULL DEFAULT '1y', quant_cost_time TEXT,
             quant_asks INTEGER NOT NULL DEFAULT 1,
             ref_task TEXT NOT NULL DEFAULT '[]', ref_tree TEXT NOT NULL DEFAULT '[]',
             seen_at TEXT NOT NULL, set_at TEXT NOT NULL);\`);
           db.prepare(\`INSERT INTO priority (slug, what, opine_sev, opine_urg, seen_at, set_at)
             VALUES ('legacy', 'a row from before status existed', 'p1', '1w', 'x', 'x')\`).run();
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

    // 🔴 the backfill is a judgment, not a detail. a row written before the
    //    column existed recorded no progress, so to assume `done` would open
    //    every gate in the store the moment it upgraded
    then('[t1] the legacy row backfills to enqueued, never to done', () => {
      expect(scene.got.priorities[0].status).toEqual('enqueued');
    });

    // 🔴 a legacy row carries a bare name, and a gate edge is keyed by the
    //    goal's uuid — so it cannot be an endpoint until it holds a uri. that
    //    refusal is correct and is clamped below; here the row is repaired
    //    first, which is what a human would have to do.
    //
    //    the repair is `goal.mv` from the bare name onto a uri: a rename IN
    //    PLACE, so the row keeps its fields and no second row is minted
    then(
      '[t2] the gate table is created on an old db, so an edge can be written',
      () => {
        const moved = eco({
          db,
          verb: 'goal.mv',
          payload: { from: 'legacy', to: 'bigrock://legacy' },
        });
        expect(moved.count).toEqual(1);
        eco({
          db,
          verb: 'set',
          payload: {
            slug: 'bigrock://second',
            what: 'a new row',
            sev: 'p1',
            urg: '1w',
            gatedBy: ['bigrock://legacy'],
          },
        });
        const got = eco({
          db,
          verb: 'get',
          payload: { slug: 'bigrock://second' },
        });
        expect(got.priorities[0].gatedByOpen).toEqual(['bigrock://legacy']);

        // the rename kept the legacy row whole — one row, not a pair
        const all = eco({ db, verb: 'get', payload: {} });
        expect(all.count).toEqual(2);
        const legacy = all.priorities.find(
          (p: { slug: string }) => p.slug === 'bigrock://legacy',
        );
        expect(legacy.what).toEqual('a row from before status existed');
      },
    );

    // 🔴 and the refusal itself, which is the half a human actually meets.
    //    an error that names a repair the surface REFUSES is worse than one
    //    that names none — the reader runs it, hits a second error, and
    //    learns the tool is lying rather than that the row needs a kind
    //    (rule.require.errors-name-the-fix). measured 2026-09-16: the prior
    //    advice was `--goal '<slug>'`, and BOTH halves were unrunnable — a
    //    bare token records no kind, and the shell exposes no --goal at all
    then(
      '[t3] and a goal-less endpoint is refused with a repair that RUNS',
      () => {
        const dbBare = genDbPath({ slug: 'eco-migrate-status-bare' });
        eco({
          db: dbBare,
          verb: 'set',
          payload: {
            slug: 'bigrock://anchor',
            what: 'a real row',
            sev: 'p1',
            urg: '1w',
          },
        });

        let said = '';
        try {
          eco({
            db: dbBare,
            verb: 'set',
            payload: { slug: 'bigrock://anchor', gatedBy: ['nogoal'] },
          });
        } catch (error) {
          said = String(
            (error as { stderr?: string }).stderr ?? (error as Error).message,
          );
        }

        // it refuses, and it does NOT hand back the advice that re-fails
        expect(said).not.toMatch(/--goal 'nogoal'/);
      },
    );
  });

  /**
   * 🔴 [case47] — the TENTH axis: the BRANCH SWITCH
   *
   * the db is **gitignored**, so it SURVIVES a `git checkout`. the csv is
   * **tracked**, so it becomes the arrived branch's store. that asymmetry is
   * the whole hazard, and it is created by the very property that makes the
   * db disposable.
   *
   * ⚠️ measured 2026-09-14, under the prior model: a plain `get` after a
   *    simulated checkout REPLACED the arrived branch's store with the
   *    departed branch's rows. a read. no write verb, no prompt, no trace —
   *    and the damaged file is the COMMITTED store, so the loss landed in git
   *    history on the next commit. nine axes stayed green
   *
   * 🔴 the cure is NOT a discriminator, and the prior one was the defect.
   *
   *    a first repair compared the two sides — a subset healed, a surplus
   *    refused. it is unsound, because the reachable case parts neither way:
   *    a human who edits `sev` in a PR moves NO row in or out. same keys,
   *    same count, one field different. a subset/surplus test reads that as
   *    "they agree" and the db then overwrites the human's edit, silently
   *    (define.invariant.eco.the-csv-is-truth-the-db-is-a-cache)
   *
   * ⇒ so the model declares the direction instead of a derivation of it:
   *   **the text is truth, the db conforms, always.** the checkout needs no
   *   special case at all — the arrived text wins, as it does on every open.
   *
   * 🔴 `[t3]` is the load that matters, and its claim INVERTED with the
   *   model. it used to prove a crash-window subset was healed FROM the db.
   *   it now proves the opposite: the db never leads, so a text that holds
   *   fewer rows is not a crash artifact to repair — it is the store
   */
  given('[case47] a db that outlived the branch it was built on', () => {
    const scene = useBeforeAll(async () => {
      /** .what = run a verb and hand back the raw result, failure included */
      const attempt = (db: string, verb: string, payload: object) =>
        spawnSync('node', [PATH_ECOWORK_DB, verb, db], {
          input: JSON.stringify(payload),
          encoding: 'utf8',
          timeout: 30_000,
        });

      const slugsIn = (path: string) =>
        getStoreRows(path).map((row) => row.slug);

      /** .what = overwrite one field of the single row a store file holds */
      const setFieldInStore = (path: string, column: string, value: string) => {
        const lines = readFileSync(path, 'utf8').split('\n');
        const header = asCsvFields(lines[0]!);
        const row = asCsvFields(lines[1]!);
        row[header.indexOf(column)] = value;
        writeFileSync(path, `${lines[0]}\n${row.join(',')}\n`);
      };

      // ── the checkout: a db from branch A, a csv from branch B ─────────────
      const switched = genDbPath({ slug: 'eco-branch-switch' });
      eco({
        db: switched,
        verb: 'set',
        payload: {
          slug: 'bigrock://alpha-on-branch-a',
          sev: 'p1',
          urg: '1w',
          what: 'branch a row',
        },
      });
      const stored = join(dirname(switched), 'priority.csv');

      // the tracked file changes with the branch; the ignored db does not.
      // built from a REAL dumped row so every column is present and true to
      // the schema — a hand-written row here would grade a shape the store
      // never emits
      setFieldInStore(stored, 'slug', 'bigrock://beta-on-branch-b');

      const read = attempt(switched, 'get', {});

      // ── the same shape, one FIELD apart: the case no order can settle ─────
      const edited = genDbPath({ slug: 'eco-branch-field-edit' });
      eco({
        db: edited,
        verb: 'set',
        payload: {
          slug: 'bigrock://same-key',
          sev: 'p1',
          urg: '1w',
          what: 'the original words',
        },
      });
      const editedStore = join(dirname(edited), 'priority.csv');
      setFieldInStore(editedStore, 'what', 'EDITED BY A HUMAN IN GIT');

      const editedRead = attempt(edited, 'get', {});

      // ── a text that holds FEWER rows than the db: still the store ─────────
      const behind = genDbPath({ slug: 'eco-branch-behind' });
      eco({
        db: behind,
        verb: 'set',
        payload: {
          slug: 'bigrock://first-row',
          sev: 'p1',
          urg: '1w',
          what: 'in the text',
        },
      });
      eco({
        db: behind,
        verb: 'set',
        payload: {
          slug: 'bigrock://second-row',
          sev: 'p1',
          urg: '1w',
          what: 'the tail write',
        },
      });
      const behindStore = join(dirname(behind), 'priority.csv');
      const behindLines = readFileSync(behindStore, 'utf8').split('\n');
      const behindHeader = asCsvFields(behindLines[0]!);
      const behindKept = behindLines
        .slice(1)
        .filter((line) => line.trim())
        .filter(
          (line) =>
            asCsvFields(line)[behindHeader.indexOf('slug')] ===
            'bigrock://first-row',
        );
      writeFileSync(
        behindStore,
        `${behindLines[0]}\n${behindKept.join('\n')}\n`,
      );

      const behindRead = attempt(behind, 'get', {});

      return {
        read,
        onDisk: slugsIn(stored),
        editedRead,
        editedOnDisk: getStoreRows(editedStore).map((row) => row.what),
        behindRead,
        behindOnDisk: slugsIn(behindStore),
      };
    });

    // 🔴 no refusal, and that is the design. there is no direction left to
    //    get wrong, so no case remains to refuse on
    then('[t0] a plain read succeeds, with no guess to make', () => {
      if (scene.read.status !== 0)
        throw new Error(
          `[case47] a plain read REFUSED after a branch switch.\n` +
            `  said:  ${`${scene.read.stdout}${scene.read.stderr}`.trim()}\n` +
            `  fix:   the text is truth. a checkout is not a conflict — the\n` +
            `         arrived text is the store, and the db conforms to it\n` +
            `  ⇒ a refusal here is a comparison that survived the model change`,
        );
    });

    // 🔴 the harm is the LOSS, so the clamp must prove the row is still there.
    //    a read that clobbered the tracked file would be the same defect
    //    with a warn stapled on
    then('[t1] and the arrived branch keeps its rows', () => {
      expect(scene.onDisk).toEqual(['bigrock://beta-on-branch-b']);
      expect(scene.onDisk).not.toContain('bigrock://alpha-on-branch-a');
    });

    // 🔴 THE MEASURED DEFECT, clamped. same key, same count, one field apart
    //    — the shape a subset/surplus test and a set_at tiebreak both read as
    //    "no divergence", after which the db overwrites a human's committed
    //    edit and exits 0
    then('[t2] a FIELD edit to the text survives a plain read', () => {
      if (scene.editedRead.status !== 0)
        throw new Error(
          `[case47] a plain read refused a field edit.\n` +
            `  said:  ${`${scene.editedRead.stdout}${scene.editedRead.stderr}`.trim()}`,
        );
      if (scene.editedOnDisk[0] !== 'EDITED BY A HUMAN IN GIT')
        throw new Error(
          `[case47] a human's committed edit was SILENTLY REVERTED by a read.\n` +
            `  text before: EDITED BY A HUMAN IN GIT\n` +
            `  text after:  ${String(scene.editedOnDisk[0])}\n` +
            `  fix:   restore the db from the text UNCONDITIONALLY, and never\n` +
            `         gate that restore on the db holding zero rows\n` +
            `  ⇒ this is the defect the whole model was rewritten for, and it\n` +
            `    is invisible to every other axis: each grades the db -> text\n` +
            `    direction, and this loss is the text -> db one`,
        );
      expect(scene.editedRead.status).toEqual(0);
    });

    // ⚠️ THE INVERTED CONTROL. under the prior model a text with fewer rows
    //    was a crash artifact to heal FROM the db. the dump now commits
    //    INSIDE the transaction, so the db can never be ahead — which makes
    //    a shorter text a real store, never a symptom
    then(
      '[t3] a text that holds fewer rows is the store, not a symptom',
      () => {
        if (scene.behindRead.status !== 0)
          throw new Error(
            `[case47] a plain read refused a text with fewer rows.\n` +
              `  said:  ${`${scene.behindRead.stdout}${scene.behindRead.stderr}`.trim()}`,
          );
        if (scene.behindOnDisk.length !== 1)
          throw new Error(
            `[case47] the db re-seeded rows the text had dropped.\n` +
              `  text held:  first-row\n` +
              `  text holds: ${scene.behindOnDisk.join(', ')}\n` +
              `  fix:   the dump must sit INSIDE the write transaction, so the db\n` +
              `         can never lead the text. then the rebuild is lossless and\n` +
              `         needs no heal\n` +
              `  ⇒ a heal here would undo a deliberate deletion in a PR`,
          );
        expect(scene.behindOnDisk).toEqual(['bigrock://first-row']);
      },
    );
  });
});
