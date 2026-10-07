#!/usr/bin/env node
/////////////////////////////////////////////////////////////////////
// .what = the sqlite store beneath `eco.priority` — set, get, del
//
// .why  = a priority needs a store that can ANSWER a question, and the
//         queue this replaces could not. `.dream/` is flat and
//         `src/stream/**/*.wish.md` is flat, so "every p1 due this
//         week" and "is this already caught?" have no query, and the
//         second one is what let three dreams braid onto one defect.
//
// 🔴 .the schema has TWO families, and the split is the whole model
//
//         quant.{gain,cost,asks}   MEASURED — a fact, or an estimate
//                                  a human would defend with a number
//         opine.{sev,urg}          JUDGED — a human's claim, and the
//                                  only pair that sets the rank order
//
//         ⇒ a quant INFORMS an opine. it never overwrites one.
//
//         that direction is the invariant. every prompt this store
//         emits asks a human to re-judge an opine in light of a quant;
//         not one of them rewrites sev or urg on its own.
//
//         the reason is not politeness. a quant is narrow by
//         construction — `asks` counts a reach, `gain.cash` counts one
//         cell of a 3x2 matrix — so a rank driven by quants alone would
//         rank by whatever happens to be countable. the human carries
//         the rest, and the opine is where they put it.
//
// .why node:sqlite = it is BUILT IN as of node v22, so this adds no
//         dependency, no native build, and no onlyBuiltDependencies
//         entry that could break a grove boot. recorded as fulcrum F3
//         in .dream/v2026_09_13.feat.eco-priority-the-prioritizers-verb.md
//
// .the contract with its caller
//         this module is substrate — `ecowork.sh` owns the human
//         surface. so it speaks JSON on both ends and renders naught:
//
//           printf '%s' "$payload" | node ecowork.db.mjs <verb> <dbpath>
//
//         the payload arrives on STDIN rather than argv on purpose: a
//         --what or --why carries arbitrary human prose, and a shell
//         rewrites ` $ \ before a tool ever sees them
//         (rule.require.verify-after-send). stdin passes the bytes
//         through.
//
// exit 0 = ok · 1 = malfunction · 2 = constraint
/////////////////////////////////////////////////////////////////////

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { ConstraintError } from './ecowork.db.vocab.mjs';
import { SCHEMA, VIEWS, INDEXES, setSchemaMigrated, setSponsorFlagRetired, setGoalColumnRetired } from './ecowork.db.schema.mjs';
import { setStoreDumped, setDbRestored, assertDbPathIsNotDebris, setStoreIgnoreRulesFound } from './ecowork.db.store.mjs';
import { setPriority, getPriority, delPriority, mvGoal } from './ecowork.db.verbs.mjs';

/////////////////////////////////////////////////////////////////////
// 🔴 the node:sqlite experimental notice — silenced HERE, at the cause
//
// .what = node prints, on STDERR, at every load of `node:sqlite`:
//
//     (node:2074806) ExperimentalWarning: SQLite is an experimental
//     feature and might change at any time
//
// .why silence it = it is noise on a surface a HUMAN reads. every
//     `rhx eco.priority get` would open with a note about an internal
//     the human never chose (rule.forbid.surprises). and 38 clamps here
//     assert `stderr: ''` — a real guarantee about that surface — so the
//     notice turns a green suite red on any host whose node emits it.
//
// 🔴 .why here rather than at a call site = there are THIRTEEN. the
//     shell has one; this suite spawns `node` directly twelve more
//     times. a `--disable-warning` flag on any one of them leaves the
//     other twelve loud (rule.require.solve-at-cause).
//
// 🔴 .why a dynamic import = an ESM `import` declaration is HOISTED, so
//     a filter written above a static `from 'node:sqlite'` still
//     installs after the notice has already fired. `await import(...)`
//     is an ordinary expression, evaluated in source order — which is
//     the whole reason this one import is shaped differently from the
//     static imports above.
//
// ⚠️ .the bound = exactly one class is dropped, and every other notice
//     is re-emitted. a blanket `--no-warnings` would also swallow a
//     deprecation that a future node release means for us to read.
//
// 🔴 .why it DELEGATES rather than re-prints = node's own handler is
//     captured and called for every notice we keep, so this file holds
//     no copy of node's output format.
//
//     an earlier draft re-printed with `warned.stack ?? warned.message`.
//     that is NOT node's default: `.stack` carries the frames too, so
//     every surviving deprecation would have dumped a trace where node
//     prints one line — and `--trace-warnings` / `--no-deprecation`
//     would have stopped working, since those flags are read by the
//     handler we had discarded.
//
//     ⇒ a format copied from another program is a cache of that
//       program's behavior, and it goes stale the release after you
//       write it. delegate, and none of it needs to stay in sync.
/////////////////////////////////////////////////////////////////////

