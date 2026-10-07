/////////////////////////////////////////////////////////////////////
// .what = the plaintext store — the csv codec, the dump, the restore, the ignore rules
//
// .why  = the csv files ARE the store; the db is a cache rebuilt from them
//         (define.invariant.eco.the-csv-is-truth-the-db-is-a-cache). this module
//         writes and reads that text, and never opens a db of its own
//
// .note = a PART of `ecowork.db.mjs`, cut so one reviewer can hold it
//         whole. only the entry opens the store — this module takes an
//         open `db` handle and never opens one ([case56])
/////////////////////////////////////////////////////////////////////

import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ConstraintError } from './ecowork.db.vocab.mjs';
import { SCHEMA, VIEWS, INDEXES } from './ecowork.db.schema.mjs';

/////////////////////////////////////////////////////////////////////
// 🔴 THE PLAINTEXT MIRROR — the db is DERIVED; the jsonl is the store
/////////////////////////////////////////////////////////////////////
//
// .what = every verb that WRITES dumps the whole store to jsonl beside
//         the db, and an EMPTY db restores itself from that jsonl on
//         open.
//
// 🔴 .why = the db is not committable, and an uncommitted store is one
//         disk away from gone. measured 2026-09-13: `.eco/` was
//         untracked — not ignored, merely never added — so every
//         priority the store held had ZERO backups.
//
//         and the naive repair is worse than the gap. `git add` a
//         sqlite file and you get:
//           - `Binary files differ` on every diff. no review, ever
//           - a merge that resolves to ONE SIDE and silently drops the
//             other branch's rows. no conflict marker, no alert
//           - a 56K blob rewritten whole on every single-field edit
//
//         ⇒ so the committed form must be TEXT, line-oriented, and
//           stably ordered. jsonl is all three: one row per line, sorted
//           by key, so a one-field edit is a one-line diff and two
//           branches that touch different rows merge cleanly.
//
// 🔴 .why the db is the DERIVED half rather than the other way round
//         a fact with two homes is a fact that can drift
//         (define.invariant.eco.a-part-gates-its-whole). one of the two
//         must be computable from the other, and the choice is forced:
//         the jsonl can rebuild the db, and a db cannot rebuild a git
//         history. ⇒ the db is a CACHE. delete it and lose naught
//
// ⚠️ .the crash window, and the heal that closes it
//         the dump runs AFTER the transaction commits, so a crash in the
//         window between leaves the db ahead of the jsonl by one write.
//         that write is not lost — a restore fires only into an EMPTY
//         db, so a live store is never rolled backwards.
//
//         🔴 and the next OPEN re-dumps it, whatever the verb. the heal
//         runs on every genDb, so a plain read converges the text. the
//         exposure is therefore a crash PLUS a deletion of the db before
//         the next call of ANY kind — never merely before the next write

/**
 * .what = every table the schema declares, in the order it declares them
 *
 * 🔴 .why = THIS is what makes an omission impossible rather than merely
 *         unlikely. a hand-written list of tables is a second place the
 *         schema lives, and the two drift in one direction only: somebody
 *         adds a table to SCHEMA, the list keeps its three names, and the
 *         mirror writes three files with no error, no warn, and no tell.
 *         the db holds the fourth table; git holds naught of it; a fresh
 *         clone loses it whole.
 *
 *         ⇒ derived from `sqlite_master`, the mirror cannot lag the
 *           schema, because there is no second list to forget.
 *
 * ⚠️ `ORDER BY rowid` is DECLARATION order, and the restore side leans on
 *    it — a child table must be inserted after the parent its foreign key
 *    names, and a table declared later can only reference one declared
 *    earlier
 */
export const getAllStoredTables = (db) =>
  db
    .prepare(
      `SELECT name FROM sqlite_master
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        ORDER BY rowid ASC`,
    )
    .all()
    .map((row) => row.name);

/**
 * .what = the columns to sort a table's dump by — its primary key
 * .why  = derived for the same reason the table list is. a hardcoded
 *         `ORDER BY slug` on a table whose key later grows a second
 *         column re-orders rows on every write, which costs the whole
 *         merge advantage and reads as a diff of the entire file
 */
export const getAllKeyColumns = (db, table) => {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  const keys = info.filter((c) => c.pk > 0).sort((a, b) => a.pk - b.pk);
  return (keys.length ? keys : info).map((c) => c.name);
};

/** .what = the committed, authoritative text of one table */
export const asStorePath = (dbPath, table) => join(dirname(dbPath), `${table}.csv`);

/**
 * 🔴 .why CSV rather than jsonl — it is the MERGE that decides it
 *
 *   both are line-oriented, so git merges both by line. what parts them is
 *   what a human sees when it conflicts:
 *
 *     jsonl  {"slug":"x","kind":null,"what":"…","why":"…", …}
 *            every key repeated on every row. a 1535-char line, and the one
 *            changed field is somewhere inside it
 *     csv    x,,,…
 *            the keys are declared ONCE, in the header. the row is the values
 *
 *   ⇒ a conflict a human can settle by eye is the whole advantage of text over
 *     the binary, and a repeated-key format spends that advantage on syntax.
 *
 * 🔴 .the one real hazard, and why it does NOT apply here
 *
 *   csv cannot tell `null` from `''` — both render as an empty field. that
 *   would be an omission, which is the one loss this store may never take.
 *
 *   ⚠️ measured 2026-09-14 over the live store: 5 of 22 columns hold null,
 *   and ZERO hold an empty string. and that is not luck — the shell payload
 *   builder drops empties (`with_entries(select(.value != "")`), so `''` is
 *   UNSTORABLE by construction.
 *
 *   ⇒ so an empty field means null, unambiguously, and `[case58]` clamps that
 *     the store never learns to hold an empty string.
 */

