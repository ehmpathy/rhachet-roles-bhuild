/**
 * .what = clamps on the store as git sees it — the consumer, the hooks, the ignores, the index
 *
 * .note = a PART of the `ecowork.db` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in ecowork.harness.ts.
 */
import { execFileSync, spawnSync } from 'child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { dirname, join } from 'path';
import { given, then, useBeforeAll } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import {
  asCsvRows,
  asCsvText,
  asTextShape,
  eco,
  genConsumerRepo,
  genDbPath,
  getStoreRows,
  PATH_ECOWORK_DB,
} from './ecowork.harness';

afterAll(() => tempDirs.delAll());

describe('ecowork.db', () => {
  // 🔴 .why a COMMITTED store is clamped, and not just a temp one
  //    [case38] proves the mechanism is complete. it says naught about
  //    whether a consumer's `.eco/` can be committed whole — and an
  //    uncommitted store is one disk away from gone, which is the exact loss
  //    that put the mirror here (define.invariant.eco.the-store-is-plaintext-in-git).
  //
  //    ⇒ a mechanism that cannot omit, plus a repo that tracks every file
  //      it emits, is what makes the plaintext store the record rather
  //      than a convenience beside a binary that holds the truth
  given('[case39] the store a consumer commits', () => {
    const consumer = useBeforeAll(async () =>
      genConsumerRepo({ slug: 'eco-consumer-committed' }),
    );

    /** .what = the paths git actually holds under .eco/ */
    const getAllTracked = (): string[] =>
      consumer
        .git('ls-files', '--cached', '.eco')
        .split('\n')
        .filter((line) => line.trim());

    const scene = useBeforeAll(async () => {
      const DIR_ECO = consumer.dirEco;
      // rebuild a store from the COMMITTED text alone, in a temp dir, so
      // the schema it declares is read rather than assumed. this is also
      // the claim itself: a fresh clone has the csv and no db
      const dir = tempDirs.genOne({ slug: 'eco-committed' });
      const db = join(dir, 'priority.db');
      for (const file of readdirSync(DIR_ECO).filter((f) =>
        f.endsWith('.csv'),
      )) {
        writeFileSync(
          join(dir, file),
          readFileSync(join(DIR_ECO, file), 'utf8'),
        );
      }
      const rebuilt = eco({ db, verb: 'get', payload: {} });

      const tables = JSON.parse(
        execFileSync(
          'node',
          [
            '-e',
            `const { DatabaseSync } = require('node:sqlite');` +
              `const db = new DatabaseSync(process.argv[1]);` +
              `const rows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ` +
              `AND name NOT LIKE 'sqlite_%' ORDER BY rowid ASC").all();` +
              `process.stdout.write(JSON.stringify(rows.map((r) => r.name)));`,
            db,
          ],
          { encoding: 'utf8', timeout: 30_000 },
        ),
      ) as string[];

      // the key columns of each table, read from the rebuilt schema — the
      // same derivation the dump uses, so the order claim below is graded
      // against the rule rather than against a guess about the rule
      const keys = JSON.parse(
        execFileSync(
          'node',
          [
            '-e',
            `const { DatabaseSync } = require('node:sqlite');` +
              `const db = new DatabaseSync(process.argv[1]);` +
              `const out = {};` +
              `for (const t of JSON.parse(process.argv[2])) {` +
              `  const info = db.prepare('PRAGMA table_info(' + t + ')').all();` +
              `  const pk = info.filter((c) => c.pk > 0).sort((a, b) => a.pk - b.pk);` +
              `  out[t] = (pk.length ? pk : info).map((c) => c.name);` +
              `}` +
              `process.stdout.write(JSON.stringify(out));`,
            db,
            JSON.stringify(tables),
          ],
          { encoding: 'utf8', timeout: 30_000 },
        ),
      ) as Record<string, string[]>;

      return {
        dir,
        dirEco: DIR_ECO,
        tables,
        rebuilt,
        keys,
        tracked: getAllTracked(),
      };
    });

    // 🔴 THE teeth. a table the schema declares with no committed twin is
    //    a table git loses whole, and every other surface reads healthy
    then('[t0] every table the schema declares has a committed csv', () => {
      const absent = scene.tables.filter(
        (t: string) => !scene.tracked.includes(`.eco/${t}.csv`),
      );
      expect(absent).toEqual([]);
    });

    // an emitted file that git never holds is the same loss one layer
    // out — the mirror wrote it, and the commit left it on one disk
    then('[t1] and git holds every csv the mirror emits', () => {
      const emitted = readdirSync(scene.dirEco).filter((f) =>
        f.endsWith('.csv'),
      );
      const untracked = emitted.filter(
        (f) => !scene.tracked.some((p: string) => p.endsWith(`.eco/${f}`)),
      );
      expect(untracked).toEqual([]);
    });

    // the db is a cache, and a cache in git is the defect the mirror
    // replaced: binary diffs, and a merge that drops one side in silence
    then('[t2] and the derived db is NOT among them', () => {
      expect(scene.tracked.filter((p: string) => p.endsWith('.db'))).toEqual(
        [],
      );
    });

    // 🔴 the committed text must be able to STAND ALONE. a fresh clone has
    //    no db, so if the csv cannot rebuild one the store is gone
    then('[t3] the committed text alone rebuilds a live store', () => {
      expect(scene.rebuilt.priorities.length).toBeGreaterThan(0);
    });

    // 🔴 the committed text must already be in the order the dump emits.
    //    a file out of that order is one a hand edit touched, or one an
    //    older dump wrote — and either way the NEXT write re-orders the
    //    whole file, so the commit that follows reads as a total rewrite
    //    and the one field that actually moved is invisible in review
    then('[t4] and it is already in the canonical order the dump emits', () => {
      for (const table of scene.tables) {
        // `keys` is built by a walk of `tables`, so an absent entry is a
        // malfunction of the derivation — never a table with no key columns.
        // it fails loud, because an empty key list makes every row sort
        // equal and the order claim below would pass while it proved naught
        const columns =
          scene.keys[table] ??
          MalfunctionError.throw(
            'the schema walk left a table with no key columns',
            {
              table,
              tables: scene.tables,
            },
          );
        const asKey = (row: Record<string, unknown>) =>
          columns.map((c: string) => String(row[c])).join('\u0000');
        const held = getStoreRows(join(scene.dirEco, `${table}.csv`)).map(
          (row) => asKey(row),
        );
        expect({ table, keys: held }).toEqual({
          table,
          keys: [...held].sort(),
        });
      }
    });
  });

  // 🔴 .why the VERB set is clamped, and derived like the table set
  //    [case38] proves the dump is complete over the schema. it proves
  //    naught about whether the dump RAN. `setStoreDumped` is called from
  //    exactly one place in `main`, so a second write path — a new verb, a
  //    batch import, a repair routine — reaches the db and never the text.
  //
  //    that failure is the quietest one this store has. the write lands,
  //    the verb exits 0, every read answers with it, and git holds a store
  //    one row behind. nobody learns until a clone.
  //
  //    ⇒ so the verbs are read from the module's OWN refusal message, and
  //      every one that is not the read verb must leave the mirror equal to
  //      the db. ⚠️ a verb with no fixture here FAILS rather than skips —
  //      that is the whole mechanism: a new write verb cannot land green
  //      until somebody proves it dumps
  given('[case40] every write verb the module declares', () => {
    const db = genDbPath({ slug: 'eco-verb-coverage' });

    /**
     * .what = the verb set, read from the module's own refusal
     * .why  = a hand list here is the same defect the table list was. the
     *         refusal message is what a new verb's author must update, or
     *         the cli lies about its own surface — so it is the one place
     *         the verb set is declared for a caller
     */
    const getAllVerbs = (): string[] => {
      const ran = spawnSync('node', [PATH_ECOWORK_DB, 'no-such-verb', db], {
        input: '{}',
        encoding: 'utf8',
        timeout: 30_000,
      });
      const found =
        /is not one of:\s*([^\n"]+)/.exec(`${ran.stdout}${ran.stderr}`)?.[1] ??
        MalfunctionError.throw(
          'could not read the verb set off the module refusal',
          {
            stdout: ran.stdout,
            stderr: ran.stderr,
          },
        );
      return found.trim().split(/\s+/);
    };

    /** .what = one payload per write verb, so the verb actually mutates */
    const FIXTURES: Record<string, object> = {
      set: {
        slug: 'bigrock://verb-row',
        what: 'a row a write verb touched',
        sev: 'p2',
        urg: '1w',
      },
      del: { slug: 'bigrock://verb-row' },
      'goal.mv': { from: 'bigrock://verb-root', to: 'altrock://verb-root' },
    };

    /** .what = rows in a content-derived order, so a compare is fair */
    const asSorted = (rows: object[]): object[] =>
      [...rows].sort((a, b) =>
        JSON.stringify(a) < JSON.stringify(b) ? -1 : 1,
      );

    /** .what = the db and its text, side by side, per table */
    const asParity = (): Record<string, { db: object[]; text: object[] }> => {
      const tables = JSON.parse(
        execFileSync(
          'node',
          [
            '-e',
            `const { DatabaseSync } = require('node:sqlite');` +
              `const db = new DatabaseSync(process.argv[1]);` +
              `const rows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ` +
              `AND name NOT LIKE 'sqlite_%' ORDER BY rowid ASC").all();` +
              `const out = {};` +
              `for (const t of rows.map((r) => r.name)) out[t] = db.prepare('SELECT * FROM ' + t).all();` +
              `process.stdout.write(JSON.stringify(out));`,
            db,
          ],
          { encoding: 'utf8', timeout: 30_000 },
        ),
      ) as Record<string, object[]>;

      return Object.fromEntries(
        Object.entries(tables).map(([table, rows]) => {
          const path = join(dirname(db), `${table}.csv`);
          const text = getStoreRows(path);
          // ⚠️ the db side is rendered AS TEXT first — a csv cannot hold a
          //   number, so a raw compare grades the transport (asTextShape)
          return [
            table,
            { db: asSorted(asTextShape(rows)), text: asSorted(text) },
          ];
        }),
      );
    };

    const scene = useBeforeAll(async () => {
      const verbs = getAllVerbs();

      // a root for goal.mv to move
      eco({
        db,
        verb: 'set',
        payload: {
          slug: 'bigrock://verb-root',
          what: 'a root',
          sev: 'p1',
          urg: '1w',
        },
      });

      // 🔴 the read verb is the ONE exemption, and the module names it
      //    itself — `main` runs `get` outside the transaction and outside
      //    the dump. every other verb is a write, by that same branch
      const writes = verbs.filter((v) => v !== 'get');

      const parity = writes.map((verb) => {
        const fixture = FIXTURES[verb];
        if (!fixture)
          throw new Error(
            `[case40] the module declares a verb this clamp has no fixture for: '${verb}'.\n` +
              `  add one to FIXTURES so the clamp can prove that verb dumps its mirror.\n` +
              `  ⇒ a write verb that never dumps leaves git a store behind, silently`,
          );
        eco({ db, verb: verb as 'set' | 'get' | 'del', payload: fixture });
        return { verb, parity: asParity() };
      });

      return { verbs, writes, parity };
    });

    // the floor: a refusal message that named no verbs would make every
    // claim below vacuous while it read as a pass
    then('[t0] the verb set was read off the module, and it is real', () => {
      expect(scene.verbs).toContain('get');
      expect(scene.writes.length).toBeGreaterThan(0);
    });

    // 🔴 THE teeth. after each write verb, the text equals the db — every
    //    table, every column. a verb that skips the dump lands here and
    //    nowhere else
    then('[t1] each write verb leaves the mirror equal to the db', () => {
      for (const { verb, parity } of scene.parity) {
        for (const [table, sides] of Object.entries(parity)) {
          expect({ verb, table, text: sides.text }).toEqual({
            verb,
            table,
            text: sides.db,
          });
        }
      }
    });
  });

  // 🔴 .why the CRASH WINDOW is clamped, rather than merely named
  //    the dump runs after COMMIT and outside the try, so a crash in that
  //    window leaves the db one write ahead of the text. the row is not
  //    lost — the db holds it — but GIT does, and the store's whole claim
  //    is that git holds the record.
  //
  //    the invariant used to call this a known gap and decline the repair,
  //    on the grounds that the only alternative was a two-phase commit
  //    across a database and a filesystem. ⇒ that missed a third option,
  //    and it is nearly free: do not make the write atomic — make the NEXT
  //    CALL converge. so the mirror is healed on OPEN, and a plain read
  //    now closes the window
  /**
   * 🔴 .what = the crash window, graded on the shape that is REACHABLE
   *
   * .why  = this case used to stage the opposite state — a db AHEAD of the
   *         text — and claim a read healed it. that window is closed by
   *         construction now: `setStoreDumped` runs BEFORE the COMMIT, so
   *         the db can never lead. the store says so in its own words, and
   *         the heal that once adjudicated the two sides is deleted:
   *
   *           "there is NO heal step, and its absence is the design […]
   *            the inference was the defect. `setStoreHealed` compared the
   *            two sides and guessed which was behind; on an edit made in
   *            git the two were NEITHER behind, and its guess reverted a
   *            human's committed work."
   *
   *         ⇒ so a clamp on the old shape does not grade a weaker store —
   *           it grades a state no crash can produce, and it fails forever
   *           while the store is correct. the claim is rewritten, never
   *           "fixed" (measured 2026-09-16, `.temp/probe-crash.mjs`)
   *
   * ⚠️ the reachable shape is the MIRROR of the old one, which is why a
   *    rename of the fixture would not have been enough: a crash after the
   *    dump and before the COMMIT leaves the TEXT ahead, and the next open
   *    rebuilds the db from it — so the write SURVIVES rather than needs a
   *    repair. the old case asserted a recovery; this asserts a durability
   */
  given('[case41] a crash between the dump and the commit', () => {
    const db = genDbPath({ slug: 'eco-crash-window' });
    const dbClean = genDbPath({ slug: 'eco-crash-rollback' });

    const KEPT = 'bigrock://kept';
    const TAIL = 'bigrock://tail';
    const BLOCKED = 'bigrock://blocked';

    const asText = (table: string) =>
      readFileSync(join(dirname(db), `${table}.csv`), 'utf8');

    const scene = useBeforeAll(async () => {
      eco({
        db,
        verb: 'set',
        payload: {
          slug: KEPT,
          what: 'a row that survived',
          sev: 'p1',
          urg: '1w',
        },
      });

      // 🔴 the crash, staged in the one direction the order permits: the
      //   dump for a SECOND write landed and its COMMIT never did. so the
      //   text holds two rows and the db holds one
      const rows = asCsvRows(asText('priority'));
      const ahead = asCsvText([...rows, { ...rows[0]!, slug: TAIL }]);
      writeFileSync(join(dirname(db), 'priority.csv'), ahead);

      // a READ. no write verb, no mutation — the cheapest call there is
      const read = eco({ db, verb: 'get', payload: {} });

      // ── the second half: a write whose MIRROR cannot land ────────────
      //   the csv is replaced by a DIRECTORY, so the dump's rename cannot
      //   land while sqlite itself stays perfectly writable. a read-only
      //   dir would block sqlite too and grade the wrong mechanism
      eco({
        db: dbClean,
        verb: 'set',
        payload: {
          slug: KEPT,
          what: 'a row that survived',
          sev: 'p1',
          urg: '1w',
        },
      });
      const blockedCsv = join(dirname(dbClean), 'priority.csv');
      rmSync(blockedCsv, { force: true });
      mkdirSync(blockedCsv);

      let refused = false;
      try {
        eco({
          db: dbClean,
          verb: 'set',
          payload: {
            slug: BLOCKED,
            what: 'a write with no mirror',
            sev: 'p2',
            urg: '1w',
          },
        });
      } catch {
        refused = true;
      }
      rmSync(blockedCsv, { recursive: true, force: true });
      const afterRefusal = eco({ db: dbClean, verb: 'get', payload: {} });

      return {
        ahead,
        read,
        refused,
        afterRefusal,
        settled: asText('priority'),
      };
    });

    // the fixture must actually have produced the divergence, or every
    // claim below passes over a state that never went wrong
    then('[t0] the fixture really did leave the text a row ahead', () => {
      expect(
        asCsvRows(scene.ahead)
          .map((row) => row.slug)
          .sort(),
      ).toEqual([KEPT, TAIL].sort());
    });

    // 🔴 THE teeth. the text is the store, so the write the COMMIT never
    //    took is not lost — the next open rebuilds the db from the text
    then('[t1] the write survives, rebuilt into the db from the text', () => {
      expect(
        scene.read.priorities.map((row: { slug: string }) => row.slug).sort(),
      ).toEqual([KEPT, TAIL].sort());
    });

    // and the text is NOT rolled back to match the db it led. a store that
    // trimmed itself to the cache would delete a human's committed edit —
    // which is the exact defect that retired `setStoreHealed`
    then(
      '[t2] and the text was not trimmed back to match the db it led',
      () => {
        expect(
          asCsvRows(scene.settled)
            .map((row) => row.slug)
            .sort(),
        ).toEqual([KEPT, TAIL].sort());
      },
    );

    // 🔴 THE teeth on the ORDER itself, and the reason [t0]'s shape is the
    //    only one reachable. if the dump ran AFTER the commit, this write
    //    would be in the db with no mirror — a row git never sees, which is
    //    the db-ahead state the old case existed to repair
    then('[t3] a write whose mirror cannot land is refused', () => {
      expect(scene.refused).toEqual(true);
    });

    then('[t4] and it leaves NO committed row behind it', () => {
      expect(
        scene.afterRefusal.priorities.map((row: { slug: string }) => row.slug),
      ).toEqual([KEPT]);
    });
  });

  /**
   * 🔴 [case45] — the EIGHTH axis: REACHABILITY
   *
   * every clamp above reads the FILESYSTEM. not one reads the INDEX.
   *
   *   ⇒ so a mirror can be written perfectly — every table, every column,
   *     every type, atomically, healed on each open — and git can refuse to
   *     track a byte of it. the store is complete on disk and absent from the
   *     commit, which is the exact outcome this invariant exists to forbid
   *
   * ⚠️ measured 2026-09-14: `*.csv` was added to `.eco/.gitignore`, and all
   *    285 clamps across the seven prior axes PASSED. they pass by
   *    construction — each runs against a temp db outside the repo, so none
   *    of them can observe a rule in `.eco/` at all
   *
   * 🔴 the two directions are NOT one claim, and each carries its own weight:
   *
   *     the text must be TRACKABLE   an ignored csv never reaches a commit
   *     the db must be IGNORED       a tracked sqlite is `Binary files differ`
   *                                  on review, and a merge takes one side
   *                                  outright — the original defect
   *
   *   a rule broad enough to cover the second (`*`, say) swallows the first.
   *   so they are graded apart, and a widened ignore trips exactly one
   */
  given(
    '[case45] the ignore rules that stand between the mirror and a commit',
    () => {
      const scene = useBeforeAll(async () => {
        const db = genDbPath({ slug: 'eco-reachable' });

        // touch the store so the schema is real, then read the table set from
        // sqlite_master — the same source the dump walks. a hardcoded list here
        // would be a second place the fact lives, and it drifts one way only
        // (term=partial-audit)
        eco({
          db,
          verb: 'set',
          payload: { slug: 'bigrock://reach', sev: 'p1', urg: '1w', what: 'x' },
        });

        const tables: string[] = JSON.parse(
          execFileSync(
            'node',
            [
              '-e',
              `const { DatabaseSync } = require('node:sqlite');` +
                `const db = new DatabaseSync(process.argv[1]);` +
                `process.stdout.write(JSON.stringify(db.prepare(` +
                `"SELECT name FROM sqlite_master WHERE type = 'table' ` +
                `AND name NOT LIKE 'sqlite_%' ORDER BY rowid ASC").all().map((r) => r.name)));`,
              db,
            ],
            { encoding: 'utf8', timeout: 30_000 },
          ),
        );

        // the rules under test are the ones the STORE writes into a consumer's
        // `.eco/` — so the subject is a consumer, never this package's root
        const { root } = genConsumerRepo({ slug: 'eco-consumer-ignore' });

        /**
         * .what = ask git itself. exit 0 = ignored, 1 = trackable
         *
         * 🔴 `--no-index` is REQUIRED, and its absence is a silent pass.
         *
         *   by default `check-ignore` skips any path already in the index — so
         *   it answers "is this file tracked TODAY?" rather than "do the rules
         *   exclude this?". those are different questions, and the first one
         *   reports green for a store the rules plainly forbid, purely because
         *   one file happens to be staged right now
         *
         *   ⚠️ measured 2026-09-14: the first draft of this clamp omitted the
         *   flag, `*.csv` was planted, and [t1] PASSED — a clamp with no
         *   teeth, indistinguishable from a real one (term=false-report)
         *
         *   ⇒ the durable claim is about the RULES. a NEW table's mirror has
         *     never been tracked, so an index-aware read cannot see it excluded
         *     at all — which is the omission axis, exactly
         */
        const isIgnored = (relative: string) =>
          spawnSync('git', ['check-ignore', '--no-index', '-q', relative], {
            cwd: root,
            encoding: 'utf8',
            timeout: 30_000,
          }).status === 0;

        /**
         * .what = the SAME question, asked of the rules GIT CARRIES
         *
         * 🔴 `check-ignore` reads the work-tree's ignore files. a clone reads the
         *    ones git hands it, and the two diverge freely — an ignore file can
         *    be edited, or repaired, and never staged.
         *
         *   ⚠️ measured 2026-09-14, in a scratch repo:
         *
         *     committed .eco/.gitignore   *.db  *.csv     ← a clone loses the store
         *     work tree, repaired         *.db
         *     check-ignore --no-index  →  NOT ignored       ← [t1] PASSES
         *
         *   ⇒ so the extant read is complete over the scope it chose — my own
         *     work tree — and reports a verdict about GIT (term=partial-audit).
         *     the harm ships to every clone, and the local clamp reads green
         *
         * .how = rebuild the carried rules in a scratch repo and ask git there.
         *        the ruleset is DERIVED by a walk of the path's directory
         *        prefixes; a hardcoded pair is the same defect the table list was
         *
         * 🟡 the index, never HEAD. the claim under test is "after this commit
         *    lands, can a clone track the store" — and `git show :<path>` is what
         *    lands. a file git carries at no path contributes no rule, which is
         *    the permissive direction, and [t2]/[t3] grade that same direction
         */
        const isIgnoredAsGitCarriesIt = (relative: string): boolean => {
          const segments = relative.split('/').slice(0, -1);
          const rulefiles = [
            '.gitignore',
            ...segments.map((_, index) =>
              [...segments.slice(0, index + 1), '.gitignore'].join('/'),
            ),
          ];

          const sandbox = tempDirs.genOne({ slug: 'eco-carried-ignore' });
          execFileSync('git', ['init', '--quiet'], {
            cwd: sandbox,
            timeout: 30_000,
          });

          for (const path of rulefiles) {
            const carried = spawnSync('git', ['show', `:${path}`], {
              cwd: root,
              encoding: 'utf8',
              timeout: 30_000,
            });
            if (carried.status !== 0) continue; // git carries no such file
            mkdirSync(dirname(join(sandbox, path)), { recursive: true });
            writeFileSync(join(sandbox, path), carried.stdout);
          }

          return (
            spawnSync('git', ['check-ignore', '--no-index', '-q', relative], {
              cwd: sandbox,
              encoding: 'utf8',
              timeout: 30_000,
            }).status === 0
          );
        };

        return { tables, isIgnored, isIgnoredAsGitCarriesIt };
      });

      // ⚠️ the enumeration guards itself first. a table list that came back
      //    empty would make every claim below vacuously true — a clamp that
      //    grades naught and reports green
      then(
        '[t0] the table set is derived from the schema, and is not empty',
        () => {
          expect(scene.tables.length).toBeGreaterThan(1);
          expect(scene.tables).toContain('priority');
        },
      );

      then('[t1] every mirror the schema implies can be tracked by git', () => {
        const unreachable = scene.tables
          .map((table) => `.eco/${table}.csv`)
          .filter((path) => scene.isIgnored(path));

        if (unreachable.length)
          throw new Error(
            `[case45] git refuses to track part of the store.\n` +
              `  ignored: ${unreachable.join(', ')}\n` +
              `  fix:     drop the rule in .eco/.gitignore that matches them —\n` +
              `             git check-ignore --no-index -v ${unreachable[0]}\n` +
              `           names the file and line to remove\n` +
              `           ⚠️ --no-index is not optional. without it git skips any\n` +
              `             path already in the index and prints naught\n` +
              `  ⇒ the mirror is written correctly and reaches no commit. the` +
              ` other seven axes all pass in this state, because each runs` +
              ` against a temp db outside the repo`,
          );
      });

      // the converse, and the reason the invariant was written at all
      then('[t2] the derived db stays ignored', () => {
        if (!scene.isIgnored('.eco/priority.db'))
          throw new Error(
            `[case45] .eco/priority.db is trackable — the binary store can be committed.\n` +
              `  fix:   restore the binary CLASS to .eco/.gitignore —\n` +
              `           *.db\n           *.db-shm\n           *.db-wal\n` +
              `  ⇒ a committed sqlite reviews as \`Binary files differ\`, and a merge\n` +
              `    takes one side outright, which drops the other branch's rows`,
          );
      });

      // ⚠️ the temp peer the atomic dump renames from. a crash can strand one,
      //    and a partial mirror in git reads exactly like a complete one
      then('[t3] and a stranded temp peer stays ignored', () => {
        if (!scene.isIgnored('.eco/priority.csv.tmp'))
          throw new Error(
            `[case45] .eco/*.tmp is trackable — a half-written mirror can be committed.\n` +
              `  fix:   restore the temp class to .eco/.gitignore —\n` +
              `           *.tmp\n` +
              `  ⇒ the dump writes a temp peer then renames it. a crash strands the\n` +
              `    peer, and a stranded peer holds a PARTIAL store that reads in a\n` +
              `    diff exactly like a complete one — rows absent, no complaint`,
          );
      });

      /**
       * 🔴 [t4] — the teeth [t1] could not have. [t1] grades MY work tree; a
       *    clone gets what git carries, and a repair that was never staged is
       *    invisible to every reader but me
       *
       * ⚠️ [t2] and [t3] read the work tree, deliberately. they grade the
       *    CONTAMINATION direction — a binary or a half-written peer reaching a
       *    commit — and this axis is OMISSION. [t5]/[t6] ask the carried rules
       *    the contamination question
       */
      then(
        '[t4] and the rules GIT CARRIES also let every mirror through',
        () => {
          const unreachable = scene.tables
            .map((table) => `.eco/${table}.csv`)
            .filter((path) => scene.isIgnoredAsGitCarriesIt(path));

          if (unreachable.length)
            throw new Error(
              `[case45] the ignore rules git CARRIES exclude part of the store.\n` +
                `  ignored: ${unreachable.join(', ')}\n` +
                `  ⚠️ [t1] passes and this does not — so the rule was repaired in the\n` +
                `     work tree and never staged. the repair reaches no clone\n` +
                `  fix:     stage the ignore file, then re-run —\n` +
                `             rhx git.stage.add .eco/.gitignore\n` +
                `           to see the carried rule as a clone would:\n` +
                `             git show :.eco/.gitignore\n` +
                `  ⇒ a clone runs the store, writes the mirror, and git drops it in\n` +
                `    silence. the store loses a whole table per contributor, and\n` +
                `    every other clamp stays green because each runs on a temp db`,
            );
        },
      );

      /**
       * 🔴 [t5]/[t6] — the CONTAMINATION half, asked of the rules GIT CARRIES
       *
       * `[t2]` and `[t3]` grade the work tree, and the work tree is mine alone. a
       * clone gets what git carries, so a rule repaired here and never staged
       * protects nobody — and the local pair stays green the whole time.
       *
       * 🔴 the defect this catches is a carried rule that names ONE LITERAL
       *    FILE (`priority.db`) where the work tree names the class (`*.db`,
       *    `*.sqlite`, `*.tmp`). in a clone, `gate.db`, `.eco/other.db`, every
       *    `*.sqlite`, and every stranded `*.tmp` are then TRACKABLE — and a
       *    literal name is a blocker, since ECOWORK_DB takes any path. `[t2]`/
       *    `[t3]` stay green in that state, because they read the half of the
       *    world a clone never sees.
       *
       * 🟡 `[t2]`/`[t3]` are KEPT rather than converted. they are a second
       *    detector on the same defect, not a duplicate claim: the local pair
       *    catches a regression the moment it is typed, this pair catches one
       *    that never reached a clone. two cues cannot disagree — they can only
       *    both miss, or one catch (rule.require.a-cue-is-not-a-claim).
       */
      then('[t5] the rules GIT CARRIES keep the derived db ignored', () => {
        if (!scene.isIgnoredAsGitCarriesIt('.eco/priority.db'))
          throw new Error(
            `[case45] the ignore rules git CARRIES let the binary store be committed.\n` +
              `  ⚠️ [t2] passes and this does not — so the rule was widened in the\n` +
              `     work tree and never staged. the repair reaches no clone\n` +
              `  to see the carried rule as a clone would:\n` +
              `    git show :.eco/.gitignore\n` +
              `  fix:  rhx git.stage.add .eco/.gitignore\n` +
              `  ⚠️ if that refuses with \`globally blocked\`, this is a HUMAN GATE,\n` +
              `     never a code defect. do not debug it — ask:\n` +
              `       $ rhx git.commit.uses allow --global`,
          );
      });

      // 🔴 the sharper of the pair. a LITERAL name passes [t5] and fails here,
      //    which is the exact state measured on 2026-09-14
      then('[t6] and they ignore the binary CLASS, never one instance', () => {
        const instances = [
          '.eco/gate.db',
          '.eco/other.db',
          '.eco/priority.sqlite',
        ];
        const trackable = instances.filter(
          (path) => !scene.isIgnoredAsGitCarriesIt(path),
        );

        if (trackable.length)
          throw new Error(
            `[case45] the rules git CARRIES name an INSTANCE, never the class.\n` +
              `  trackable in a clone: ${trackable.join(', ')}\n` +
              `  ⇒ this brief's first enforcement clause strikes down a literal\n` +
              `    filename precisely because ECOWORK_DB takes any path — so a\n` +
              `    second store under any other name commits freely, and reviews\n` +
              `    as \`Binary files differ\` where a merge takes one side outright\n` +
              `  ⚠️ [t5] can PASS while this fails: \`priority.db\` alone satisfies\n` +
              `     the one path [t5] asks about, and covers no other\n` +
              `  fix:  rhx git.stage.add .eco/.gitignore   (the work tree already\n` +
              `        carries *.db, *.sqlite, *.tmp — it is the stage that lags)`,
          );
      });
    },
  );

  /**
   * 🔴 [case46] — the NINTH axis: the COMMIT PATH
   *
   * eight axes grade the store as a FILE. `[case45]` asks whether git would
   * TRACK it. none asks the last question on the road to a commit:
   *
   *   ⇒ **would the pre-commit hook let it through?**
   *
   * ⚠️ the class of defect: a hook that refuses a staged file for a reason
   *    true of snapshots and false of a data store — a timestamp check, say,
   *    when every row carries `set_at`. the store is then complete, trackable,
   *    and uncommittable, while every other axis reads green (term=partial-audit)
   *
   * .how  = a scratch consumer that holds ONLY the store, graded by every check
   *         THIS repo's pre-commit runs — the real scripts, derived from the
   *         hook, never a copy of a rule. a run in place would answer about
   *         whichever staged file sorts earliest, which is the wrong subject
   */
  given(
    '[case46] the pre-commit hook that stands between the store and a commit',
    () => {
      const scene = useBeforeAll(async () => {
        const root = join(__dirname, '..', '..', '..', '..', '..');
        const husky = join(root, '.husky');

        // 🔴 derive WHICH checks run, from pre-commit itself. a list written
        //    here would go stale the moment a check is added, and it would go
        //    stale silently — the clamp would report green over a gate it never
        //    ran (term=partial-audit)
        const checks = [
          ...new Set(
            [
              ...readFileSync(join(husky, 'pre-commit'), 'utf8').matchAll(
                /check\.[a-z.]+\.sh/g,
              ),
            ].map((hit) => hit[0]),
          ),
        ];

        // the store, written by the store into a consumer, then derived from
        // the filesystem rather than named by hand
        const { root: scratch, git } = genConsumerRepo({
          slug: 'eco-consumer-precommit',
        });
        const mirrors = readdirSync(join(scratch, '.eco')).filter((file) =>
          file.endsWith('.csv'),
        );

        // stage a fresh write, so the checks grade a store on its way IN
        eco({
          db: join(scratch, '.eco', 'priority.db'),
          verb: 'set',
          payload: { slug: 'bigrock://coverage', status: 'done' },
        });

        mkdirSync(join(scratch, '.husky'), { recursive: true });
        for (const check of checks)
          copyFileSync(join(husky, check), join(scratch, '.husky', check));

        git('add', '-A');

        // ⚠️ run the REAL hook, never a copy of its rule. a second copy drifts
        //    from the first, and the drift is invisible from either side
        const verdicts = checks.map((check) => {
          const run = spawnSync('bash', [join('.husky', check)], {
            cwd: scratch,
            encoding: 'utf8',
            timeout: 30_000,
          });
          return {
            check,
            status: run.status,
            out: `${run.stdout ?? ''}${run.stderr ?? ''}`.trim(),
          };
        });

        return { checks, mirrors, verdicts };
      });

      // ⚠️ both enumerations guard themselves. an empty check list or an empty
      //    mirror list would make the claim below vacuously true — a clamp that
      //    grades naught and reports green
      then(
        '[t0] pre-commit declares checks, and the store has mirrors to grade',
        () => {
          expect(scene.checks.length).toBeGreaterThan(0);
          expect(scene.mirrors.length).toBeGreaterThan(1);
        },
      );

      then(
        '[t1] the committed store passes every check pre-commit runs',
        () => {
          const refused = scene.verdicts.filter(
            (verdict) => verdict.status !== 0,
          );

          if (refused.length)
            throw new Error(
              `[case46] the pre-commit hook refuses the plaintext store.\n` +
                refused
                  .map((r) => `  ${r.check} exited ${r.status}\n    ${r.out}`)
                  .join('\n') +
                `\n  fix:   exempt the store in that check — it is a DATA STORE, not a\n` +
                `         snapshot. in .husky/check.timestamps.sh:\n` +
                `           case "$file" in\n` +
                `             *.ts | *.sh) continue ;;\n` +
                `             .eco/*) continue ;;\n` +
                `           esac\n` +
                `  ⇒ the store is complete, atomic, trackable, and UNCOMMITTABLE. the\n` +
                `    other eight axes all stay green in this state, because each\n` +
                `    grades the file and none grades the commit path`,
            );
        },
      );
    },
  );

  /**
   * 🔴 [case51] — the FIFTEENTH axis: the MERGE ATTRIBUTES
   *
   * `[case45]` grades `.gitignore` — "will git TRACK the mirror". an ATTRIBUTE
   * does different damage by a different mechanism, and no clamp graded it:
   *
   *   merge=ours     a merge silently DISCARDS the other branch's rows
   *   binary / -text `Binary files differ` on review AND a merge takes one side
   *   -diff          the diff shows naught, so review goes blind
   *   -merge         never auto-merges
   *
   * ⚠️ measured 2026-09-14, in a scratch repo, with `.eco/*.csv merge=ours`:
   *
   *     git said:  Auto-merging .eco/priority.csv
   *     exit:      0                    ← clean merge, NO conflict
   *     ⇒ the other branch's row was GONE
   *
   * 🔴 that is verbatim the failure this store's own `.gitignore` names as the
   *    reason the DB is not committed:
   *
   *      "cannot be merged (git resolves to one side and drops the other
   *       branch's rows, silently)"
   *
   *    — achieved on the TEXT, by one line, with no conflict and no complaint.
   *    so the mirror would be committed, reviewable, complete on disk, and
   *    still lose rows on every merge. all fourteen prior axes stay green.
   *
   * ✅ today this repo tracks NO `.gitattributes` at all, so the mirror runs on
   *    git's plain-text default. that is SAFE BY ABSENCE, never by design —
   *    no artifact states the requirement, so none would catch its violation.
   *
   * 🟡 the rule is named by HARM, never by surface. `text` / `eol=lf` are
   *    legitimate and even helpful; what may never be set is anything that
   *    breaks the merge or the diff.
   */
  given(
    '[case51] the git attributes that decide whether the mirror merges',
    () => {
      const scene = useBeforeAll(async () => {
        const db = genDbPath({ slug: 'eco-attributes' });
        eco({
          db,
          verb: 'set',
          payload: { slug: 'bigrock://attr', sev: 'p1', urg: '1w', what: 'x' },
        });

        const tables: string[] = JSON.parse(
          execFileSync(
            'node',
            [
              '-e',
              `const { DatabaseSync } = require('node:sqlite');` +
                `const db = new DatabaseSync(process.argv[1]);` +
                `process.stdout.write(JSON.stringify(db.prepare(` +
                `"SELECT name FROM sqlite_master WHERE type = 'table' ` +
                `AND name NOT LIKE 'sqlite_%' ORDER BY rowid ASC").all().map((r) => r.name)));`,
              db,
            ],
            { encoding: 'utf8', timeout: 30_000 },
          ),
        );

        const root = join(__dirname, '..', '..', '..', '..', '..');

        /**
         * .what = the attributes git would apply, as `name: path: value` lines
         * .why  = ask git, never a parse of our own. `check-attr` honors every
         *         source at once — each `.gitattributes` up the tree, plus
         *         `.git/info/attributes`, plus `core.attributesFile` — and the
         *         last two are LOCAL, so a hand parse of tracked files alone
         *         would report a verdict about a config it never read
         */
        const asAttributes = (relative: string): Record<string, string> => {
          const ran = spawnSync('git', ['check-attr', '-a', relative], {
            cwd: root,
            encoding: 'utf8',
            timeout: 30_000,
          });
          return Object.fromEntries(
            ran.stdout
              .split('\n')
              .filter((line) => line.includes(': '))
              .map((line) => line.split(': '))
              .map(([, name, value]) => [name!.trim(), value!.trim()]),
          );
        };

        return { tables, asAttributes };
      });

      // ⚠️ the enumeration guards itself. an empty table list would make the
      //    claim below vacuously true — a clamp that grades naught, green
      then(
        '[t0] the table set is derived from the schema, and is not empty',
        () => {
          expect(scene.tables.length).toBeGreaterThan(1);
          expect(scene.tables).toContain('priority');
        },
      );

      // 🔴 THE teeth. `.eco/*.csv merge=ours` lands here and nowhere else
      then('[t1] no attribute breaks the mirror MERGE', () => {
        const broken = scene.tables
          .map((table) => ({
            path: `.eco/${table}.csv`,
            attrs: scene.asAttributes(`.eco/${table}.csv`),
          }))
          .filter(({ attrs }) => {
            if (attrs.merge && attrs.merge !== 'unspecified') return true; // a driver picks a side
            if (attrs.text === 'unset') return true; // -text == binary
            return false;
          });

        if (broken.length)
          throw new Error(
            `[case51] a git attribute breaks the mirror's merge.\n` +
              broken
                .map(({ path, attrs }) => `  ${path}: ${JSON.stringify(attrs)}`)
                .join('\n') +
              `\n  ⇒ a merge driver picks ONE side, so the other branch's rows are\n` +
              `    dropped with NO conflict and NO complaint — verbatim the failure\n` +
              `    .eco/.gitignore names as the reason the DB is not committed,\n` +
              `    achieved on the TEXT. all fourteen other axes stay green\n` +
              `  fix:  drop the entry in .gitattributes that matches it —\n` +
              `          git check-attr -a ${broken[0]!.path}\n` +
              `        names every attribute in force. \`text\` and \`eol=lf\` are\n` +
              `        fine; a \`merge\` driver and \`-text\` are not`,
          );
      });

      // ⚠️ review is this store's whole case for text over the binary. an
      //    attribute that blinds the diff removes it without touching the merge
      then('[t2] and none blinds the mirror DIFF', () => {
        const blinded = scene.tables
          .map((table) => ({
            path: `.eco/${table}.csv`,
            attrs: scene.asAttributes(`.eco/${table}.csv`),
          }))
          .filter(({ attrs }) => attrs.diff === 'unset');

        if (blinded.length)
          throw new Error(
            `[case51] a git attribute blinds the mirror's diff.\n` +
              `  ${blinded.map(({ path }) => path).join(', ')}\n` +
              `  ⇒ \`-diff\` renders the store as \`Binary files differ\`. review is\n` +
              `    this invariant's whole case for text over the binary, so an\n` +
              `    unreviewable mirror keeps the cost of text and loses the benefit\n` +
              `  fix:  drop the \`-diff\` (or \`binary\`) entry that matches it`,
          );
      });
    },
  );

  /**
   * 🔴 [case52] — the SIXTEENTH axis: NO BINARY STORE IN THE INDEX
   *
   * every prior axis asks whether the TEXT is whole. this asks the converse,
   * and it is the invariant's own first enforcement clause:
   *
   *     "a `.db`, `.sqlite`, or other binary store COMMITTED to git = blocker"
   *
   * ⚠️ fifteen axes and not one graded it, because each runs against a temp db
   *    OUTSIDE the repo. the clause was asserted and never measured.
   *
   * 🔴 CAUGHT LIVE, 2026-09-14. this was staged for commit:
   *
   *     A  "[object Object]"        ← SQLite format 3, the priority table, 6 rows
   *
   *    a caller passed an OBJECT where `ECOWORK_DB` expects a path, node
   *    stringified it, and the store landed at the repo root.
   *
   * 🔴 why no ignore rule caught it — the rules bound the scope TWICE:
   *
   *     by directory   `.eco/`                    it sat at the ROOT
   *     by extension   `*.db` `*.sqlite` `*.tmp`  it had NO extension
   *
   *     git check-ignore --no-index -v '[object Object]'  → exit 1, NOT ignored
   *
   *    ⇒ `term=partial-audit` at the ignore layer. and the invariant already
   *      condemns a LITERAL filename because "ECOWORK_DB takes any path" — the
   *      repair widened the NAME and left the DIRECTORY fixed, so the same
   *      argument still holds against the rule that replaced it.
   *
   * 🟡 so this clamp names NO path, NO extension, and NO directory. it reads
   *    the file's own magic — `SQLite format 3\0`, at offset 0 — out of the
   *    INDEX, which is what the next commit lands. a store is caught wherever
   *    it sits, whatever it is called.
   *
   * ⚠️ offset 0 carries the whole check: a markdown brief that QUOTES the magic
   *    (this repo has several) holds the bytes and is not a store.
   */
  given(
    '[case52] the index, graded for a binary store at any path at all',
    () => {
      const scene = useBeforeAll(async () => {
        const root = join(__dirname, '..', '..', '..', '..', '..');
        const MAGIC = 'SQLite format 3\u0000';

        // narrow to files whose blob holds the magic ANYWHERE — fast, over the index.
        // ⚠️ the NUL is dropped from the NEEDLE, never from the test below: an argv
        //    string cannot hold a NUL byte, and a superset is all a narrow step owes
        const suspect = spawnSync(
          'git',
          ['grep', '--cached', '-l', '-e', 'SQLite format 3'],
          { cwd: root, encoding: 'utf8', timeout: 60_000 },
        );

        const candidates = suspect.stdout
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        // then demand the magic at OFFSET 0 — a quote of it is not a store.
        // 🔴 carry the BYTE COUNT out with the path, never the path alone.
        //    measured 2026-09-16: this repo's one stray store is literally
        //    NAMED `[object Object]` — a path built from an object that was
        //    never cast. so the refusal printed `"[object Object]"` and read
        //    exactly like a BROKEN RENDER of a real path, and four probes
        //    were spent to tell the two apart. a byte count cannot be
        //    produced by a bad render, so it settles the ambiguity in one
        //    glance (rule.forbid.ambiguous-labels)
        const stores = candidates.flatMap((path) => {
          const blob = spawnSync('git', ['cat-file', 'blob', `:${path}`], {
            cwd: root,
            encoding: 'latin1',
            timeout: 30_000,
          });
          if (blob.status !== 0 || !blob.stdout.startsWith(MAGIC)) return [];
          return [{ path, bytes: Buffer.byteLength(blob.stdout, 'latin1') }];
        });

        return { candidates, stores };
      });

      then('[t0] the probe reads the index, and the index is not empty', () => {
        const tracked = spawnSync('git', ['ls-files', '--cached'], {
          cwd: join(__dirname, '..', '..', '..', '..', '..'),
          encoding: 'utf8',
          timeout: 60_000,
        });
        expect(tracked.status).toEqual(0);
        expect(
          tracked.stdout.split('\n').filter((line) => line.trim()).length,
        ).toBeGreaterThan(0);
      });

      then('[t1] and no path in it is a sqlite store', () => {
        if (scene.stores.length)
          throw new Error(
            `[case52] a BINARY STORE is in the index, and would land in the commit.\n` +
              `${scene.stores
                .map(
                  (store: { path: string; bytes: number }) =>
                    `  "${store.path}"  (${store.bytes} bytes)\n`,
                )
                .join('')}` +
              `  ⇒ each begins with the bytes \`SQLite format 3\\0\`, so each is a\n` +
              `    sqlite database, whatever it is named. the store is DERIVED and\n` +
              `    never committed — the mirror is what git carries.\n` +
              `  ⚠️ a path that READS like a broken render is a real path. this\n` +
              `    repo's own stray store is NAMED \`[object Object]\` — built from\n` +
              `    an object that was never cast. the byte count beside each path\n` +
              `    is the tell: a bad render cannot produce one.\n` +
              `  ⚠️ no ignore rule covers these, and a wider \`.eco/.gitignore\` will\n` +
              `    not reach them: it is scoped to one DIRECTORY and a list of\n` +
              `    EXTENSIONS, and a stray store honours neither.\n` +
              `  fix:  git rm --cached -- '<path>'   then delete it, once you have\n` +
              `        confirmed its rows live in .eco/*.csv — a stray store can\n` +
              `        hold the ONLY copy of a row (measured 2026-09-14, and\n` +
              `        measured TRUE again 2026-09-16: the stray store here holds\n` +
              `        6 rows the mirror carries none of)`,
          );
      });
    },
  );

  /**
   * 🔴 [case53] — the SEVENTEENTH axis: THE CARRIED TEXT IS THE STORE
   *
   * sixteen axes prove the MACHINERY works. not one proves it RAN.
   *
   * every prior axis builds a temp db outside the repo, drives it, and grades
   * the result. so each answers "would a dump lose a row?" and none answers
   * the question the invariant actually asserts:
   *
   *   ⇒ **does the text git carries hold what this store holds, right now?**
   *
   * ⚠️ `[case52]` found the same blind spot from the other side — it caught a
   *    binary that got IN. this catches the text that never got in.
   *
   * 🔴 MEASURED 2026-09-14, and RED. the index carried 29 priority rows and 7
   *    gate rows; the store held 36 and 11. eleven rows — the whole
   *    `coachbook-dao` cluster and its four gate edges — sat in the work tree and
   *    in no commit at all. `git log -- .eco/priority.csv` returns zero
   *    commits, so the mirror has never reached HEAD by any route.
   *
   *    all sixteen prior axes were GREEN in that state. 284 of 284.
   *
   * 🟡 the two links, and they fail for different reasons:
   *
   *      db  -> disk    the dump. SELF-CORRECTS — it reruns on every write,
   *                     and a short db heals from the text on open
   *      disk -> index  the stage. PERSISTS — no code path closes it, so the
   *                     drift only ever grows
   *
   *    ⇒ the second is the one that loses data, and it is the one no clamp
   *      watched. it also needs no db, so a clone can check it cold.
   *
   * ⚠️ the table set is derived from the UNION of what git tracks and what is
   *    on disk — never a name list. a whole new table's mirror, written and
   *    never staged, is exactly the case a tracked-only walk cannot see.
   */
  given(
    '[case53] the text git carries, graded against the store on disk',
    () => {
      /**
       * .what = the carried-vs-disk report for one consumer repo
       * .why  = graded twice below: once on a consumer that committed its
       *         store, and once on one whose last write never staged — the
       *         second is the bite proof, and it must go red
       */
      const getCarriedReport = (root: string) => {
        const tracked = spawnSync('git', ['ls-files', '--cached', '.eco/'], {
          cwd: root,
          encoding: 'utf8',
          timeout: 30_000,
        });
        const trackedMirrors = tracked.stdout
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.endsWith('.csv'));

        const diskMirrors = existsSync(join(root, '.eco'))
          ? readdirSync(join(root, '.eco'))
              .filter((name) => name.endsWith('.csv'))
              .map((name) => `.eco/${name}`)
          : [];

        const mirrors = [
          ...new Set([...trackedMirrors, ...diskMirrors]),
        ].sort();

        // ⚠️ canonical by SORTED KEYS, so a key-order change is not read as a
        //    lost row. the compare is over whole rows, never a key column: a
        //    stale `why` under a live slug omits information just as a dropped
        //    row does, and a key-only compare calls that state clean
        const canon = (row: object): string =>
          JSON.stringify(
            Object.keys(row)
              .sort()
              .map((key) => [key, (row as Record<string, unknown>)[key]]),
          );

        const rowsOf = (text: string): string[] =>
          asCsvRows(text).map((row) => canon(row));

        const report = mirrors.map((path) => {
          const blob = spawnSync('git', ['cat-file', 'blob', `:${path}`], {
            cwd: root,
            encoding: 'utf8',
            timeout: 30_000,
          });
          const untracked = blob.status !== 0;
          const carried = untracked ? [] : rowsOf(blob.stdout);
          const disk = existsSync(join(root, path))
            ? rowsOf(readFileSync(join(root, path), 'utf8'))
            : [];

          const carriedSet = new Set(carried);
          return {
            path,
            untracked,
            disk: disk.length,
            carried: carried.length,
            omitted: disk.filter((row) => !carriedSet.has(row)).length,
          };
        });

        return { mirrors, report };
      };

      const scene = useBeforeAll(async () => {
        const committed = genConsumerRepo({ slug: 'eco-consumer-carried' });

        // the bite proof: one write after the commit, never staged
        const behind = genConsumerRepo({ slug: 'eco-consumer-behind' });
        eco({
          db: behind.db,
          verb: 'set',
          payload: {
            slug: 'bigrock://unstaged',
            what: 'a row in no commit',
            sev: 'p2',
            urg: '1m',
          },
        });

        return {
          ...getCarriedReport(committed.root),
          behind: getCarriedReport(behind.root),
        };
      });

      // ⚠️ the enumeration guards itself. an empty mirror set would make every
      //    claim below vacuously true — a clamp that grades naught, and is green
      then(
        '[t0] the mirror set is derived from git and disk alike, and is not empty',
        () => {
          expect(scene.mirrors.length).toBeGreaterThan(0);
          expect(scene.mirrors).toContain('.eco/priority.csv');
        },
      );

      then('[t1] every mirror on disk is tracked by git', () => {
        const untracked = scene.report.filter((entry) => entry.untracked);

        if (untracked.length)
          throw new Error(
            `[case53] part of the plaintext store is in NO commit and NO index.\n` +
              `  untracked: ${untracked.map((entry) => entry.path).join(', ')}\n` +
              `  ⇒ the mirror was written and git was never told about it, so a\n` +
              `    clone gets a store with that whole table absent. every other\n` +
              `    axis stays green, because each runs on a temp db outside the repo\n` +
              `  fix:  rhx git.stage.add ${untracked[0]?.path ?? '.eco/'}\n` +
              `  ⚠️ if that refuses with \`globally blocked\`, this is a HUMAN GATE,\n` +
              `     never a code defect. do not debug it — ask:\n` +
              `       $ rhx git.commit.uses allow --global`,
          );
      });

      then('[t2] and the text git carries omits no row the store holds', () => {
        const drifted = scene.report.filter((entry) => entry.omitted > 0);

        if (drifted.length)
          throw new Error(
            `[case53] the text git carries is BEHIND the plaintext store.\n` +
              drifted
                .map(
                  (entry) =>
                    `  ${entry.path}  disk=${entry.disk} carried=${entry.carried} omitted=${entry.omitted}`,
                )
                .join('\n') +
              `\n  ⇒ a clone, or a \`git checkout\`, rebuilds from the CARRIED text —\n` +
              `    so every omitted row is gone, with no error and no diff to read.\n` +
              `  ⚠️ an omission counts a whole ABSENT row and a row whose CONTENT\n` +
              `    drifted alike: a stale \`why\` under a live slug loses the reason\n` +
              `    as surely as a dropped row loses the priority.\n` +
              `  ⚠️ the dump self-corrects (it reruns on every write); the STAGE does\n` +
              `    not. no code path closes this gap — a human does.\n` +
              `  fix:  rhx git.stage.add .eco/\n` +
              `  ⚠️ if that refuses with \`globally blocked\`, this is a HUMAN GATE,\n` +
              `     never a code defect. do not debug it — ask:\n` +
              `       $ rhx git.commit.uses allow --global\n` +
              `     to see exactly which rows are at risk:\n` +
              `       git diff -- .eco/`,
          );
      });

      // 🔴 the teeth, proven. a detector that never goes red proves naught
      then('[t3] a write that never staged is caught as an omission', () => {
        const priority = scene.behind.report.find(
          (entry) => entry.path === '.eco/priority.csv',
        );
        expect(priority?.untracked).toEqual(false);
        expect(priority?.omitted).toBeGreaterThan(0);
      });
    },
  );

  /**
   * 🔴 .what = the TWENTIETH axis — ONLY ONE PROGRAM MAY OPEN THE STORE
   *
   * 🔴 .why  = every axis above grades `ecowork.db.mjs`. `[case40]` comes
   *            closest — it proves each WRITE VERB dumps — but it reads the
   *            module's own verb table, so it is blind by construction to a
   *            writer that lives in another file.
   *
   *   the dump is not a property of the database. it is a property of ONE
   *   code path. so a second program that opens `.eco/priority.db` and writes
   *   a row omits that row from the store COMPLETELY and PERMANENTLY — no
   *   dump runs, and the heal on the next open reads the db as authoritative
   *   and re-emits the row as though it had always been there.
   *
   *   ⇒ that is the purest form of the loss this invariant exists to refuse,
   *     and not one of the nineteen clamps above can see it.
   *
   * ✅ MEASURED 2026-09-14: exactly one production file opens the store, and
   *    it is the module. the shell layer (`eco.priority.sh`, `eco.seed.sh`,
   *    `ecowork.sh`) names `ECOWORK_DB` and shells out — it holds no sqlite
   *    call of its own. so this clamp is GREEN today and guards a drift.
   *
   * ⚠️ .why a drift clamp rather than a defect clamp
   *
   *    this repo has been bitten by ONE-WAY DRIFT twice, and both times the
   *    list was correct on the day it was written:
   *
   *      the hand-written table list   -> a fourth table would be omitted
   *      the extension exemption list  -> a new extension would be refused
   *
   *    nobody removes a writer. the move that happens is the reverse — a
   *    helper is added that opens the db "just to read", then grows a write.
   *    so the subject set here is DERIVED from a directory walk, never named
   *    (term=partial-audit).
   */
  given(
    '[case56] the set of programs that may open the store, derived by a walk',
    () => {
      const scene = useBeforeAll(async () => {
        const root = join(__dirname, '..'); // .../role=prioritizer/skills

        const walk = (dir: string): string[] =>
          readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
            const full = join(dir, entry.name);
            if (entry.isDirectory())
              return entry.name === '__snapshots__' ? [] : walk(full);
            return [full];
          });

        // ⚠️ a test file opens databases on purpose, in temp dirs it owns. it is
        //    excluded by SHAPE (`.test.ts`), never by name
        const prod = walk(root).filter(
          (path) => /\.(sh|mjs|js|ts)$/.test(path) && !/\.test\.ts$/.test(path),
        );

        // 🔴 the CODE is graded, never the prose. a comment that names
        //    `node:sqlite` to explain why the module silences its notice opens
        //    no db, and a scan of raw text reads it as a second door
        const asCodeOnly = (text: string): string =>
          text
            .split('\n')
            .filter((line) => !/^\s*(#|\/\/|\*|\/\*)/.test(line))
            .join('\n');

        // 🔴 `sqlite3` is matched as a PACKAGE SPECIFIER — `'sqlite3'` — never as
        //    a bare word. the store writes `'*.sqlite3'` into its ignore rules,
        //    and a word match reads that file-class glob as a second door
        const opens = prod.filter((path) =>
          /node:sqlite|DatabaseSync|['"`]sqlite3['"`]/.test(
            asCodeOnly(readFileSync(path, 'utf8')),
          ),
        );

        const rel = (path: string) => path.slice(root.length + 1);
        return { prod: prod.map(rel), opens: opens.map(rel) };
      });

      // ⚠️ the walk guards ITSELF. a broken walk finds no file, so the claim in
      //    [t1] would hold vacuously and report a clean bill over an empty set —
      //    the same trap [case52][t0] and [case53][t0] each close for their own
      //    derivation
      then('[t0] the walk reaches the real production surface', () => {
        expect(scene.prod.length).toBeGreaterThanOrEqual(4);
        expect(scene.prod).toContain('eco.priority.sh');
        expect(scene.prod).toContain('work/ecowork.sh');
        expect(scene.prod).toContain('work/ecowork.db.mjs');
      });

      then(
        '[t1] and exactly one program opens the store, and it is the module',
        () => {
          if (
            scene.opens.length !== 1 ||
            scene.opens[0] !== 'work/ecowork.db.mjs'
          )
            throw new Error(
              `[case56] the store has more than one door.\n` +
                `  opens the db: ${scene.opens.join(', ') || '(none — see below)'}\n` +
                `  scanned:      ${scene.prod.length} production files\n` +
                `  ⇒ the dump is a property of ONE CODE PATH, never of the database.\n` +
                `    a second program that writes a row omits it from the store\n` +
                `    completely and permanently: no dump runs, and the heal on the\n` +
                `    next open reads the db as authoritative and re-emits the row as\n` +
                `    though the text had always held it. no other clamp sees this —\n` +
                `    [case40] grades the module's OWN verb table.\n` +
                `  fix:  route the new caller through \`ecowork.db.mjs <verb> <db>\`\n` +
                `        so its write lands inside the transaction the dump follows.\n` +
                `        if it truly only READS, it still must not open the db —\n` +
                `        read \`.eco/<table>.csv\`, which IS the store`,
            );
        },
      );
    },
  );
});