// ⚠️ .why EVERY prior listener, never just `[0]` = today this module is only
//     ever run as a bare `node ecowork.db.mjs`, where node's own handler is
//     the one and only listener. that is a fact about the CALLER, and a
//     caller can change — a harness that registers its own listener first
//     would make `[0]` someone else's, and `[0]` alone would then drop
//     node's. the whole set costs the same and assumes naught.
const onWarningPriors = process.listeners('warning');
process.removeAllListeners('warning');
process.on('warning', (warned) => {
  if (warned.name === 'ExperimentalWarning') return;
  onWarningPriors.forEach((prior) => prior(warned));
});

const { DatabaseSync } = await import('node:sqlite');

/** .what = open the db, create the table if absent, migrate it, index, restore */
const genDb = (path) => {
  assertDbPathIsNotDebris(path); // 🔴 before mkdir — the mkdir is what creates the stray
  mkdirSync(dirname(path), { recursive: true });
  setStoreIgnoreRulesFound(dirname(path)); // 🔴 before the db exists — no window where it is trackable
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL;');

  // 🔴 sqlite enforces a foreign key only when ASKED, per connection, and
  //   the DEFAULT IS OFF. so every REFERENCES clause on `gate` and `serve`
  //   is decoration until this line runs — an edge onto a goal that does
  //   not exist would insert clean, which is the whole class of loss the
  //   uuid rekey was adopted to end.
  //
  //   ⚠️ a clamp cannot catch its absence by reading the ddl. the clause is
  //   in the schema either way; what this changes is whether anything reads
  //   it. the only honest check is an INSERT of an orphan edge
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(SCHEMA);
  setSchemaMigrated(db); // 🔴 before INDEXES — an index names a column
  // 🔴 before INDEXES and before VIEWS, for two different reasons:
  //   INDEXES — it drops `priority_sponsored`, and a re-CREATE of an index on
  //             a column this just dropped throws `no such column`
  //   VIEWS   — `priority_live` emits a DERIVED `sponsored`. leave the column
  //             standing and the view carries two columns of that name, with
  //             the reader handed whichever came last — a silent coin-flip
  //             between the retired flag and the live derivation
  /*
   * 🔴 this DROP belongs to the SPONSOR retirement on the next line, and it is
   *   here rather than inside it because of what sqlite does on a DROP COLUMN:
   *   it re-parses EVERY view, whatever column that view names, and refuses the
   *   drop when one no longer resolves.
   *
   *   ⇒ so a view left stale by a PEER migration refuses an unrelated alter.
   *     measured 2026-09-21: `no such column: pb.goal` raised by the SPONSORED
   *     drop, over a view it never reads.
   *
   * ⚠️ `CREATE VIEW IF NOT EXISTS` is a no-op on a view that already stands,
   *   which is exactly what makes a SHAPE change invisible: an extant db keeps a
   *   definition that reads `p.goal`, and every read of it throws `no such
   *   column` the moment the goal retirement drops that column. the comment on
   *   `db.exec(VIEWS)` already names this trap — a view that CHANGES shape needs
   *   a DROP beside it, and this is that DROP.
   *
   * 🟡 `setGoalColumnRetired` carries its OWN copy of these two lines, and that
   *   is deliberate rather than a leftover. a retirement must stand on its own
   *   wherever it is called from, and a DROP VIEW IF EXISTS is idempotent — so
   *   the cost of the overlap is one no-op and the cost of its absence is a
   *   refused alter (rule.require.pitofsuccess).
   */
  db.exec(`
    DROP VIEW IF EXISTS priority_live;
    DROP VIEW IF EXISTS goal_orchestration_slug;
  `);

  // 🔴 AFTER the view drops above. sqlite re-parses EVERY view on ANY
  //   DROP COLUMN, so a view left stale by a peer migration refuses this one —
  //   measured 2026-09-21, `no such column: pb.goal` raised by the SPONSORED
  //   drop, over a view it never reads.
  setSponsorFlagRetired(db, new Date().toISOString());

  // 🔴 AFTER the sponsor retirement and BEFORE the indexes.
  //   after  — the sponsor half reads `priority.goal` to key each episode onto
  //            a goal uuid. run this first and that column is gone, so every
  //            carried sponsorship would be reported as an orphan
  //   before — INDEXES no longer names `priority (goal)`, so the index this
  //            drops must be gone before that statement could re-create it
  setGoalColumnRetired(db, new Date().toISOString());
  db.exec(INDEXES);
  // 🔴 after MIGRATE for the same reason an index is: a view names columns,
  //   so a view over a column the schema has not yet added throws `no such
  //   column`. and `CREATE VIEW IF NOT EXISTS` is a no-op on a view that
  //   already stands, so this never rebuilds a stale definition — which is
  //   why a view that CHANGES shape needs the DROP above
  db.exec(VIEWS);
  // 🔴 after MIGRATE — the restore writes every column. and a MINT on the
  //   way through is dumped at once, or the identity it minted lives only
  //   in this process and the next open invents a different one
  if (setDbRestored(db, path)) setStoreDumped(db, path);

  // 🔴 there is NO heal step, and its absence is the design.
  //
  //   a heal existed to repair a db that was AHEAD of the text — the crash
  //   window between COMMIT and a dump that ran after it. under text-ahead
  //   ordering that window is closed by construction, so a heal would have no
  //   state to repair and no direction to infer.
  //
  //   ⇒ and the inference was the defect. `setStoreHealed` compared the two
  //     sides and guessed which was behind; on an edit made in git the two
  //     were NEITHER behind, and its guess reverted a human's committed work.
  return db;
};