/** .what = one value, RFC4180-encoded. null becomes an empty field */
export const asCsvCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  // ⚠️ quote on a comma, a quote, or any newline. 45 values in the live store
  //    carry a comma and 24 carry a quote, so this path is the common one
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * .what = whole csv text, split into RECORDS, quotes honored across newlines
 * .why  = 🔴 a split on '\n' tears a value that HOLDS one, and the writer above
 *         quotes such a value rather than refuse it — so the pair disagreed.
 *
 *         measured 2026-09-16: a `--what 'first line\nsecond line'` dumped a
 *         correct rfc4180 file, and the very next read halted with
 *         `Provided value cannot be bound to SQLite parameter 5` — the torn
 *         line yielded fewer fields than columns, so a bind got `undefined`.
 *         the store became UNREADABLE on the next call, with the db still live.
 *
 *         ⚠️ reachable from the human surface: the readme's own `--why`
 *         example spans two lines.
 *
 *   ⇒ a record ends at a newline that is OUTSIDE a quoted field. that is the
 *     one rule the line-split could not express, and it is the whole repair
 */
export const asCsvRecords = (text) => {
  const records = [];
  let record = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      // ⚠️ an escaped quote (`""`) rides through; it never toggles the state
      if (quoted && text[i + 1] === '"') {
        record += '""';
        i += 1;
        continue;
      }
      quoted = !quoted;
      record += char;
      continue;
    }
    if (char === '\n' && !quoted) {
      records.push(record);
      record = '';
      continue;
    }
    record += char;
  }
  if (record) records.push(record);
  return records;
};

/**
 * .what = one csv record, split into fields, quotes honored
 * .why  = a hand split on ',' tears any of the 45 values that carry one. this
 *         walks the record instead, so a quoted comma stays inside its field
 */
export const asCsvFields = (line) => {
  const fields = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') {
      fields.push(field);
      field = '';
    } else field += char;
  }
  fields.push(field);
  return fields;
};

/**
 * .what = the whole of one table, as csv text
 *
 * 🔴 the HEADER is what makes a column addition safe. the reader keys on the
 *    header rather than on position, so a column added later rides in with no
 *    edit to either side — the same guarantee `SELECT *` gives the dump
 */
export const asCsvText = (rows, columns) =>
  [columns.join(','), ...rows.map((row) => columns.map((c) => asCsvCell(row[c])).join(','))].join(
    '\n',
  ) + '\n';

/**
 * .what = one store file, parsed back to rows
 * .why  = the restore and every guard read the text the same way. two copies
 *         of this parse would drift, and the drift would be invisible from
 *         either side (term=partial-audit)
 *
 * ⚠️ a value is returned as a STRING or as null. the db's own column affinity
 *    coerces an INTEGER column back, which is why `sponsored` and `quant_asks`
 *    survive the round trip — `[case42]` grades exactly that
 */
export const asStoreRows = (file) => {
  if (!existsSync(file)) return [];
  // ⚠️ RECORDS, never lines — a value may hold a newline, and the writer
  //   quotes it rather than refuse it (asCsvRecords)
  const lines = asCsvRecords(readFileSync(file, 'utf8'));
  const header = lines.shift();
  if (!header || !header.trim()) return [];
  const columns = asCsvFields(header);
  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const fields = asCsvFields(line);
      return Object.fromEntries(
        columns.map((column, index) => [column, fields[index] === '' ? null : fields[index]]),
      );
    });
};

/**
 * .what = write the whole store to jsonl, stably ordered
 * .why  = ORDER is what makes it a mirror rather than a dump. an
 *         unsorted export re-orders rows on every rewrite, so a
 *         one-field edit renders as a diff of the entire file and the
 *         merge advantage is lost. sort by primary key, always
 *
 * 🔴 `SELECT *` is the COLUMN half of the same guarantee the derived
 *    table list gives on the table axis: a column added later rides into
 *    the mirror with no edit here
 */
export const setStoreDumped = (db, dbPath) => {
  for (const table of getAllStoredTables(db)) {
    const order = getAllKeyColumns(db, table)
      .map((c) => `${c} ASC`)
      .join(', ');
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all();
    // 🔴 columns from the SCHEMA, never from a row. an empty table must still
    //    emit its header, or the file states no shape at all — and a reader
    //    that finds no header returns zero rows, which reads as "no data"
    //    rather than "a store that never said"
    const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
    const text = asCsvText(rows, columns);
    const path = asStorePath(dbPath, table);

    // ⚠️ write only on a real difference. the dump is now called on OPEN
    //    as well as on write, so an unconditional write would touch every
    //    mirror file on every read — and a file whose mtime moves with no
    //    content change reads as a change to a watcher, to a backup, and
    //    to a human who hunts for what moved
    if (existsSync(path) && readFileSync(path, 'utf8') === text) continue;

    // 🔴 write ATOMICALLY — a temp peer, then a rename
    //
    //   `writeFileSync` on an extant path TRUNCATES it, then writes. so a
    //   crash inside that call leaves the mirror short — and its three
    //   torn shapes are not equally kind:
    //
    //     cut MID-LINE      -> invalid json. the restore throws. loud
    //     cut AT A NEWLINE  -> 🔴 valid jsonl, rows absent, no complaint
    //     cut AT BYTE ZERO  -> 🔴 an EMPTY file. the whole store, gone
    //
    //   the last is the sharpest: the truncate lands first, so there is a
    //   real instant where the file that IS the store holds naught. lose
    //   the db in that instant and the store is gone whole — which is the
    //   exact loss this invariant exists to refuse.
    //
    //   ⇒ a rename within one directory is atomic on posix. a reader sees
    //     the OLD complete file or the NEW complete file, never a blend,
    //     and no instant exists in which it sees neither
    //
    // ⚠️ the temp MUST sit in the same directory. rename is atomic only
    //    within one filesystem, and a temp under /tmp is a copy-then-unlink
    //    across two — which reopens the very window this closes
    // ⚠️ the temp name must be UNIQUE PER PROCESS, never a fixed `.tmp`.
    //
    //   two processes can sit inside this dump at once — a write does it
    //   after COMMIT, and EVERY open does it via the heal, so a plain `get`
    //   dumps too and takes no write lock at all. on a shared temp name:
    //
    //     P1  writeFileSync(temp, full)      temp = the whole store
    //     P2  writeFileSync(temp, ...)       🔴 TRUNCATES it, mid-write
    //     P1  renameSync(temp, path)         publishes a TORN file, atomically
    //
    //   ⇒ the rename is still atomic; what it publishes is garbage. so the
    //     fixed name reopened the exact window the rename exists to close.
    //
    // ⚠️ `*.tmp` stays the suffix — `[case45][t3]` clamps that .eco/*.tmp is
    //    gitignored, so a stranded temp can never be committed
    const temp = `${path}.${process.pid}.tmp`;
    writeFileSync(temp, text);
    renameSync(temp, path);
  }
};

