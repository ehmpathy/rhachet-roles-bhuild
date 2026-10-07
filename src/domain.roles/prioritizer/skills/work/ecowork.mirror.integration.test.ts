/**
 * .what = clamps on the plaintext mirror — its schema, its bytes, its tears, its keys
 *
 * .note = a PART of the `ecowork.db` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in ecowork.harness.ts.
 */
import { execFileSync, spawnSync } from 'child_process';
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { dirname, join } from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import {
  asCsvRows,
  asCsvText,
  asTextShape,
  eco,
  genDbPath,
  getStoreEdges,
  getStoreRows,
  PATH_ECOWORK_DB,
  readEcoworkDbWhole,
} from './ecowork.harness';

afterAll(() => tempDirs.delAll());

describe('ecowork.db', () => {
  // 🔴 .why the mirror is clamped
  //    the plaintext IS the store; the sqlite file is a derived cache
  //    (define.invariant.eco.the-store-is-plaintext-in-git). every failure
  //    below is silent: the db keeps answers correct while the record git
  //    holds drifts away from it, and nobody learns until a restore
  given('[case29] the plaintext mirror beside the db', () => {
    const db = genDbPath({ slug: 'eco-mirror' });
    const mirror = {
      priority: join(dirname(db), 'priority.csv'),
    };

    /** .what = the opine a NEW row owes, so the mirror is the only variable */
    const asNew = (payload: object) => ({ sev: 'p2', urg: '1w', ...payload });

    /** .what = read one csv dump back as rows */
    const asRows = (file: string) => getStoreRows(file);

    when('[t0] rows are written through the store', () => {
      // ⚠️ wrapped in an object rather than returned bare — useThen hands
      //    back a proxy, and a proxy over an array does not forward `.map`
      const dumped = useThen('the writes land and dump', () => {
        eco({
          db,
          verb: 'set',
          payload: asNew({ slug: 'bigrock://zulu', what: 'last by slug' }),
        });
        eco({
          db,
          verb: 'set',
          payload: asNew({ slug: 'bigrock://alpha', what: 'first by slug' }),
        });
        eco({
          db,
          verb: 'set',
          payload: asNew({
            slug: 'bigrock://mike',
            what: 'middle',
            gates: ['bigrock://zulu'],
          }),
        });
        return {
          rows: asRows(mirror.priority),
          // ⚠️ `gate.csv` was RENAMED to `goal_orchestration.csv`, its columns
          //   `gater,gated` to `before,after`, and its endpoints are now goal
          //   UUIDs (setStoreFilesRenamed). a raw read of the old name finds
          //   an absent file and grades an empty set, which reads as a pass
          edges: getStoreEdges({
            dir: dirname(db),
            file: 'goal_orchestration.csv',
            from: 'before',
            to: 'after',
          }),
        };
      });

      then('every row is in the plaintext dump', () => {
        expect(dumped.rows.map((row) => row.slug).sort()).toEqual([
          'bigrock://alpha',
          'bigrock://mike',
          'bigrock://zulu',
        ]);
      });

      // 🔴 the teeth: order is the whole reason this file is reviewable.
      //    an unsorted dump churns line order on every write, so the diff
      //    shows the whole file and the one field that moved is invisible
      then('the dump is slug-sorted, so a diff carries signal alone', () => {
        expect(dumped.rows.map((row) => row.slug)).toEqual([
          'bigrock://alpha',
          'bigrock://mike',
          'bigrock://zulu',
        ]);
      });

      // the edge carries its own set_at stamp, so the PAIR is read rather
      // than the whole row — a clamp on a timestamp fails once a second
      then('the gate edges are mirrored beside the rows', () => {
        expect(dumped.edges).toEqual([['bigrock://mike', 'bigrock://zulu']]);
      });
    });

    // 🔴 THE teeth. this is the claim that makes the csv the store rather
    //    than a report: delete the db, and the rows come back. if this ever
    //    goes green with the restore removed, the mirror is decoration
    when('[t1] the derived db is deleted and the store is reopened', () => {
      const restored = useThen('the rows return from plaintext', () => {
        rmSync(db, { force: true });
        rmSync(`${db}-shm`, { force: true });
        rmSync(`${db}-wal`, { force: true });
        return eco({ db, verb: 'get', payload: {} });
      });

      then('every row is restored', () => {
        expect(
          restored.priorities.map((row: { slug: string }) => row.slug).sort(),
        ).toEqual(['bigrock://alpha', 'bigrock://mike', 'bigrock://zulu']);
      });

      then('the columns survive the round trip, not just the slugs', () => {
        const alpha = restored.priorities.find(
          (row: { slug: string }) => row.slug === 'bigrock://alpha',
        );
        expect(alpha.what).toEqual('first by slug');
      });

      // the edge is a separate table, so a restore that forgets it loses
      // every orchestration fact while the rows read perfectly healthy
      then('the gate edges are restored too', () => {
        const mike = restored.priorities.find(
          (row: { slug: string }) => row.slug === 'bigrock://mike',
        );
        expect(mike.gates).toEqual(['bigrock://zulu']);
      });
    });

    // 🔴 a restore into a LIVE db must decide which side wins, and this
    //    case used to answer "the db" — the mirror seeds a cold cache and
    //    never merges into a warm one.
    //
    //    that answer is INVERTED now, and deliberately. the text is the
    //    store and the db is its cache
    //    (define.invariant.eco.the-csv-is-truth-the-db-is-a-cache), so a
    //    text edit is a human's committed work and a db that overruled it
    //    would revert that work with no word — the exact defect that
    //    retired `setStoreHealed`:
    //
    //      "on an edit made in git the two were NEITHER behind, and its
    //       guess reverted a human's committed work."
    //
    //    ⇒ so the claim is rewritten rather than repaired. a clamp on the
    //      old direction grades a store that would be WRONG
    //
    // ⚠️ the fixture also wrote JSONL into a `.csv`. that lands as a header
    //    line and zero rows, so the read returned an empty set and the
    //    assertion died on `priorities[0]` — a fixture that stages no state
    //    at all, which is why the mirror is now written through `asCsvText`
    when(
      '[t2] a hand-edited mirror sits beside a db that already holds rows',
      () => {
        const held = useThen('the text speaks and the cache conforms', () => {
          eco({
            db,
            verb: 'set',
            payload: { slug: 'bigrock://alpha', what: 'edited in the db' },
          });

          // the EDIT-IN-GIT shape: the same row, one field changed, written
          // in the store's own format so every other column stays honest
          const rows = asCsvRows(readFileSync(mirror.priority, 'utf8'));
          writeFileSync(
            mirror.priority,
            asCsvText(
              rows.map((row) =>
                row.slug === 'bigrock://alpha'
                  ? { ...row, what: 'edited in git' }
                  : row,
              ),
            ),
          );

          return eco({ db, verb: 'get', payload: { slug: 'bigrock://alpha' } });
        });

        // 🔴 THE teeth. with the direction flipped back, a human's committed
        //    edit is silently reverted by the cache it was meant to seed
        then('the text wins, and the warm cache conforms to it', () => {
          expect(held.priorities[0].what).toEqual('edited in git');
        });

        // and the win is a CONFORM, never a merge — the db holds one alpha,
        // not the git one beside the one it had
        then('and it is one row, never a merge of the two', () => {
          expect(held.priorities.length).toEqual(1);
        });
      },
    );
  });

  // 🔴 [case36] + [case37] LIVE ELSEWHERE — `ecoworkGain.integration.test.ts`
  //
  //    they are the regression proof for `F1` (gain sums UP, never down —
  //    `#389` reverses `#386` by name), and THIS file is held out of the
  //    required gate (`jest.integration.config.ts:40`). so the one proof
  //    that the reversal holds ran in no gate at all, and a refactor could
  //    restore down-propagation and ship green.
  //
  //    ⚠️ the hold-out is a WHOLE-FILE exclusion over a PART-FILE defect —
  //    18 of 46 families here are red, and these two were never among them.
  //    the other 26 green families are still dark; that is deferred as a
  //    dream rather than solved, since a per-family split misclassified
  //    turns the required gate red.
  //
  //    ⇒ found by peer `enroll-impl-arch-defects` at i004, which connected
  //      the ratchet decision to `F1`'s proof — a link no round had drawn.

  // 🔴 .why the mirror's COVERAGE is clamped apart from its behavior
  //    [case29] proves the three tables it names round-trip. it cannot
  //    prove that three is all of them — it asks about `priority`, `gate`,
  //    and `serve` by hand, so a FOURTH table added to SCHEMA passes it
  //    untouched.
  //
  //    that is a term=partial-audit in a clamp: a suite complete over the
  //    subject set it chose, read as a verdict about the store. and the
  //    defect it lets through is the worst one this store has — the db
  //    answers correctly, git holds naught of the new table, and a fresh
  //    clone loses it whole with no error at any step.
  //
  //    ⇒ so every claim below ENUMERATES from the schema rather than from
  //      a list. what cannot be named cannot be forgotten
  given(
    '[case38] the mirror, graded against the schema rather than a list',
    () => {
      const db = genDbPath({ slug: 'eco-mirror-coverage' });

      // ⚠️ a slug IS its goal uri (rule.require.rock-goal-treestruct)
      const WHOLE_ROOT = 'bigrock://coverage';
      const OTHER_ROOT = 'altrock://speed';
      const BLOCKER_ROW = 'bigrock://prereq';
      const RICH_ROW = 'subrock://coverage/part';

      /** .what = every table the live db declares, straight out of sqlite */
      const getAllTables = (): string[] =>
        JSON.parse(
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
        );

      /**
       * .what = one table's rows in a content-derived order
       * .why  = the db yields insertion order and the dump yields key order,
       *         so a raw compare goes red on a difference that is no defect.
       *         ⚠️ sort by the row's own json rather than by a named key —
       *         a named key is the hardcode this whole case exists to refuse
       */
      const asSorted = (rows: object[]): object[] =>
        [...rows].sort((a, b) =>
          JSON.stringify(a) < JSON.stringify(b) ? -1 : 1,
        );

      /** .what = every row of one table, as the db holds it */
      const getAllRows = (table: string): object[] =>
        JSON.parse(
          execFileSync(
            'node',
            [
              '-e',
              `const { DatabaseSync } = require('node:sqlite');` +
                `const db = new DatabaseSync(process.argv[1]);` +
                `process.stdout.write(JSON.stringify(db.prepare('SELECT * FROM ' + process.argv[2]).all()));`,
              db,
              table,
            ],
            { encoding: 'utf8', timeout: 30_000 },
          ),
        );

      /** .what = the csv twin of one table, parsed back */
      const getAllMirrored = (table: string): object[] => {
        const path = join(dirname(db), `${table}.csv`);
        return getStoreRows(path);
      };

      const scene = useBeforeAll(async () => {
        // a row that exercises EVERY axis the store holds — opine, cash,
        // time, refs, goal, gate, serve — so a column dropped anywhere is a
        // column the round trip below can see go absent
        eco({
          db,
          verb: 'set',
          payload: {
            slug: WHOLE_ROOT,
            what: 'the root a part advances',
            why: 'so the mirror has a parent to carry',
            sev: 'p1',
            urg: '1w',
          },
        });
        // a SECOND root, so the serve edge below records a parent the path
        // cannot express. a surgoal that merely repeats the path is refused,
        // and rightly — it would be a second home for one fact
        eco({
          db,
          verb: 'set',
          payload: {
            slug: OTHER_ROOT,
            what: 'a second root the same part advances',
            sev: 'p2',
            urg: '1m',
          },
        });

        // a prerequisite that is NOT a part of the root, so the gate edge is
        // a real record rather than a second copy of the part→whole fact the
        // store already derives from the goal path
        eco({
          db,
          verb: 'set',
          payload: {
            slug: BLOCKER_ROW,
            what: 'a prerequisite outside the tree',
            sev: 'p3',
            urg: '1m',
          },
        });
        eco({
          db,
          verb: 'set',
          payload: {
            slug: RICH_ROW,
            what: 'a row with every axis populated',
            why: 'so an omitted column is visible rather than plausible',
            sev: 'p2',
            urg: '1m',
            kind: 'solve',
            gainCash: 'USD 250.00',
            costTime: '3d',
            refTask: ['ehmpathy/sandpine-notebook#1'],
            gates: [BLOCKER_ROW],
            surgoal: [OTHER_ROOT],
            // 🔴 the SPONSORSHIP axis. without it `goal_sponsorship` is a
            //   table with a csv twin and zero rows, so [t2] and [t3] grade
            //   an empty set against an empty set and report a pass — the
            //   exact vacuous green [t4] exists to refuse. a who and a why
            //   are mandatory: an unsigned sponsorship is refused outright
            sponsored: true,
            sponsorWho: 'the clamp',
            sponsorWhy: 'so the sponsorship table holds a row to mirror',
          },
        });

        const tables = getAllTables();
        const dbRows = Object.fromEntries(
          tables.map((t) => [t, asSorted(getAllRows(t))]),
        );
        const textRows = Object.fromEntries(
          tables.map((t) => [t, asSorted(getAllMirrored(t))]),
        );

        // the ROUND TRIP: throw the cache away, reopen from plaintext alone,
        // and dump again. what comes back out is graded against what went in
        rmSync(db, { force: true });
        rmSync(`${db}-shm`, { force: true });
        rmSync(`${db}-wal`, { force: true });
        eco({ db, verb: 'get', payload: {} });

        return {
          tables,
          dbRows,
          textRows,
          tablesAfter: getAllTables(),
          dbRowsAfter: Object.fromEntries(
            getAllTables().map((t) => [t, asSorted(getAllRows(t))]),
          ),
        };
      });

      // 🔴 THE teeth on the TABLE axis. add a table to SCHEMA and forget the
      //    mirror, and this is the one claim that goes red — every other
      //    clamp in this suite stays green, because none of them knows the
      //    new table exists
      then(
        '[t0] every table the schema declares has a csv twin on disk',
        () => {
          const absent = scene.tables.filter(
            (t: string) => !existsSync(join(dirname(db), `${t}.csv`)),
          );
          expect(absent).toEqual([]);
        },
      );

      // a sanity floor under [t0] — a schema read that returned an empty set
      // would satisfy "every table has a twin" while it graded naught
      then(
        '[t1] and the enumeration found real tables, never an empty set',
        () => {
          expect(scene.tables.length).toBeGreaterThanOrEqual(3);
          expect(scene.tables).toContain('priority');
        },
      );

      // 🔴 THE teeth on the ROW axis, per table, derived. a row the dump
      //    filters out is a row git never sees, while the db still holds it
      //    and reports it — so the drift is invisible from every surface
      //
      //    ⚠️ the db side is rendered AS TEXT for this one compare, and only
      //    this one. a csv cannot hold a number, so `quant_asks: 1` arrives
      //    back as `'1'` — the transport's type erasure, never a lost row
      //    (asTextShape). [t3] below keeps the RAW compare, db against db,
      //    which is what grades the restore's type recovery
      then(
        '[t2] each table csv holds exactly the rows its db table holds',
        () => {
          for (const table of scene.tables) {
            expect({ table, rows: scene.textRows[table] }).toEqual({
              table,
              rows: asTextShape(scene.dbRows[table]!),
            });
          }
        },
      );

      // 🔴 THE teeth on the COLUMN axis, and the strongest single claim here:
      //    the db is rebuilt from the plaintext ALONE, and the rebuilt tables
      //    equal the originals. a column dropped on the dump side, or on the
      //    restore side, or a table skipped on either, all land here
      then(
        '[t3] a rebuild from plaintext alone reproduces every table, whole',
        () => {
          expect(scene.tablesAfter).toEqual(scene.tables);
          for (const table of scene.tables) {
            expect({ table, rows: scene.dbRowsAfter[table] }).toEqual({
              table,
              rows: scene.dbRows[table],
            });
          }
        },
      );

      // the axes above are only teeth if the fixture actually populated them.
      // an empty `serve` table round-trips perfectly and proves naught
      then(
        '[t4] and the fixture put rows in every table, so the claims bite',
        () => {
          for (const table of scene.tables) {
            // an ABSENT table holds zero rows, so it fails this claim rather than
            // throws — the diff then names the table, which a throw would not
            expect({
              table,
              held: (scene.dbRows[table] ?? []).length > 0,
            }).toEqual({
              table,
              held: true,
            });
          }
        },
      );
    },
  );

  /**
   * .what = the TYPE axis — every column the schema declares must hold a
   *         value json can carry back out unchanged
   *
   * 🔴 .why = the four axes above prove the mirror wrote every TABLE and
   *         every COLUMN, on every VERB, and that it FINISHED. all four can
   *         hold while the value in the file is not the value in the db.
   *
   *         a `BLOB` column is the case that bites. node:sqlite hands back a
   *         Uint8Array; `JSON.stringify` turns it into `{"0":104,"1":105}`
   *         and throws naught; the restore writes that object back through a
   *         bind, as a string. ⇒ the dump exits 0, the row counts match, the
   *         column is present in both, every clamp above stays green — and
   *         git holds a store whose bytes are gone.
   *
   *         ⇒ so the schema is enumerated one more time, on the one property
   *           the other four never read: what the column can HOLD.
   *
   * ⚠️ .the allowlist below is NOT the hardcode this invariant bans. the
   *    banned list is one of OUR schema's CONTENTS — it grows each time we
   *    add a table, and drifts because nobody remembers to. this one is of
   *    JSON's CAPABILITIES, which the format fixed long ago and which grow
   *    never. the subject set is still derived from `sqlite_master`; the
   *    allowlist is only what each derived column is then graded against
   */
  given('[case42] every column type the schema declares', () => {
    const db = genDbPath({ slug: 'eco-type-coverage' });

    /**
     * .what = the types a json mirror round-trips with no loss
     * ⚠️ deliberately narrow. `NUMERIC` is excluded because its affinity
     *    lets one column hold both a number and a string, so what comes back
     *    depends on the row rather than the schema — and a clamp cannot
     *    grade a promise the schema does not make
     */
    const TYPES_LOSSLESS = ['TEXT', 'INTEGER', 'REAL'];

    /** .what = every (table, column, declared type) the live db holds */
    const getAllColumns = (): { table: string; name: string; type: string }[] =>
      JSON.parse(
        execFileSync(
          'node',
          [
            '-e',
            `const { DatabaseSync } = require('node:sqlite');` +
              `const db = new DatabaseSync(process.argv[1]);` +
              `const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ` +
              `AND name NOT LIKE 'sqlite_%' ORDER BY rowid ASC").all().map((r) => r.name);` +
              `const out = [];` +
              `for (const table of tables)` +
              `  for (const col of db.prepare('PRAGMA table_info(' + table + ')').all())` +
              `    out.push({ table, name: col.name, type: col.type });` +
              `process.stdout.write(JSON.stringify(out));`,
            db,
          ],
          { encoding: 'utf8', timeout: 30_000 },
        ),
      );

    const scene = useBeforeAll(async () => {
      // one write, so the db and its full schema exist to enumerate
      eco({
        db,
        verb: 'set',
        payload: {
          slug: 'bigrock://type-row',
          what: 'a row so the schema exists',
          sev: 'p2',
          urg: '1w',
        },
      });
      return { columns: getAllColumns() };
    });

    // guard the guard — an enumeration that found naught grades naught, and
    // hands back a clean bill over an empty subject set (term=partial-audit)
    then('[t0] the enumeration found real columns across real tables', () => {
      expect(scene.columns.length).toBeGreaterThan(10);
      expect(new Set(scene.columns.map((c) => c.table)).size).toBeGreaterThan(
        1,
      );
    });

    // 🔴 THE clamp. a column of any other type cannot round-trip, and the
    //    failure names its own repair rather than a bare report of the set
    then(
      '[t1] every declared column type round-trips through json intact',
      () => {
        const broken = scene.columns.filter(
          (c) => !TYPES_LOSSLESS.includes((c.type || '').toUpperCase()),
        );
        if (broken.length)
          throw new Error(
            `[case42] the schema declares a column the json mirror cannot carry:\n` +
              broken
                .map(
                  (c) =>
                    `  ${c.table}.${c.name} — type '${c.type || '(none)'}'`,
                )
                .join('\n') +
              `\n  use one of: ${TYPES_LOSSLESS.join(' ')}\n` +
              `  ⇒ a type outside that set dumps without an error and restores a` +
              ` different value, so git holds a store that lies`,
          );
        expect(broken).toEqual([]);
      },
    );

    // .why the exclusion is measured rather than assumed. this runs the real
    // serializer over the real shape node:sqlite returns for a BLOB, so the
    // allowlist above rests on an observation rather than on a belief
    then(
      '[t2] and a BLOB is excluded for a measured reason — it corrupts quietly',
      () => {
        const bytes = new Uint8Array([104, 105]); // what node:sqlite hands back
        const throughJson = JSON.parse(JSON.stringify(bytes));

        // 🔴 the hazard in one line: it did NOT throw, and it is no longer bytes
        expect(throughJson).toEqual({ 0: 104, 1: 105 });
        expect(throughJson instanceof Uint8Array).toEqual(false);

        // ⚠️ contrast — a 64-bit INTEGER beyond the safe range comes back as a
        //    BigInt, and that one at least fails LOUD. the quiet case is worse,
        //    which is why the clamp above is static rather than a round-trip
        expect(() =>
          JSON.stringify({ big: BigInt(2) ** BigInt(70) }),
        ).toThrow();
      },
    );
  });

  /**
   * .what = the ATOMICITY axis — no reader may ever see a half-written store
   *
   * 🔴 .why = `writeFileSync` on an extant path TRUNCATES it, then writes.
   *         that is two operations, and a crash between them leaves the file
   *         that IS the store in one of three torn shapes:
   *
   *           cut MID-LINE     -> invalid json, the restore throws. loud
   *           cut AT A NEWLINE -> 🔴 valid csv, rows absent, no complaint
   *           cut AT BYTE ZERO -> 🔴 an EMPTY file. the whole store, gone
   *
   *         ⚠️ the truncate lands FIRST, so shape three is not a corner — it
   *         is the first state of every rewrite. there is a real instant, on
   *         every dump, where the committed store holds naught.
   *
   *         ⇒ a temp peer plus a rename removes that instant entirely. posix
   *           rename is atomic within one directory: the old complete file,
   *           or the new complete file, and never neither
   */
  given('[case43] the mirror write, torn by a crash mid-dump', () => {
    const db = genDbPath({ slug: 'eco-atomic-write' });
    const asText = (table: string) =>
      readFileSync(join(dirname(db), `${table}.csv`), 'utf8');

    const scene = useBeforeAll(async () => {
      eco({
        db,
        verb: 'set',
        payload: {
          slug: 'bigrock://row-a',
          what: 'the first row',
          sev: 'p1',
          urg: '1w',
        },
      });
      eco({
        db,
        verb: 'set',
        payload: {
          slug: 'bigrock://row-b',
          what: 'the second row',
          sev: 'p2',
          urg: '1w',
        },
      });

      const settled = readdirSync(dirname(db));

      // 🔴 the WORST torn shape, reproduced exactly: the truncate landed and
      //    the write never did. this is what an un-atomic dump leaves behind
      //    at byte zero, and it is a valid, readable file that reads complete
      writeFileSync(join(dirname(db), 'priority.csv'), '');

      const read = eco({ db, verb: 'get', payload: {} });
      return {
        settled,
        healed: asText('priority'),
        read,
        module: readEcoworkDbWhole(),
      };
    });

    // a crash can strand a temp, so it must be unreachable by a commit —
    // a partial mirror in git reads exactly like a complete one
    then('[t0] a settled dump leaves no temp behind', () => {
      expect(scene.settled.filter((f) => f.endsWith('.tmp'))).toEqual([]);
    });

    // 🔴 THE clamp, and it is STATIC on purpose. atomicity is a property of
    //    the MECHANISM — a behavioral test cannot observe the window it
    //    closes, because the window is what a crash would have to land in.
    //    so grade the mechanism: a mirror path is reached only via a rename
    then('[t1] the dump reaches a mirror path only through a rename', () => {
      const dump = /const setStoreDumped[\s\S]*?\n};/.exec(scene.module);
      if (!dump)
        throw new Error('[case43] could not find setStoreDumped to grade');

      // ⚠️ the named-fix check runs FIRST, on purpose. a bare `toContain`
      //    that fires ahead of it hands the reader a 40-line diff of the
      //    whole function and no instruction — the exact symptom-only error
      //    `rule.require.errors-name-the-fix` exists to refuse
      const writesDirect = /writeFileSync\(\s*path\s*,/.test(dump[0]);
      const renames = dump[0].includes('renameSync(temp, path)');
      if (writesDirect || !renames)
        throw new Error(
          `[case43] setStoreDumped does not write its mirror atomically.\n` +
            `  found: ${writesDirect ? 'a direct writeFileSync(path, …)' : 'no renameSync(temp, path)'}\n` +
            `  fix:   write a temp peer, then rename it over the path —\n` +
            `           const temp = \`\${path}.tmp\`;\n` +
            `           writeFileSync(temp, text);\n` +
            `           renameSync(temp, path);\n` +
            `  ⇒ a direct write TRUNCATES first, so a crash mid-dump leaves the` +
            ` committed store empty — and an empty csv reads as a real one`,
        );
      expect(dump[0]).toContain('writeFileSync(temp, text)');
    });

    // 🔴 the second line of defence — a store torn to EMPTY comes back, so
    //    long as the db is still there to speak for it.
    //
    //    a zero-byte file is NOT the text that states "zero rows". it carries
    //    no header, so it names no columns and makes no statement at all — it
    //    has NOT SPOKEN, which is the same verdict `ABSENT is not EMPTY`
    //    reaches for a deleted file, and for the same reason.
    //
    //    ⚠️ this was a REAL store defect until 2026-09-16, not merely a
    //    stale clamp: `voiced` tested `existsSync` alone, so a torn file was
    //    read as a deliberate empty and TRUNCATED the table. measured on the
    //    three shapes in `.temp/probe-torn.mjs`; the repair is `asSpoken`,
    //    which tests for a readable header (rule.require.clamp-edge-cases)
    //
    // ⚠️ and the assertion was written against the retired JSONL format —
    //    `'"slug":"row-a"'` matches no csv, so it could not have gone green
    //    even once the store was right
    then('[t2] and a mirror torn to empty is rebuilt by the next open', () => {
      expect(
        asCsvRows(scene.healed)
          .map((row) => row.slug)
          .sort(),
      ).toEqual(['bigrock://row-a', 'bigrock://row-b']);
      expect(
        scene.read.priorities.map((r: { slug: string }) => r.slug).sort(),
      ).toEqual(['bigrock://row-a', 'bigrock://row-b']);
    });

    // 🔴 the BOUND on the repair above, and it is the half that keeps it
    //    honest: a file WITH its header and no data rows is a real statement
    //    — the text declares "zero rows" — and it must still empty the table.
    //    a fix that swallowed this one would make "empty this table" an
    //    unexpressible act, which is a worse defect than the one it cured
    then(
      '[t3] but a mirror with its HEADER and no rows still empties it',
      () => {
        const dbEmpty = genDbPath({ slug: 'eco-atomic-write-empty' });
        const dirEmpty = dirname(dbEmpty);
        eco({
          db: dbEmpty,
          verb: 'set',
          payload: {
            slug: 'bigrock://row-c',
            what: 'a row to empty',
            sev: 'p1',
            urg: '1w',
          },
        });

        const [header] = readFileSync(
          join(dirEmpty, 'priority.csv'),
          'utf8',
        ).split('\n');
        writeFileSync(join(dirEmpty, 'priority.csv'), `${header}\n`);

        expect(
          eco({ db: dbEmpty, verb: 'get', payload: {} }).priorities,
        ).toEqual([]);
      },
    );
  });

  // 🔴 .why the VALUE BYTES are clamped, and why they are their own axis
  //    the store is RECORD-ORIENTED csv. every other axis grades the schema,
  //    the verbs, the clock, or git — the shape AROUND a value. not one
  //    grades what a value may CONTAIN.
  //
  //    ⚠️ MEASURED RED 2026-09-16, and repaired in the same round. the writer
  //    quoted a newline per rfc4180 and the reader split the file on '\n', so
  //    the two halves of one codec disagreed:
  //
  //      set --what 'first line\nsecond line'   → a correct csv on disk
  //      the very next get                      → 💥 "Provided value cannot
  //                                                 be bound to SQLite
  //                                                 parameter 5"
  //
  //    the torn record yielded fewer fields than columns, so a bind got
  //    `undefined` and the STORE BECAME UNREADABLE — with the db still live,
  //    on a plain read, from a value the human surface invites (the readme's
  //    own `--why` example spans two lines).
  //
  //    ⇒ so this case pins a property the store now has by construction: a
  //      record ends at a newline OUTSIDE a quoted field. every other axis
  //      stayed green through the whole defect, because each grades the shape
  //      around the value rather than the value
  given('[case48] a value whose bytes fight a line-oriented format', () => {
    // each pair is [what it is, the value]. the list is the subject set, and
    // it is written by hand ON PURPOSE — a byte class cannot be derived from
    // the schema, which is exactly why this axis needed its own case
    const bytes: [string, string][] = [
      ['a newline', 'first line\nsecond line'],
      ['a carriage return', 'first\rsecond'],
      ['a crlf', 'first\r\nsecond'],
      ['a double quote', 'the "quoted" word'],
      ['a backslash', 'a\\b'],
      ['a tab', 'a\tb'],
      ['an emoji', 'ship it 🦫 now'],
      ['a line separator u2028', 'a\u2028b'],
      ['a paragraph separator u2029', 'a\u2029b'],
      // ⚠️ a NUL is absent on purpose — sqlite ends text at one, so the store
      //    REFUSES it at intake. [t2] below clamps that refusal
      ['cjk', '優先順位'],
      ['rtl', 'عربى'],
      ['a combined accent', 'e\u0301'],
    ];

    const scene = useBeforeAll(async () => ({
      rows: bytes.map(([name, value], index) => {
        const db = genDbPath({ slug: `eco-bytes-${index}` });

        eco({
          db,
          verb: 'set',
          payload: {
            slug: 'bigrock://bytes',
            what: value,
            why: 'probe',
            sev: 'p2',
            urg: '1w',
          },
        });

        // 🔴 the mirror IS the store — so prove it from the TEXT ALONE.
        //    count the RECORDS first, then drop every db artifact and let the
        //    restore rebuild from what git would have carried
        //    ⚠️ RECORDS, never lines. a quoted newline legitimately spans two
        //      lines in rfc4180, so a line count would refuse a value the
        //      format holds correctly — and it is the header, never the row,
        //      that makes a one-row file two lines
        const text = readFileSync(join(dirname(db), 'priority.csv'), 'utf8');
        const rows = asCsvRows(text).length;
        for (const peer of [db, `${db}-wal`, `${db}-shm`])
          rmSync(peer, { force: true });

        const back = eco({
          db,
          verb: 'get',
          payload: { slug: 'bigrock://bytes' },
        });
        return { name, value, rows, got: back.priorities?.[0]?.what };
      }),
    }));

    // the floor: an empty or trivial subject set would make [t1] vacuous
    // while it read as a pass
    then('[t0] the byte classes under test are real and plural', () => {
      expect(scene.rows.length).toBeGreaterThan(5);
      expect(scene.rows.map((row) => row.name)).toContain('a newline');
    });

    // 🔴 THE teeth. one value in, one RECORD on disk, and the same bytes back
    //    out from the TEXT alone. split the reader on '\n' again — the repair
    //    this case was written from — and the newline and crlf rows land here
    //    and nowhere else
    then(
      '[t1] every value survives the round trip, one value to one record',
      () => {
        for (const { name, value, rows, got } of scene.rows) {
          expect({ name, rows }).toEqual({ name, rows: 1 });
          expect({ name, got }).toEqual({ name, got: value });
        }
      },
    );

    // 🔴 a NUL would be written whole and read back cut short — sqlite ends
    //    text at one. so the store refuses it loud, before a byte lands
    then('[t2] a value that holds a NUL is refused at intake', () => {
      const db = genDbPath({ slug: 'eco-bytes-nul' });
      const got = spawnSync('node', [PATH_ECOWORK_DB, 'set', db], {
        input: JSON.stringify({
          slug: 'bigrock://bytes',
          what: 'a\u0000b',
          why: 'probe',
          sev: 'p2',
          urg: '1w',
        }),
        encoding: 'utf8',
        timeout: 30_000,
      });
      expect(got.status).toEqual(2);
      expect(got.stderr).toContain('NUL');
      expect(existsSync(join(dirname(db), 'priority.csv'))).toEqual(false);
    });

    // ⚠️ THE KNOWN LIMIT, pinned rather than hidden. a LONE SURROGATE is not
    //    valid unicode, so no utf-8 file can carry it — the dump writes
    //    U+FFFD and the value comes back changed, with no error.
    //
    //    measured 2026-09-14: sent "a\ud800b", got back "a\ufffdb".
    //
    //    it is left unrefused deliberately: the input is already malformed
    //    before it reaches this store, and every text format mangles it
    //    identically (rule.forbid.overzealous-blockers — no harm ships that
    //    a refusal here would prevent).
    //
    //    ⇒ this clamp exists so the limit is VISIBLE. add a refusal at the
    //      write boundary and this goes red — update it on purpose, never
    //      by surprise
    then('[t2] a lone surrogate is the one value that does NOT survive', () => {
      const db = genDbPath({ slug: 'eco-bytes-surrogate' });
      eco({
        db,
        verb: 'set',
        payload: {
          slug: 'bigrock://bytes',
          what: 'a\ud800b',
          why: 'probe',
          sev: 'p2',
          urg: '1w',
        },
      });
      for (const peer of [db, `${db}-wal`, `${db}-shm`])
        rmSync(peer, { force: true });

      const back = eco({
        db,
        verb: 'get',
        payload: { slug: 'bigrock://bytes' },
      });
      expect(back.priorities?.[0]?.what).toEqual('a\ufffdb');
    });
  });

  /**
   * 🔴 [case49] — the THIRTEENTH axis: FORWARD COMPATIBILITY
   *
   * twelve axes ask whether the text HOLDS every fact. this one asks the
   * question the invariant's own justification rests on:
   *
   *   > "the csv can rebuild the db. a db cannot rebuild a git history."
   *
   * that is a claim about text written under a DIFFERENT schema — and the
   * migrations list proves four columns (`goal`, `status`, `kind`,
   * `sponsored`) were added over time, so such text really is in the history.
   *
   * ⚠️ measured 2026-09-14, in three directions:
   *
   *   older text, newer code     ✅ restores; absent columns take their DEFAULT
   *   newer text, older code     🔴 refused: "no column named <x>"
   *   a RENAMED column           🔴 refused, identically
   *
   * ✅ so the history claim HOLDS — direction 1 is the one a reader of the
   *    past walks, and it works, because the restore derives its column list
   *    from the ROW rather than from a hardcoded list.
   *
   * 🔴 and the REFUSAL is what earns a clamp. it is correct today, and
   *    unguarded — a future author who meets `no column named x` has an
   *    obvious one-line repair:
   *
   *      const columns = Object.keys(row).filter((c) => known.includes(c));
   *
   *    that reads as robustness and IS a silent omission: the column is
   *    dropped, the restore reports success, and the fact is gone from the
   *    store with no complaint. every other axis stays green — each grades
   *    the DUMP, and this is the only clamp on the READ BACK.
   *
   * ⇒ the axis is: a mirror column the schema does not know must be REFUSED,
   *   never DROPPED. fail loud is the guarantee, so the clamp grades the loud.
   */
  given('[case49] a mirror written under a different schema version', () => {
    /** .what = rewrite the mirror's single row, then drop the db so it rebuilds */
    const asRestoredFrom = (input: {
      slug: string;
      edit: (row: Record<string, string | null>) => void;
    }) => {
      const db = genDbPath({ slug: input.slug });
      eco({
        db,
        verb: 'set',
        payload: {
          slug: 'bigrock://anchor',
          what: 'x',
          why: 'p',
          sev: 'p2',
          urg: '1w',
        },
      });

      const path = join(dirname(db), 'priority.csv');
      const row = getStoreRows(path)[0]!;
      input.edit(row);
      writeFileSync(path, asCsvText([row]));

      // 🔴 the db must be ABSENT, or setDbRestored returns early on a live
      //    store and the restore under test never runs
      for (const peer of [db, `${db}-wal`, `${db}-shm`])
        rmSync(peer, { force: true });

      const ran = spawnSync('node', [PATH_ECOWORK_DB, 'get', db], {
        input: '{}',
        encoding: 'utf8',
        timeout: 30_000,
      });
      return { ran, said: `${ran.stdout}${ran.stderr}` };
    };

    const scene = useBeforeAll(async () => ({
      older: asRestoredFrom({
        slug: 'eco-schema-older',
        edit: (row) => {
          for (const column of ['goal', 'status', 'kind', 'sponsored'])
            delete row[column];
        },
      }),
      newer: asRestoredFrom({
        slug: 'eco-schema-newer',
        edit: (row) => {
          row.a_column_this_version_lacks =
            'written by a peer one version ahead';
        },
      }),
    }));

    // ✅ the direction a reader of the PAST walks — and the one the
    //    invariant's stated advantage actually rests on
    then('[t0] text from an OLDER schema still rebuilds the store', () => {
      expect(scene.older.ran.status).toEqual(0);

      const out = JSON.parse(scene.older.said) as {
        priorities: { slug: string; status: string }[];
      };
      expect(out.priorities.map((row) => row.slug)).toEqual([
        'bigrock://anchor',
      ]);

      // the absent column took its DEFAULT rather than a null or a crash
      expect(out.priorities[0]!.status).toEqual('enqueued');
    });

    // 🔴 THE teeth. a column the schema does not know is REFUSED. the
    //    `.filter(known)` repair above lands here and nowhere else — every
    //    other clamp grades the dump, and this grades the read back
    then(
      '[t1] a column the schema does not know is REFUSED, never dropped',
      () => {
        if (scene.newer.ran.status === 0)
          throw new Error(
            `[case49] the restore ACCEPTED a mirror column the schema does not know.\n` +
              `  said: ${scene.newer.said.trim().slice(0, 200)}\n` +
              `  ⇒ the column was dropped and the restore reported success. that is a\n` +
              `    SILENT OMISSION from the store — the exact failure this invariant\n` +
              `    exists to forbid, and the twelve other axes all stay green because\n` +
              `    each grades the DUMP rather than the READ BACK\n` +
              `  fix:  let the insert throw. a mirror this version cannot read whole\n` +
              `        must refuse, never truncate (rule.require.failfast)`,
          );
      },
    );

    // ⚠️ a loud refusal that names no fix sends the reader to sqlite's docs
    //    for a problem that is about VERSIONS (rule.require.errors-name-the-fix)
    then(
      '[t2] and the refusal names the column, so the cause is readable',
      () => {
        expect(scene.newer.said).toContain('a_column_this_version_lacks');
      },
    );
  });

  /**
   * 🔴 [case50] — the FOURTEENTH axis: the AMBIGUOUS TEXT
   *
   * thirteen axes ask whether the text can hold every fact, and whether the
   * code reads it whole. this one asks what happens when the text states
   * MORE than the store can hold.
   *
   * the db's unique constraint means the DUMP can never emit a duplicate
   * natural key. the TEXT is a different matter — and the reachable cause is
   * ordinary: a merge resolution that keeps BOTH sides of a conflicted row.
   * strip the markers, keep both blocks, commit. two lines, one slug.
   *
   * ⚠️ measured 2026-09-14, before the repair: the restore ACCEPTED it and
   *    produced ONE row. `INSERT OR REPLACE` kept the last and dropped the
   *    other in silence.
   *
   * 🔴 and this axis is the one that attacks the invariant's OWN argument.
   *    the case for text over the binary is that text can be REVIEWED —
   *    `Binary files differ` is the db's named flaw. here the diff shows
   *    BOTH rows. a reviewer approves a PR whose every row is visible, and
   *    one of them never reaches the store, with no error, ever.
   *
   *    ⇒ so the review that was supposed to be the safety net is what lies.
   *      that is worse than an unreviewable binary, which at least admits
   *      it cannot be read.
   *
   * ⇒ the axis is: the text may state no fact the store cannot hold. an
   *   ambiguity has no correct winner, so it halts and names the key.
   */
  given('[case50] a mirror that states two facts under one natural key', () => {
    const scene = useBeforeAll(async () => {
      const db = genDbPath({ slug: 'eco-dupe-key' });
      eco({
        db,
        verb: 'set',
        payload: {
          slug: 'bigrock://contested',
          what: 'branch A said this',
          why: 'p',
          sev: 'p1',
          urg: '1d',
        },
      });

      const path = join(dirname(db), 'priority.csv');
      const rowA = getStoreRows(path)[0]!;

      // what a kept-both-sides conflict resolution leaves behind
      const rowB: Record<string, string | null> = {
        ...rowA,
        what: 'branch B said this',
        opine_sev: 'p3',
      };
      writeFileSync(path, asCsvText([rowA, rowB]));

      for (const peer of [db, `${db}-wal`, `${db}-shm`])
        rmSync(peer, { force: true });

      const ran = spawnSync('node', [PATH_ECOWORK_DB, 'get', db], {
        input: '{}',
        encoding: 'utf8',
        timeout: 30_000,
      });
      return { ran, said: `${ran.stdout}${ran.stderr}`, rowA, rowB };
    });

    // the floor: the fixture really does state one key twice, so the claim
    // below grades the case it names
    then('[t0] the fixture holds two lines under one natural key', () => {
      expect(scene.rowA.slug).toEqual('bigrock://contested');
      expect(scene.rowB.slug).toEqual('bigrock://contested');
      expect(scene.rowA.what).not.toEqual(scene.rowB.what);
    });

    // 🔴 THE teeth. an `INSERT OR REPLACE` with no prior check lands here
    then('[t1] the restore REFUSES, rather than pick a winner', () => {
      if (scene.ran.status === 0)
        throw new Error(
          `[case50] the restore ACCEPTED a mirror that states one key twice.\n` +
            `  said: ${scene.said.trim().slice(0, 200)}\n` +
            `  ⇒ INSERT OR REPLACE kept ONE of the two lines and dropped the other\n` +
            `    with no complaint. the git diff shows BOTH, so the review that is\n` +
            `    the whole case for text over the binary is what misleads here\n` +
            `  fix:  halt before the first write and name the duplicated key. an\n` +
            `        ambiguity has no correct winner (rule.require.failfast)`,
        );
    });

    // ⚠️ a halt that names no key leaves the reader to diff a 30-row file by
    //    eye for the pair that collides (rule.require.errors-name-the-fix)
    then('[t2] and the refusal names the key, the columns, and the fix', () => {
      expect(scene.said).toContain('bigrock://contested');
      expect(scene.said).toContain('slug');
      expect(scene.said).toContain('merge resolution');
    });
  });

  /**
   * 🔴 [case54] — the EIGHTEENTH axis: THE STORE LANDS WHERE IT WAS SENT
   *
   * `[case52]` catches a stray binary at the INDEX — the symptom, and the last
   * line of defence. this catches the CAUSE, at the write.
   *
   * ⚠️ the loss is easy to misread as "a binary reached the index". it is not.
   *    **every row written to a stray store is a row OMITTED from the real one**,
   *    and neither store complains — one holds rows nobody reads, the other is
   *    short rows nobody misses. that is an omission axis, not a hygiene one.
   *
   * 🔴 measured 2026-09-14: a caller passed an OBJECT where `ECOWORK_DB` expects
   *    a path. node stringified it, a full sqlite store was created at
   *    `[object Object]` in the repo root, and it held three rows that lived
   *    NOWHERE else — the mirror has never been committed, so a `git clean`
   *    would have ended them with no error and no trace.
   *
   * 🟡 this axis fires whether or not the repo is a git repo at all, which is
   *    what parts it from `[case52]`. a clone, a temp dir, a CI box with no
   *    `.git` — the refusal holds, because it grades the PATH rather than git.
   *
   * ⚠️ the guard names DEBRIS, never a policy about good paths. `[object ` can
   *    occur in no path anyone meant to type, and a basename of exactly
   *    `undefined`, `null`, or `NaN` is the same accident with a different input.
   */
  given(
    '[case54] a db path that is the debris of a stringified non-string',
    () => {
      const debrisPaths = [
        '[object Object]',
        'nested/[object Object]',
        'undefined',
        'null',
        'NaN',
      ];

      const scene = useBeforeAll(async () => {
        const sandbox = tempDirs.genOne({ slug: 'eco-debris-path' });

        const attempts = debrisPaths.map((path) => {
          const result = spawnSync('node', [PATH_ECOWORK_DB, 'get', path], {
            cwd: sandbox,
            input: JSON.stringify({}),
            encoding: 'utf8',
            timeout: 30_000,
          });
          return { path, status: result.status, stderr: result.stderr };
        });

        const strays = readdirSync(sandbox);

        return { sandbox, attempts, strays };
      });

      then('[t0] every one is refused', () => {
        const accepted = scene.attempts.filter(
          (attempt) => attempt.status === 0,
        );

        if (accepted.length)
          throw new Error(
            `[case54] a debris db path was ACCEPTED, so a stray store was created.\n` +
              `  accepted: ${accepted.map((a) => JSON.stringify(a.path)).join(', ')}\n` +
              `  ⇒ every row written there is a row OMITTED from the real store, and\n` +
              `    neither store complains. measured 2026-09-14: a store at\n` +
              `    "[object Object]" held three rows that lived nowhere else`,
          );
      });

      then('[t1] and the refusal names ECOWORK_DB and the fix', () => {
        for (const attempt of scene.attempts) {
          expect(attempt.stderr).toContain('ECOWORK_DB');
          expect(attempt.stderr).toContain('OMITTED');
        }
      });

      // 🔴 the teeth the exit code alone cannot give: a refusal that still
      //    mkdir'd or opened the file would leave the stray behind it refused
      then('[t2] and NO file is left behind on disk', () => {
        if (scene.strays.length)
          throw new Error(
            `[case54] the path was refused and a file was created anyway.\n` +
              `  left behind: ${scene.strays.map((name) => JSON.stringify(name)).join(', ')}\n` +
              `  ⇒ the guard must run BEFORE the mkdir and before DatabaseSync —\n` +
              `    the mkdir is what creates the stray, so a refusal after it\n` +
              `    reports correctly and leaves the defect on disk regardless`,
          );
      });

      // ⚠️ the control. a guard that refuses every path would satisfy [t0]-[t2]
      //    and break the store, and the three assertions above cannot tell those
      //    apart (rule.require.clamp-edge-cases — clamp the refusal AND the pass)
      then('[t3] and an ORDINARY path is still accepted', () => {
        const db = join(
          tempDirs.genOne({ slug: 'eco-debris-control' }),
          'priority.db',
        );
        const result = eco({ db, verb: 'get', payload: {} });
        expect(result).toBeDefined();
      });
    },
  );

  /**
   * 🔴 .what = the NINETEENTH axis — TWO PROCESSES INSIDE THE DUMP AT ONCE
   *
   * 🔴 .why  = every axis above grades ONE process. this one grades two, and
   *            the store's safety here rests on an ACCIDENT rather than on a
   *            guarantee — which is precisely the shape an invariant exists to
   *            convert.
   *
   *   the dump runs OUTSIDE the transaction (after COMMIT), and it runs on
   *   EVERY open via the heal — so a plain `get` dumps too, and a `get` takes
   *   no write lock at all. two processes can therefore sit inside
   *   `setStoreDumped` simultaneously, and the hazard is not the lost row:
   *
   *     P1  writeFileSync(temp, full)     temp holds the whole store
   *     P2  writeFileSync(temp, ...)      🔴 TRUNCATES it, mid-write
   *     P1  renameSync(temp, path)        publishes a TORN file, ATOMICALLY
   *
   *   ⇒ the rename is still atomic. what it publishes is garbage. so a FIXED
   *     temp name reopens the exact window the rename exists to close, and
   *     `[case43]` cannot see it — that clamp grades whether a rename happens,
   *     never whether the temp is unique.
   *
   * ⚠️ MEASURED 2026-09-14, and the measurement is why this is a clamp rather
   *    than a repair: of 16 concurrent `set` calls, **14 failed outright** with
   *    `database is locked`. that is LOUD (exit 1), so it omits no row — but
   *    it is also the only reason the dump race is unreachable today. the write
   *    path serializes by accident, because no `busy_timeout` is set.
   *
   *    a reader-versus-writer probe (8 rounds x 24 concurrent `get` against one
   *    `set`) produced **0 damaged stores**, so the window is real and narrow.
   *    no clamp is written for a defect that cannot be demonstrated — a clamp
   *    that passes either way proves naught (rule.require.clamp-edge-cases).
   *
   * 🔴 .the coupling this exists to catch
   *
   *    the obvious repair for `database is locked` is `PRAGMA busy_timeout`.
   *    that repair makes concurrent COMMITS succeed — and concurrent commits
   *    are exactly what the dump race needs. **the fix for one defect unlocks
   *    the other**, and no other clamp here would notice.
   */
  given('[case55] the dump, graded for two processes inside it at once', () => {
    const scene = useBeforeAll(async () => {
      const module = readEcoworkDbWhole();
      const dump = /const setStoreDumped[\s\S]*?\n};/.exec(module);
      if (!dump)
        throw new Error('[case55] could not find setStoreDumped to grade');

      // ── a store, a peer's stranded temp, and a db deleted to force a restore ──
      const db = genDbPath({ slug: 'eco-concurrent' });
      eco({
        db,
        verb: 'set',
        payload: { slug: 'bigrock://alpha', sev: 'p1', urg: '1w', what: 'a' },
      });
      eco({
        db,
        verb: 'set',
        payload: { slug: 'bigrock://beta', sev: 'p1', urg: '1w', what: 'b' },
      });

      const store = join(dirname(db), 'priority.csv');
      const before = readFileSync(store, 'utf8');

      // a peer that died between its write and its rename leaves this behind
      const stray = join(dirname(db), 'priority.csv.999999.tmp');
      writeFileSync(stray, 'this is not json, and it is not the store\n');

      rmSync(db, { force: true });
      rmSync(`${db}-wal`, { force: true });
      rmSync(`${db}-shm`, { force: true });
      eco({ db, verb: 'get', payload: {} });

      return {
        module,
        dump: dump[0],
        before,
        after: readFileSync(store, 'utf8'),
        strayHeld: existsSync(stray),
      };
    });

    // 🔴 the one claim here with teeth TODAY: revert the temp name to a fixed
    //    `.tmp` and this goes red, and only it
    then(
      '[t0] the dump writes its temp under a name no peer process shares',
      () => {
        const decl = /const temp = [^;]+;/.exec(scene.dump);
        if (!decl)
          throw new Error(
            '[case55] could not find the temp declaration inside setStoreDumped',
          );

        if (!decl[0].includes('process.pid'))
          throw new Error(
            `[case55] the dump's temp name is shared across processes.\n` +
              `  found: ${decl[0]}\n` +
              `  ⇒ two processes can be inside this dump at once — a write dumps\n` +
              `    after COMMIT, and EVERY open dumps via the heal, so a plain\n` +
              `    \`get\` dumps and takes no write lock. on a shared temp name one\n` +
              `    process TRUNCATES the other's temp mid-write, and the peer then\n` +
              `    renames a torn file into place ATOMICALLY.\n` +
              `  fix:  const temp = \`\${path}.\${process.pid}.tmp\`;\n` +
              `        keep the .tmp suffix — [case45][t3] clamps that .eco/*.tmp\n` +
              `        stays gitignored, so a stranded temp can never be committed`,
          );
      },
    );

    // ⚠️ this claim is VACUOUSLY TRUE TODAY, and that is deliberate. it is a
    //    TRIPWIRE on the one edit that would open the race described above —
    //    not a measurement of the present. its teeth were proven by hand on
    //    2026-09-14 by the addition of a busy_timeout pragma, which turned it
    //    red, and only it.
    //
    // 🔴 it is written as a DISJUNCTION because that is the true invariant:
    //    the store is safe if the write path serializes OR the dump is guarded.
    //    it forbids no improvement — it requires that the two land together.
    then(
      '[t1] and a busy_timeout is never added without a guard on the dump',
      () => {
        const relaxed = /busy_timeout/i.test(scene.module);
        const guarded = /BEGIN IMMEDIATE|BEGIN EXCLUSIVE|flock|O_EXCL/.test(
          scene.dump,
        );

        if (relaxed && !guarded)
          throw new Error(
            `[case55] a busy_timeout was added and the dump is still unguarded.\n` +
              `  ⇒ busy_timeout makes concurrent COMMITS succeed, and concurrent\n` +
              `    commits are exactly what the dump race needs: one process can\n` +
              `    SELECT before a peer's commit and rename after it, so the store\n` +
              `    ends SHORT of the db with no error and no tell.\n` +
              `  ⇒ until now the write path serialized by ACCIDENT — measured\n` +
              `    2026-09-14 at 14 of 16 concurrent writes refused outright.\n` +
              `    that accident was the whole protection, and this edit spends it.\n` +
              `  fix:  guard setStoreDumped — take BEGIN IMMEDIATE across its\n` +
              `        SELECT and its rename, or hold a file lock over the pair.\n` +
              `        the two changes must land together or not at all`,
          );
      },
    );

    // 🔴 the behavioral half, and it has teeth today: a peer's stranded temp
    //    must be INERT. point the restore at `*.csv*` and this goes red
    then(
      '[t2] and a peer stranded temp neither pollutes the store nor the restore',
      () => {
        expect(scene.strayHeld).toBe(true);

        if (scene.after !== scene.before)
          throw new Error(
            `[case55] a stranded temp changed the store across a rebuild.\n` +
              `  before: ${JSON.stringify(scene.before)}\n` +
              `  after:  ${JSON.stringify(scene.after)}\n` +
              `  ⇒ the db was deleted, so the text above is what rebuilt it. an\n` +
              `    equal round-trip proves BOTH that the restore read every row\n` +
              `    and that it read no byte of the peer's temp`,
          );
      },
    );
  });
});