/** .what = read the whole of stdin as one utf8 string */
const getStdin = async () => {
  if (process.stdin.isTTY) return '';
  let data = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) data += chunk;
  return data;
};

const main = async () => {
  const [verb, dbPath] = process.argv.slice(2);

  if (!verb || !dbPath)
    throw new ConstraintError(
      'usage: ecowork.db.mjs <set|get|del|goal.mv> <dbpath>  (payload on stdin)',
    );

  const raw = (await getStdin()).trim();
  let input;
  try {
    input = raw ? JSON.parse(raw) : {};
  } catch (error) {
    throw new ConstraintError(`payload on stdin is not valid json: ${error.message}`);
  }

  // 🔴 refuse a NUL before a byte reaches the store. sqlite ends a TEXT value
  //   at a NUL on read, so `a\0b` would be written whole and read back as `a` —
  //   a silent truncation. no shell can pass a NUL in an argument, so one here
  //   is always debris from a caller, never a value a human meant
  const hasNul = (value) =>
    typeof value === 'string'
      ? value.includes('\u0000')
      : value !== null && typeof value === 'object' && Object.values(value).some(hasNul);
  if (hasNul(input))
    throw new ConstraintError(
      'a value holds a NUL byte (\\u0000), which the store cannot carry.\n' +
        '  ⇒ sqlite truncates text at a NUL, so the value would read back cut short.\n' +
        '  fix: strip the NUL from the value, then retry',
    );

  const db = genDb(dbPath);
  try {
    const verbs = { set: setPriority, get: getPriority, del: delPriority, 'goal.mv': mvGoal };
    const run = verbs[verb];
    if (!run) throw new ConstraintError(`verb '${verb}' is not one of: set get del goal.mv`);

    // 🔴 .why a MUTATING verb runs inside a transaction
    //
    //   `set` is no longer one statement. it upserts the row, then rewrites
    //   each gate side as a DELETE followed by N inserts — and any of those
    //   inserts may refuse (an unknown slug, a cycle, a self-edge).
    //
    //   ⚠️ without a transaction a refusal is a PARTIAL WRITE reported as a
    //   failure: `--gates a --gates ghost` drops every extant edge, writes
    //   `a`, then exits 2. the human reads "refused" and believes naught
    //   changed, while the timeline they had is already gone. that is a
    //   term=false-report of the worst kind — the message is true about the
    //   call and false about the store.
    //
    //   ⇒ measured 2026-09-13, on the probe that followed the first green
    //     smoke test. a refusal must leave the store exactly as it was.
    //
    //   `get` runs outside, deliberately: a read needs no atomicity, and a
    //   transaction around it would take a write lock it never uses
    if (verb === 'get') {
      process.stdout.write(JSON.stringify(run(db, input)));
    } else {
      db.exec('BEGIN');
      let verdict;
      try {
        verdict = run(db, input);

        // 🔴 THE TEXT COMMITS FIRST. this is the whole ordering, and it is why
        //    `setDbRestored` may rebuild unconditionally on every open.
        //
        //    the dump sits INSIDE the transaction, before COMMIT, so:
        //
        //      crash before the dump   neither side has it. the caller got no
        //                              success, and both agree. ✅
        //      crash after the dump,   the TEXT has it, the db does not — and
        //      before the COMMIT       the next open rebuilds the db from the
        //                              text, so the write survives. ✅
        //      dump throws             ROLLBACK. the db is unchanged, and the
        //                              caller is told. ✅
        //
        //    ⇒ the db can never be AHEAD of the text, so there is no tail write
        //      for the rebuild to lose and no divergence to adjudicate.
        //
        // ⚠️ this INVERTS the prior order, which dumped after COMMIT. that
        //    order made the db authoritative in the crash window, which is
        //    what forced `setStoreHealed` to guess a direction — and a guess
        //    is what silently reverted a human's committed edit.
        //
        // 🟡 the residual window: a dump that lands and a COMMIT that then
        //    fails leaves the text ahead and reports a failure. the write
        //    survives anyway, since the text is the store — a false NEGATIVE,
        //    where the old order gave a false positive. a report that
        //    understates is the one to prefer.
        setStoreDumped(db, dbPath);

        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }

      process.stdout.write(JSON.stringify(verdict));
    }
  } finally {
    db.close();
  }
};

main().catch((error) => {
  const constraint = error instanceof ConstraintError;
  process.stderr.write(`${error.message}\n`);
  process.exit(constraint ? 2 : 1);
});