/**
 * .what = rebuild the db from the committed csv — on EVERY open
 *
 * 🔴 .why = THE DB IS EPHEMERAL. the csv is the store; sqlite is a cache we
 *         keep for relational constraints and fast gets, and naught else.
 *
 *         this used to return early when the db held rows, and that one line
 *         WAS the silent-revert defect: a populated db was never rebuilt, so
 *         an edit a human made to the TRACKED TEXT — a pull, a merge resolved
 *         on a field, a hand edit in a PR — was overwritten by the db on the
 *         next read. exit 0, no complaint, and the reverted file is the
 *         committed store.
 *
 *         ⚠️ measured 2026-09-14: `what` edited in the text, a plain `get`
 *         ran, and the original words were back. all 21 axes stayed green,
 *         because every one of them grades the db-to-text direction and this
 *         loss is the other one.
 *
 *         ⇒ the cure is not a smarter comparison. it is to HAVE NO
 *           COMPARISON: the text is truth, so the db conforms to it, always,
 *           with no tiebreak to get wrong. this is the `smudge` half of the
 *           standard clean/smudge filter pair, which fires on every checkout
 *           for exactly this reason.
 *
 * ⚠️ this is SAFE only because the write path dumps the text BEFORE it
 *    commits (see `main`). a db that could be AHEAD of the text would lose its
 *    tail write here, on every open. the two changes are ONE change.
 */
/**
 * 🔴 .what = give every goal a uuid, and rekey any edge the text still
 *            states in the OLD keyspace, before a single row is written
 *
 * .why  = the text is truth, and the text predates the uuid. the old
 *         `gate.csv` held SLUGS and the old `serve.csv` held URIS — two
 *         keyspaces, which is the split the rekey exists to close. a restore
 *         that inserted them verbatim would violate the new foreign key on
 *         every row.
 *
 * 🔴 .why it is a MIGRATION rather than a one-time repair
 *   the db is rebuilt from the text on EVERY open, so there is no "after"
 *   in which the conversion is done. a checkout of an older branch, a pull,
 *   a merge that resolves onto an old row — each re-presents the old shape,
 *   and each must convert identically. a repair run once cannot do that.
 *
 * ⚠️ it RESOLVES, it never guesses. an endpoint that matches no uuid, no
 *    uri, and no slug is an orphan, and it halts and names it — because the
 *    alternative is to drop the edge, which is precisely the silent loss
 *    the uuid was adopted to make impossible.
 *
 * .the resolution order, and why it is safe
 *   1. a uuid already in `goal.csv`   — the durable identity, held as-is
 *   2. a goal uri                      — the old `serve.csv`, and every new edge
 *   3. a priority slug                 — the old `gate.csv`, pre-`slug === goal`
 *   the three cannot collide: a uuid is not a uri, and a slug that IS a uri
 *   resolves the same way through either rung by construction.
 */
