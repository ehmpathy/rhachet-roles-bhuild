# define.invariant.eco — the CSV is truth. the db is a cache

## .what

```
.eco/*.csv        🔴 THE STORE. authoritative. git carries it. reviewed, merged, diffed
.eco/*.db         a CACHE. derived, gitignored, rebuilt from the csv on every open
```

> **a fact is IN the store ⟺ it is in the csv.**

the db exists for two reasons only: **relational constraints** (FK, DAG, unique keys) and
**fast gets**. a query engine over the text, never a second copy.

## .kind

**nurture.** a db with a text export is the ordinary shape. we chose the reverse, and paid
for the lesson.

## 🔴 .the write order — the TEXT COMMITS FIRST

```
BEGIN
  …mutate the db…
  setStoreDumped()      ← 🔴 the text lands HERE, inside the transaction
COMMIT
```

| the crash lands… | text | db | outcome |
|---|---|---|---|
| before the dump | no | no | no success reported; both agree ✅ |
| after the dump, before COMMIT | **yes** | no | next open rebuilds from text; **the write survives** ✅ |
| the dump throws | no | rolled back | the caller is told ✅ |

⇒ **the db can never be ahead of the text**, so the open path rebuilds unconditionally.
🟡 residual: a dump that lands and a `COMMIT` that fails reports failure while the write
survives — a false negative. a report that understates is the one to prefer.

## 🔴 .the defect this was written from

measured 2026-09-14, invisible to all 21 clamp axes:

```
text before : the original words
text edited : EDITED BY A HUMAN IN GIT     ← a field edit, same natural key
get rc      : 0                            ← exit 0. no complaint.
text after  : the original words           ← 🔴 SILENTLY REVERTED
```

the restore was gated on `if (held) return`, so a populated db was never rebuilt and a
human's committed edit lost to the cache. every clamp graded db → text; this loss ran
text → db.

### 🔴 the cure is to have NO comparison

a first repair compared `set_at` and healed the side behind. it fails where it matters:

| divergence | `set_at` | can an order decide it? |
|---|---|---|
| crash between COMMIT and dump | db newer | ✅ |
| a pull lands a peer's later write | text newer | ✅ |
| 🔴 a human edits `sev` in a PR | **equal** | ❌ |

the last row is the point of a plaintext store, and it leaves no clock trace. ⇒ **the text
is truth, the db conforms, always.** no direction is left to get wrong.

## .the standard shape this matches

git's `clean` / `smudge` filter pair
([gitsqlite](https://github.com/danielsiegl/gitsqlite),
[ongardie](https://ongardie.net/blog/sqlite-in-git/),
[trenta3](https://trenta3.gitlab.io/note:storing-sqlite-databases-under-git/)):

| | filter pair | ours |
|---|---|---|
| db → text | `clean`, on `git add` | `setStoreDumped`, inside the write transaction |
| text → db | `smudge`, on checkout | `setDbRestored`, on every open |
| who decides direction | git, by operation | 🔴 naught decides — the text always wins |

⚠️ we do not use git's filter mechanism itself: a clone with unconfigured filters gets
silence. the rebuild lives in the module, so it cannot be un-configured.

## 🔴 .why CSV, not jsonl — the merge decides it

both merge by line. a jsonl conflict repeats every key (~1535 chars a row); a csv declares
keys once in the header. ⇒ a conflict a human settles **by eye** is the whole advantage of
text, and repeated keys spend it on syntax.

### the null hazard, and why it does not apply

csv cannot tell `null` from `''`. measured 2026-09-14 over the live store:

```
columns that hold NULL : 5 / 22   (quant cash/time, kind)
columns that hold EMPTY: 0        ← the decisive line
values with a COMMA    : 45       → RFC4180 quotes, exercised
values with a QUOTE    : 24       → doubled, exercised
values with a NEWLINE  : 0
```

not luck: the payload builder drops empty values (`with_entries(select(.value != ""))`), so
`''` is **unstorable by construction** and an empty field means null.

the reader keys on the **header**, never position, so a new column rides in with no edit.

## 🔴 .ABSENT is not EMPTY

an **absent** csv means the text has not spoken. an **empty csv with its header** says
*"zero rows"*, and the db conforms. without this clause, the rebuild would read an absent
file as zero rows and delete a live db — caught in review, when the store held 36 priorities
and no `.csv` yet. ⇒ when the text is silent and the db holds rows, the db **bootstraps** the
text, once per store.

### 🔴 the grain is the TABLE, never the store

measured 2026-09-15, and it cost live data. the clause was `probed.some(existsSync)` — *has
the store spoken?*:

```
.eco/priority.csv            present   ← the store HAS spoken
.eco/goal_sponsorship.csv    ABSENT    ← this TABLE has not
⇒ the absent table is read as ZERO ROWS
```

**five live sponsorships were truncated**, exit 0. ⇒ each table answers *"have I spoken?"*
for itself.

### 🔴 a per-table skip is not enough — `ON DELETE CASCADE` reaches past it

```sql
goal_sponsorship.goal REFERENCES goal(uuid) ON DELETE CASCADE
```

`goal` is voiced, so its `DELETE FROM goal` takes every sponsorship with it.

| the move | outcome |
|---|---|
| skip the silent table's own `DELETE` | 🔴 still emptied by the cascade |
| `PRAGMA foreign_keys` off | ⛔ refused inside a transaction, and disarms the FK |
| 🔴 **snapshot its rows before the clear, re-insert after the voiced restore** | ✅ parents stand again, FK never relaxed |

### 🔴 a silent table must also force a DUMP

the caller dumps only on a truthy restore. a restore that merely preserves rows returns `0`,
so the absent csv would stay absent forever. ⇒ the return is `minted + silent.length`;
`setStoreDumped` writes only on a real difference.

## .what this deletes

| gone | why |
|---|---|
| `setStoreHealed` | it repaired a db that was ahead — now unreachable |
| the subset/surplus discriminator | it inferred a direction — now declared |
| the `set_at` tiebreak | it ranked two sides — now one |
| the branch-switch refusal | a stale db is overwritten by the arrived text |

⇒ **a rule that must guess will guess wrong.** each deletion removed an inference.

## .enforcement

- the db read as authoritative over the csv, in any path = **blocker**
- a dump **after** `COMMIT` = **blocker** (the db could lead, so the rebuild becomes lossy)
- a restore gated on the db being empty = **blocker** (that line WAS the defect)
- a comparison that picks a winner = **blocker** (the winner is declared, not derived)
- an **absent** file treated as **zero rows** = **blocker**
- an absent/empty probe at the **store** grain with more than one table = **blocker**
- a silent table skipped from the clear with no snapshot, where a voiced table cascades onto it = **blocker**
- a restore that preserves a silent table and returns `0` = **blocker** (the mirror is never minted)
- an empty string written to any column = **blocker** (null encode depends on `''` unstorable)
- a csv with no header row = **blocker** (reads as *"no data"*, not *"never spoke"*)

## .see also

- `define.invariant.eco.the-store-is-plaintext-in-git` — the parent invariant and its 21 clamp axes
- `ecowork.db.store.mjs` — `asCsvText` / `asStoreRows`, `setStoreDumped`, `setDbRestored`
- `ecowork.db.mjs` — `main`
- `.dream/v2026_09_14.feat.the-csv-becomes-an-event-stream-compacted-onto-a-snapshot.md` — the next rung
- `rule.require.failfast` (mechanic) — why a refusal beats a guess

---

written by human + beaver 🦫
