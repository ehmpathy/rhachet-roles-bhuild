# define.invariant.eco.the-store-is-plaintext-in-git

## .what

> **the store is the PLAINTEXT in git. the sqlite file is a derived MIRROR, and it is ignored.**

every write dumps `.eco/<table>.csv` for **every table the schema declares**; every open
rebuilds the db from them. `.eco/priority.db` is gitignored and disposable.

| term | names | authority |
|---|---|---|
| **store** | `.eco/*.csv` | 🔴 authoritative — git carries it, a reviewer diffs it, a merge merges it |
| **mirror** | `.eco/*.db` | derived, gitignored, rebuilt from the store on every open |

⇒ **which file you may delete is the test of which one is the store.** delete the mirror and
it comes back; delete the store and the rows are gone from every clone.

⚠️ some code comments still say `mirror` or `jsonl` where they mean the plaintext. the
**contracts** are correct (`setStoreDumped`, `asStorePath`, `asStoreRows`,
`getAllStoredTables`). the full settlement is in `glossary.of=prioritizer.md`.

## .kind

🟡 **nurture.** sqlite is a fine file to back up. we carry the plaintext because a binary
store cannot be reviewed, merged, or restored from history.

## .the invariant

```
write(db)        ⇒  dump(csv) inside the transaction, then COMMIT
open(db)         ⇒  rebuild(db) from csv, per table, unconditionally
rm(priority.db)  ⇒  loses naught. the next call rebuilds it
rm(*.csv)        ⇒  🔴 loses the store
```

⇒ the direction — text first, text always wins — is settled in
`define.invariant.eco.the-csv-is-truth-the-db-is-a-cache`.

## 🔴 .why — two failures, and the second earns the invariant

**1. an uncommitted store has no backups.** measured 2026-09-13: `.eco/` was untracked — a
56K sqlite file with zero copies. one `rm -rf` and every judgment in it was gone.

**2. 🔴 the obvious repair — `git add priority.db` — is worse:**

| defect | what it costs |
|---|---|
| `Binary files differ` | no review — a diff cannot show an `urg` moved from 3 to 9 |
| 🔴 **git settles a binary conflict to ONE SIDE, silently** | the other branch's rows are dropped with no marker. a merge that reports success has deleted work |
| a whole-blob rewrite per edit | 56K into history for a one-field change |

⇒ row two is the argument: a silent data-loss engine that fires exactly when two people
prioritize in parallel. the plaintext inverts all three — a diff shows the field, a conflict
raises a marker on the line, a one-field edit rewrites one line.

## .why the text is line-oriented and stably ordered

| property | why |
|---|---|
| **line-oriented** | one row per line, so a conflict is scoped to the row that changed |
| **stably ordered** | dumped `ORDER BY` each table's primary key (from `PRAGMA table_info`), so the same state yields byte-identical files |
| **header-keyed** | the reader keys on the header, so a new column needs no format migration |

why csv rather than jsonl: `define.invariant.eco.the-csv-is-truth-the-db-is-a-cache`.

## .why the db is DERIVED

> **the text can rebuild the db. a db cannot rebuild a git history.**

the one that can be regenerated is the index. so the db is ignored, and a reader who wants
to know what the store holds reads the text.

## 🔴 .the axes — each a way the text can silently stop to be the store

> **derive every subject set — tables, columns, verbs, db-openers — never list it by hand.**
> a hand list drifts one way: a member is added, the list keeps its old names, and the check
> exits 0 over a partial set.

each axis was earned by a measured hole, and each has a clamp in
`ecowork.{mirror,commit,migrate,quant}.integration.test.ts`:

| # | axis | the guarantee | clamp |
|---|---|---|---|
| 1–2 | table + column | the table set comes from `sqlite_master`; the column set from the row | `[case38]` |
| 3 | verb | every write verb dumps. a verb with no fixture FAILS the clamp | `[case40]` |
| 4 | time | a crash between the dump and the commit loses no write | `[case41]` |
| 5 | type | a column holds only what the text carries back — no `BLOB`, `NUMERIC`, or untyped column | `[case42]` |
| 6 | atomicity | write a temp in the same dir, then rename. never truncate in place | `[case43]` |
| 7 | reader | an unknown flag is refused, never dropped | `[case44]` |
| 8 | reachability | git tracks every store file, in the work tree AND the carried rules; the binary class is ignored | `[case45]` |
| 9 | commit path | the pre-commit hooks let the store through | `[case46]` |
| 10 | branch switch | the arrived branch's text rebuilds a stale db; a human's committed edit is never reverted | `[case47]` |
| 11 | value bytes | a newline, quote, comma, or emoji survives a round trip through the codec | `[case48]` |
| 12 | forward compat | text under an older schema rebuilds; an unknown column is refused, never filtered | `[case49]` |
| 13 | ambiguous text | two lines under one key are refused, never collapsed | `[case50]` |
| 14 | merge attributes | no `.gitattributes` rule gives the store `merge=`, `-text`, `binary`, or `-diff` | `[case51]` |
| 15 | no binary in index | no indexed blob starts with the sqlite magic bytes | `[case52]` |
| 16 | it ran | the carried text in THIS repo equals the store, row for row | `[case53]` |
| 17 | debris path | a stringified non-string db path is refused before the mkdir | `[case54]` |
| 18 | two processes | a per-process temp name; a `busy_timeout` only with a guard over the dump | `[case55]` |
| 19 | one door | no second production program opens the db. a read uses the text | `[case56]` |
| 20 | intake | every flag the parser fills reaches a column | `[case57]` |

⇒ the measured incident behind each axis:
`ehmpathy/rhachet-roles-bhuild:.agent/repo=.this/role=any/briefs/evidence/role=prioritizer/`.

## .what would overturn it

- **a binary format git can merge row-wise** — the review and conflict arguments fall
- **a store too large for a text dump** — a rewrite per write is O(rows); at a million rows
  the answer is an append log with compaction. ⚠️ neither is close: the store holds tens of rows

## .enforcement

- a `.db`, `.sqlite`, or other binary store **in the index**, at any path = **blocker**
- a write path that mutates the db and does **not** dump = **blocker**
- a **hand-written** list of tables, columns, verbs, or db-openers — in code or a clamp = **blocker**
- a dump with no `ORDER BY`, or written without temp-then-rename = **blocker**
- an ignore or attributes rule that hides, one-sides, or un-diffs `.eco/*.csv` = **blocker**
- an ignore rule that names the binary store by its **literal filename** = **blocker**
- a flag accepted that reaches no column = **blocker**
- a clamp on a refusal with no twin clamp on the case that must still pass = **blocker**

## .see also

- `define.invariant.eco.the-csv-is-truth-the-db-is-a-cache` — the direction, the write order, the absent-vs-empty clause
- `ecowork.db.store.mjs` — `getAllStoredTables`, `setStoreDumped`, `setDbRestored`
- `ecowork.db.mjs` — the call order in `genDb` and `main`
- `glossary.of=prioritizer.md` — `store`, `mirror`

---

written by human + beaver 🦫