export const asStoreRekeyed = (stored) => {
  const held = (table) => stored.find((s) => s.table === table)?.rows ?? [];
  const priorities = held('priority');
  const goals = held('goal');

  const now = new Date().toISOString();
  const uuidOfUri = new Map(goals.map((row) => [row.uri, row.uuid]));
  const known = new Set(goals.map((row) => row.uuid));
  let minted = 0;

  // every goal a priority declares owes an identity, minted on first sight
  //
  // 🔴 the uri is read off `slug`, which IS the goal uri. `setStoreGoalRetired`
  //   runs FIRST on this path, so by here priority.csv carries one name — and a
  //   read of a `goal` field would find undefined on every row and mint naught,
  //   leaving every edge with no referent to key against
  for (const row of priorities) {
    if (!row.slug || uuidOfUri.has(row.slug)) continue;
    const uuid = randomUUID();
    uuidOfUri.set(row.slug, uuid);
    known.add(uuid);
    goals.push({ uuid, uri: row.slug, set_at: row.set_at ?? now });
    minted += 1;
  }

  /*
   * ⚠️ this is now an IDENTITY map, and it is kept rather than deleted.
   *
   * it exists so an edge csv that names a priority's SLUG finds that row's goal
   * — a real shape in a store written before the two names merged. after the
   * merge the two are one, so the lookup below reads the same uri either way,
   * and the branch costs a map read.
   *
   * 🔴 .what it can no longer rescue, stated rather than hidden
   *   an edge that names a LEGACY coined slug (`svc-lessons-acu-tune`) has no row
   *   to reach through once that row's slug became its uri. that edge throws
   *   with the message below, which names the fix — the honest outcome, and far
   *   better than an edge silently keyed to naught.
   */
  const uriOfSlug = new Map(priorities.map((row) => [row.slug, row.slug ?? null]));

  const asUuid = (table, column, value) => {
    if (known.has(value)) return value;
    if (uuidOfUri.has(value)) return uuidOfUri.get(value);
    const uri = uriOfSlug.get(value);
    if (uri && uuidOfUri.has(uri)) return uuidOfUri.get(uri);
    throw new Error(
      `✋ ${table}.csv names '${value}' in its \`${column}\` column, and it resolves to no goal.\n` +
        `   it is not a goal uuid, not a goal uri, and not the slug of any priority in\n` +
        `   priority.csv — so the edge points at naught and the store cannot key it.\n` +
        `   ⇒ the reachable cause is a row deleted from priority.csv while its edge stayed.\n` +
        `   fix:  restore the priority, or delete the edge line from ${table}.csv`,
    );
  };

  const goalHeld = stored.find((s) => s.table === 'goal');
  if (goalHeld) goalHeld.rows = goals;

  for (const [table, columns] of [
    ['goal_orchestration', ['before', 'after']],
    ['goal_decomposition', ['part', 'whole']],
    // ⚠️ a sponsorship rides the SAME rekey, and it must. the csv half of the
    //   flag retirement writes `goal` as a URI (that is what priority.csv
    //   holds), so without this row every migrated sponsorship would violate
    //   the foreign key on the very open that created it
    ['goal_sponsorship', ['goal']],
  ])
    for (const row of held(table))
      for (const column of columns) row[column] = asUuid(table, column, row[column]);

  return minted;
};

/**
 * 🔴 .what = rebuild the edge tables when their shape predates the uuid
 *
 * .why  = `CREATE TABLE IF NOT EXISTS` adds no CONSTRAINT to an extant
 *         table, exactly as it adds no column (see MIGRATIONS). so every
 *         `.eco/priority.db` written before this rekey keeps a `gate` with
 *         two bare TEXT columns and no foreign key at all — and it keeps it
 *         forever, in silence, while the ddl in this file says otherwise.
 *
 *         the 2026-09-15 rename compounds it: an old db also carries the
 *         tables under their OLD names, so the new ones would be created
 *         empty beside them and the store would read as zero edges.
 *
 * 🔴 .why a DROP is the honest repair here, and only here
 *   a drop is normally the one move a store may never make. it is safe for
 *   these two tables and for no others, because of what they are: the db is
 *   a CACHE, the csv is truth, and the very next act of the restore refills
 *   both from the text. `priority` gets an ALTER instead — its columns hold
 *   facts the text may not yet carry back.
 *
 * ⚠️ it runs INSIDE the restore, after the bootstrap branch has returned.
 *   ahead of that branch the text may be silent, and a drop would then take
 *   the 8 edges that lived nowhere else.
 */
export const setEdgeTablesReshaped = (db) => {
  const shapeOf = (table) =>
    db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`).get(table);

  const stale = shapeOf('gate') || shapeOf('serve'); // the pre-rename names
  const held = shapeOf('goal_orchestration');
  if (!stale && held && held.sql.includes('REFERENCES')) return;

  db.exec(`
    DROP VIEW  IF EXISTS gate_slug;
    DROP VIEW  IF EXISTS serve_uri;
    DROP VIEW  IF EXISTS goal_orchestration_slug;
    DROP VIEW  IF EXISTS goal_decomposition_uri;
    DROP TABLE IF EXISTS gate;
    DROP TABLE IF EXISTS serve;
    DROP TABLE IF EXISTS goal_orchestration;
    DROP TABLE IF EXISTS goal_decomposition;
  `);
  db.exec(SCHEMA);
  db.exec(INDEXES);
  db.exec(VIEWS);
};

/**
 * 🔴 .what = carry the two edge CSVs onto their new names, once
 *
 * .why  = `asStorePath` derives a filename from the table name, so the
 *         2026-09-15 rename moved `gate.csv` -> `goal_orchestration.csv` and
 *         `serve.csv` -> `goal_decomposition.csv` by construction. the files
 *         on disk do not move with it.
 *
 * 🔴 .why that is worse than an absent file, and not the same state
 *   `setDbRestored` takes an absent store file to mean THE TEXT HAS NOT
 *   SPOKEN, and a silent text lets the db bootstrap it. so without this the
 *   restore would find no edge text, dump the (also empty) new tables over
 *   it, and the 8 live edges would be gone with no error at any step. an
 *   orphaned `gate.csv` would sit right beside the empty new one, in git,
 *   and read as a complete record of a store that no longer holds it.
 *
 * ⚠️ it runs BEFORE the restore reads a file — the `spoken` test is what it
 *   exists to feed, so it cannot run after it.
 *
 * .the header moves too. `gate.csv` names its columns `gater,gated`, and the
 *   table now names them `before,after`. the rows are uuids already, or the
 *   rekey resolves them — either way the values are untouched.
 */
export const setStoreFilesRenamed = (dbPath) => {
  for (const [was, now, columns] of [
    ['gate', 'goal_orchestration', { gater: 'before', gated: 'after' }],
    ['serve', 'goal_decomposition', {}],
  ]) {
    const from = asStorePath(dbPath, was);
    const into = asStorePath(dbPath, now);
    if (!existsSync(from) || existsSync(into)) continue;

    const lines = readFileSync(from, 'utf8').split('\n');
    lines[0] = asCsvFields(lines[0] ?? '')
      .map((field) => columns[field] ?? field)
      .join(',');
    writeFileSync(into, lines.join('\n'));

    // ⚠️ the old file is UNLINKED, never kept beside the new one. two files
    //   that state one edge set is the drift this store refuses everywhere
    //   else, and git already holds the old bytes — so the backup is free and
    //   the rename shows up as a rename rather than an add beside a corpse
    unlinkSync(from);
  }
};

/**
 * 🔴 .what = retire `priority.sponsored` into `goal_sponsorship` — the CSV half
 *
 * .why  = `setSponsorFlagRetired` handles a db that already exists. this
 *         handles the case that has no db at all — a FRESH CLONE, where the
 *         csv is the only thing on disk and the table was built from the new
 *         schema, which has no such column.
 *
 *         ⇒ on that path the db half returns false immediately (there is no
 *           column to drop), and without this the restore would hand
 *           `setRowsRestored` a `sponsored` field the table cannot take. that
 *           throws by design — the mirror refuses to truncate — so a fresh
 *           clone of a legacy store would simply not open.
 *
 * 🔴 .why the sponsorship is keyed on the goal URI here, not a uuid
 *   this runs before a single row is read, so no uuid exists yet. the uri is
 *   what `priority.csv` holds, and `asStoreRekeyed` converts it — the exact
 *   machinery the gate/serve rekey already uses.
 *
 * ⚠️ .why an extant goal_sponsorship.csv makes this a no-op
 *   the retirement happens ONCE. a second run over a store that already
 *   carries the table would append a rival episode per open, and the rank
 *   would read as sponsored forever off a pile of duplicates.
 */
export const setStoreFlagRetired = (dbPath) => {
  const flagged = asStorePath(dbPath, 'priority');
  const record = asStorePath(dbPath, 'goal_sponsorship');
  if (!existsSync(flagged) || existsSync(record)) return;

  const rows = asStoreRows(flagged);
  if (!rows.length || !Object.keys(rows[0]).includes('sponsored')) return;

  const now = new Date().toISOString();
  const why =
    'carried from the retired priority.sponsored flag on 2026-09-15. the flag ' +
    'recorded no author and no reason, so both are absent here rather than ' +
    'invented — a human is owed a --sponsor-who and a --sponsor-why on this row';

  const columns = ['uuid', 'goal', 'who', 'why', 'since', 'until', 'set_at'];

  // 🔴 SORTED BY UUID, which is the primary key — the same order
  //    `setStoreDumped` emits (`ORDER BY <pk> ASC`).
  //
  //    this file is written by HAND here rather than through the dump, so
  //    the dump's guarantee does not cover it, and an unsorted mirror is
  //    not a cosmetic defect: it renders as a diff of the whole file on
  //    the very next rewrite, and a conflict a human can settle by eye is
  //    the whole advantage this store trades a binary for.
  //
  //    ⚠️ measured 2026-09-15 on the live store — the retirement wrote 5
  //      episodes in priority-csv order, and `[case39] the committed store
  //      in this repo` caught it as a canonical-order failure
  const episodes = rows
    .filter((row) => String(row.sponsored) === '1' && row.goal)
    .map((row) => ({
      uuid: randomUUID(),
      goal: row.goal,
      who: null,
      why,
      since: now,
      until: null,
      set_at: now,
    }))
    .sort((a, b) => (a.uuid < b.uuid ? -1 : a.uuid > b.uuid ? 1 : 0));

  const orphans = rows.filter((row) => String(row.sponsored) === '1' && !row.goal).map((r) => r.slug);
  if (orphans.length)
    console.error(
      `⚠️ ${orphans.length} row(s) read sponsored=1 in priority.csv and name no goal, so no ` +
        `sponsorship could be keyed for them: ${orphans.join(', ')}\n` +
        `   ⇒ a budget is authorized on an OBJECTIVE, and these rows declare none.\n` +
        `   fix: give each a --goal, then re-sponsor it with --sponsor-who/--sponsor-why`,
    );

  // 🔴 the record is written FIRST, and the flag is stripped SECOND. reverse
  //   the two and a crash between them loses every sponsorship with no trace —
  //   the column is gone and the table that replaced it was never written
  writeFileSync(record, asCsvText(episodes, columns));
  writeFileSync(
    flagged,
    asCsvText(
      rows.map(({ sponsored, ...rest }) => rest),
      Object.keys(rows[0]).filter((c) => c !== 'sponsored'),
    ),
  );
};

/**
 * 🔴 .what = retire `priority.goal` onto `priority.slug` — the CSV half
 *
 * .why  = `setGoalColumnRetired` handles a db that already exists. this handles
 *         the case that has no db at all — a FRESH CLONE, where the csv is the
 *         only thing on disk and the table was built from the new schema, which
 *         has no such column.
 *
 *         ⇒ on that path the db half returns false at once (there is no column
 *           to drop), and without this the restore would hand `setRowsRestored`
 *           a `goal` field the table cannot take. that throws by design — the
 *           mirror refuses to truncate — so a fresh clone of a legacy store
 *           would simply not open.
 *
 * ⚠️ .why it rewrites the slug rather than merely strips the column
 *   to drop the field alone would discard the uri and keep the coined name, and
 *   the coined name is the half that drifted. every edge csv keys on the uri, so
 *   a store whose slugs stayed coined would restore with edges that point at
 *   goals no row declares.
 *
 * ⚠️ .why an absent 'goal' header makes this a no-op
 *   the retirement happens ONCE. a store already converted has no such column,
 *   and a second pass over it must leave every byte as it stands.
 */
export const setStoreGoalRetired = (dbPath) => {
  const named = asStorePath(dbPath, 'priority');
  if (!existsSync(named)) return;

  const rows = asStoreRows(named);
  if (!rows.length || !Object.keys(rows[0]).includes('goal')) return;

  const mute = rows.filter((row) => !row.goal).map((row) => row.slug);
  if (mute.length)
    console.error(
      `⚠️ ${mute.length} row(s) in priority.csv declare no goal, so their slug is left as it ` +
        `stands: ${mute.join(', ')}\n` +
        `   ⇒ a priority IS a goal, and these name none. a uri cannot be invented for them.\n` +
        `   fix: re-set each with --slug '<scheme>://<the uri>'`,
    );

  const columns = Object.keys(rows[0]).filter((c) => c !== 'goal');
  const settled = rows.map(({ goal, ...rest }) => ({ ...rest, slug: goal || rest.slug }));

  // 🔴 SORTED BY SLUG, which is the primary key — the same order
  //   `setStoreDumped` emits (`ORDER BY <pk> ASC`). the rewrite changes the
  //   key on all but a converted row, so the file's prior order is no longer
  //   canonical and an unsorted mirror renders as a whole-file diff on the
  //   very next write
  settled.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));

  writeFileSync(named, asCsvText(settled, columns));
};

export const setDbRestored = (db, dbPath) => {
  // 🔴 the FILES first, before a single `existsSync`. the `spoken` test below
  //   reads an absent file as "the text has not spoken", so a csv still under
  //   its pre-rename name would read as silence and lose every edge it holds
  setStoreFilesRenamed(dbPath);
  setStoreFlagRetired(dbPath);
  setStoreGoalRetired(dbPath);

  // ⚠️ read EVERY store file before a single write. a parse error halfway
  //    through would otherwise leave a partial restore — and a partial
  //    store reads as a complete one (term=partial-audit)
  const asStored = () =>
    getAllStoredTables(db).map((table) => ({
      table,
      path: asStorePath(dbPath, table),
      rows: asStoreRows(asStorePath(dbPath, table)),
    }));

  const tables = getAllStoredTables(db);
  const probed = asStored();

  // 🔴 ABSENT is not EMPTY, and the difference is the whole store.
  //
  //    an absent file means the text HAS NOT SPOKEN — a fresh clone before its
  //    first write, a migration from a prior format, a csv deleted by hand.
  //    an empty file WITH ITS HEADER means the text says "zero rows", and that
  //    is a fact the db must conform to.
  //
  //    ⚠️ without this line the rebuild reads an absent file as zero rows and
  //    DELETES a live db to match it. measured in review, before it ran: the
  //    live store held 36 priorities and 11 gates, and no `.csv` existed yet.
  //
  //    ⇒ so when the text is silent and the db holds rows, the db BOOTSTRAPS
  //      the text rather than the other way round. that is the one direction
  //      where the db may lead, and it fires exactly once per store.
  const spoken = probed.some((s) => existsSync(s.path));
  const held = tables.some((t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n > 0);
  if (!spoken) {
    if (held) setStoreDumped(db, dbPath); // bootstrap the text from the db
    return;
  }

  // 🔴 the shape first, the rows second. an extant db keeps a `gate` with no
  //   foreign key at all, and rows written into it would never be checked
  setEdgeTablesReshaped(db);

  // 🔴 re-derive AFTER the reshape. it DROPS the pre-rename tables, so the
  //   probe above may name a table that no longer exists — and the write loop
  //   below would then insert into naught
  const stored = asStored();

  // 🔴 rekey BEFORE the duplicate check, never after
  //   the check reads each table's key columns, and for an edge table those
  //   ARE the two uuids. to run it first would grade the old keyspace and
  //   miss the one dupe this conversion can create: two slugs whose rows
  //   declare ONE goal collapse to one edge, and the text would show two
  const minted = asStoreRekeyed(stored);

  // 🔴 refuse a DUPLICATE natural key before a single write.
  //
  //    the db's unique constraint means the DUMP can never emit one, so a
  //    dupe in the text is always a TEXT defect — and the reachable cause is
  //    a merge resolution that kept both sides of a conflicted row.
  //
  //    ⚠️ measured 2026-09-14: two lines, one slug, restored to ONE row.
  //    `INSERT OR REPLACE` kept the last and dropped the other in silence.
  //
  //    🔴 and the git diff shows BOTH. review is the whole stated advantage
  //    of text over the binary, and here it MISLEADS — a reviewer approves a
  //    PR that visibly holds two rows, and one is gone from the store with
  //    no error, ever.
  //
  //    ⇒ the text holds an ambiguity the store cannot represent. no rule can
  //      pick a winner without loss of one, so it halts and names the key
  //      (rule.require.failfast, the same shape as the surplus refusal above)
  for (const { table, rows } of stored) {
    const keys = getAllKeyColumns(db, table);
    const asKey = (row) => keys.map((column) => String(row[column])).join('\u0000');

    const seen = new Map();
    for (const row of rows) seen.set(asKey(row), (seen.get(asKey(row)) ?? 0) + 1);
    const doubled = [...seen.entries()].filter(([, count]) => count > 1);

    if (doubled.length)
      throw new Error(
        `✋ ${table}.jsonl holds ${doubled.length} natural key(s) more than once, so the ` +
          `text states two facts where the store can hold one.\n` +
          `   key(s): ${doubled
            .slice(0, 3)
            .map(([key, count]) => `${key.split('\u0000').join(' · ')} (x${count})`)
            .join(', ')}\n` +
          `   on:     ${keys.join(' + ')}\n` +
          `   ⇒ the usual cause is a merge resolution that kept BOTH sides of a\n` +
          `     conflicted row. the diff shows two rows; the store would hold one,\n` +
          `     and no one would be told which was dropped.\n` +
          `   fix:    open ${table}.jsonl, keep the ONE line you mean, delete the other`,
      );
  }

  // 🔴 column names come from the ROW, never from a hardcoded list. a
  //    column added later must ride through the restore without an edit
  //    here, or the mirror quietly drops it on every rebuild
  //
  // ⛔ and do NOT filter these against `PRAGMA table_info`. that repair is
  //    the one a reader reaches for the first time they meet
  //
  //      table priority has no column named <x>
  //
  //    — which happens when the text was written by a NEWER version, or a
  //    column was renamed. the filter makes that error go away by DROPPING
  //    the column: the restore then reports success and the fact is gone
  //    from the store, silently. that is the omission this whole invariant
  //    exists to forbid, and it is the one direction no other clamp sees —
  //    every other axis grades the DUMP, this is the READ BACK.
  //
  //    ⚠️ measured 2026-09-14: with the filter planted, 274 of 276 clamps
  //    stayed green. only `[case49]` caught it
  //
  //    ⇒ the throw IS the guarantee. a mirror this version cannot read
  //      whole must refuse, never truncate (rule.require.failfast)
  const setRowsRestored = (table, given) => {
    for (const row of given) {
      const columns = Object.keys(row);
      db.prepare(
        `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) ` +
          `VALUES (${columns.map(() => '?').join(', ')})`,
      ).run(...columns.map((c) => row[c]));
    }
  };

  // 🔴 the CLEAR and the RESTORE are ONE transaction, and both sit AFTER every
  //    read and every refusal above. a delete that landed and a restore that
  //    threw would leave an EMPTY db reported as a failure — and on a store
  //    whose text is the truth that is recoverable, but it would read as total
  //    loss to whoever hit it
  // 🔴 SILENT is `has not spoken`, and a file with no HEADER has not spoken.
  //
  //   the law above is `ABSENT is not EMPTY`, and it draws EMPTY as "a file
  //   WITH ITS HEADER and no data lines" — the header is what makes the file
  //   a statement at all, because it is what names the columns the statement
  //   is about. a zero-byte file names none, so it says "zero rows" in
  //   exactly the way a blank page says "no news".
  //
  //   ⚠️ measured 2026-09-16 (`.temp/probe-torn.mjs`), on the three shapes:
  //
  //     zero bytes   read as EMPTY  -> 🔴 the table was TRUNCATED
  //     header only  read as EMPTY  -> ✅ correct; the text does say zero rows
  //     absent       read as SILENT -> ✅ the rows survive and the mirror
  //                                     is re-bootstrapped from the db
  //
  //   ⇒ row 1 is the shape a CRASH MID-DUMP leaves: the truncate landed and
  //     the write never did. `setStoreDumped` writes a temp and renames, so
  //     OUR dump cannot produce it — but a disk-full truncate, a `> file` by
  //     hand, and a half-written editor save all can, and each would silently
  //     empty the table exactly as the deleted `goal_sponsorship.csv` did on
  //     2026-09-15, which is the incident the law was written from.
  //
  // ⚠️ this is strictly narrower than the peer guard: a header that parses is
  //    still VOICED with zero rows, so a deliberate "empty this table" is
  //    untouched. only the unreadable file is held back
  const asSpoken = (path) => {
    if (!existsSync(path)) return false;
    const [header] = asCsvRecords(readFileSync(path, 'utf8'));
    return Boolean(header && header.trim());
  };

  const voiced = stored.filter(({ path }) => asSpoken(path));
  const silent = stored.filter(({ path }) => !asSpoken(path));

  db.exec('BEGIN');
  try {
    // ⚠️ `stored`, never `tables`. `tables` was probed BEFORE the reshape, so
    //   on a pre-rename db it still names `gate` — and a DELETE against a
    //   table the reshape just dropped halts the whole restore
    //
    // 🔴 and only the tables the text SPOKE for. the `spoken` guard above is
    //   store-wide: one csv present means "the text has spoken", and every
    //   table is then cleared against its own file — including a table whose
    //   file is ABSENT, which empties it.
    //
    //   that was correct while the store had ONE table and became wrong the
    //   moment it had five. `ABSENT is not EMPTY` is the law that guard
    //   states, and it must hold at the TABLE grain, not merely the store's.
    //
    //   ⚠️ measured 2026-09-15, on the live store: `goal_sponsorship.csv` was
    //     deleted by hand to force a re-dump, the next open read the absent
    //     file as zero rows, and five human-authorized sponsorships were
    //     truncated with no error at all. the four peer csvs were present, so
    //     the store-wide guard saw a store that had spoken.
    //
    //   ⇒ a table whose text is silent is LEFT ALONE, and `setStoreDumped`
    //     then bootstraps its mirror from the db — the same direction, and
    //     for the same reason, as the whole-store bootstrap above
    // 🔴 a silent table is held ALIVE ACROSS the clear, never merely skipped.
    //
    //   skipping its DELETE is not enough, and that is the whole subtlety:
    //   `goal_sponsorship.goal` carries `ON DELETE CASCADE` onto `goal(uuid)`,
    //   so the clear of `goal` — which IS voiced — takes every sponsorship
    //   with it, whatever this loop does. the cascade is the correct shape
    //   for a real delete and the wrong one for a reload.
    //
    //   ⇒ so its rows are read BEFORE the clear and written back AFTER the
    //     voiced restore, once the parents they reference stand again. the
    //     foreign key stays enforced throughout (`PRAGMA foreign_keys` cannot
    //     be flipped inside a transaction anyway, and to flip it would
    //     disarm the one check this rekey exists to buy).
    const kept = silent.map(({ table }) => ({
      table,
      rows: db.prepare(`SELECT * FROM ${table}`).all(),
    }));

    for (const { table } of voiced) db.prepare(`DELETE FROM ${table}`).run();
    for (const { table, rows } of voiced) setRowsRestored(table, rows);
    for (const { table, rows } of kept) setRowsRestored(table, rows);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  // 🔴 a minted uuid is a fact the TEXT does not yet hold, and the text is
  //   truth. leave it undumped and the next open re-mints a rival uuid for
  //   the same uri — so the identity would be reborn on every read and the
  //   edges would point at whichever generation wrote them.
  //
  //   ⇒ that is not durable identity; it is a session-local alias wearing
  //     a uuid's clothes, and it would defeat the whole rekey in silence.
  //
  // ⚠️ this is the SECOND time the db may lead the text, and for the same
  //   reason as the bootstrap above: the text has not spoken on this fact
  //   yet. it fires once per store, and never again once goal.csv exists
  //
  // 🔴 a SILENT table is the third, and the same direction again: its rows
  //   survived the clear above, and its mirror is still absent. so the caller
  //   must dump, or the text stays silent on that table for the life of the
  //   store — and the next hand that deletes a peer csv finds no record of it
  //   in git at all. `setStoreDumped` writes only on a real difference, so
  //   this costs one comparison per table when there is no work to do
  return minted + silent.length;
};

/**
 * .what = refuse a db path that is the debris of a stringified non-string
 *
 * .why  = `ECOWORK_DB` takes a PATH, and node stringifies whatever it is handed.
 *         so a caller that passes an object gets a store at `[object Object]`,
 *         created in silence, in whatever cwd the process happened to hold.
 *
 * 🔴 MEASURED 2026-09-14. a file named `[object Object]` was STAGED for commit
 *    at the repo root — a real sqlite store, the `priority` table, six rows. and
 *    `git log -- .eco/priority.jsonl` shows the mirror has never been committed,
 *    so three of those rows lived in that binary and NOWHERE ELSE on earth. a
 *    `git clean` would have ended them, with no error and no trace.
 *
 * ⇒ the loss is not merely "a binary reached the index". every row written to a
 *   stray store is a row OMITTED from the real one, and neither store complains.
 *
 * 🟡 `[case52]` catches this at the INDEX, which is the symptom and the last
 *    line of defence. this catches it at the WRITE, which is the cause — and it
 *    fires whether or not the repo is a git repo at all.
 *
 * ⚠️ it names debris, never a policy about good paths. `[object ` cannot occur
 *    in a path anyone meant to type, and a basename of exactly `undefined` or
 *    `null` is the same accident with a different input.
 */
export const assertDbPathIsNotDebris = (path) => {
  if (typeof path !== 'string')
    throw new ConstraintError(
      `ECOWORK_DB must be a path string, and a ${typeof path} was handed in.\n` +
        `  ⇒ node stringifies whatever it receives, so this would have created a\n` +
        `    store at a nonsense name rather than fail`,
    );

  const debris =
    path.includes('[object ') ||
    ['undefined', 'null', 'NaN'].includes(path.split('/').pop());

  if (debris)
    throw new ConstraintError(
      `ECOWORK_DB is the debris of a stringified non-string: ${JSON.stringify(path)}\n` +
        `  ⇒ a caller passed an object, undefined, or null where a PATH was\n` +
        `    expected. node stringified it, and without this refusal a whole\n` +
        `    second store would be created there, in silence.\n` +
        `  ⚠️ every row written to a stray store is a row OMITTED from the real\n` +
        `    one, and neither store complains. measured 2026-09-14: a store at\n` +
        `    "[object Object]" held three rows that lived nowhere else.\n` +
        `  fix:  pass the path itself, not the object that holds it —\n` +
        `          ECOWORK_DB=/path/to/priority.db`,
    );
};

/**
 * .what = the ignore rules every store directory owes git — the BINARY CLASS
 *
 * .why  = the csv mirror is the record and must be trackable; the db, its
 *         wal/shm peers, and a stranded dump temp must never reach a commit.
 *         `ECOWORK_DB` takes any path, so each rule names a CLASS, never one file
 */
export const STORE_IGNORE_RULES = [
  '*.db',
  '*.db-shm',
  '*.db-wal',
  '*.sqlite',
  '*.sqlite3',
  '*.tmp',
];

/**
 * .what = findsert the binary-class ignore rules beside the store
 *
 * .why  = the store is adopted by repos this package never sees. a rule a human
 *         must remember to write is a rule most repos never carry — and a repo
 *         that lacks it commits a sqlite binary, which reviews as `Binary files
 *         differ` and merges by one side outright. the store writes its own
 *         rules, so every repo that opens one is correct by construction.
 *
 * .note = rules a human already wrote are kept; only absent ones are appended
 */
export const setStoreIgnoreRulesFound = (dirStore) => {
  const path = join(dirStore, '.gitignore');
  const extant = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const lines = new Set(extant.split('\n').map((line) => line.trim()));
  const absent = STORE_IGNORE_RULES.filter((rule) => !lines.has(rule));
  if (!absent.length) return;

  const lead = extant && !extant.endsWith('\n') ? '\n' : '';
  writeFileSync(path, `${extant}${lead}${absent.join('\n')}\n`);
};
