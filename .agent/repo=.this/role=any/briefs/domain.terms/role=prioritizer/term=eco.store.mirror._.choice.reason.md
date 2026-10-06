# domain.term.choice.reason: mirror

## .etymology

a **mirror** shows what is already there. it holds no fact of its own, it is not consulted
when the original is at hand, and it can be broken with no loss beyond the reflection.

every one of those is true of `.eco/*.db`, and none is true of `.eco/*.jsonl`.

the word is the wisher's, verbatim:

> *"or i guess, sqlite should be the mirror, plaintext should be the source"*

## 🔴 .the word was on the WRONG file, and the direction is what gives it away

the codebase applied `mirror` to the jsonl. the give-away is the restore path: on a cold
open, `setDbRestored` reads the **jsonl** and writes the **db**. a reflection is built from
an original, so whichever file is *read* in that step is the original.

| the step | reads | writes | ⇒ the original is |
|---|---|---|---|
| restore, on a cold open | `.jsonl` | `.db` | the **jsonl** |
| dump, after every write | `.db` | `.jsonl` | — |

⚠️ **the dump line is what made the inversion plausible**, and it is a trap. it does read
the db, but only because the db is where the write just landed. the restore is the
direction that settles authority, because it is the one that runs when a file is **gone**:
delete the db and it comes back; delete the jsonl and the rows are gone from every clone.

## .disputes

### dispute: cache — raised 2026-09-14 — status: RESOLVED (keep `mirror`)

- raised.by  = the prioritizer, against its own prior prose. the invariant brief and the
               pre-commit clamp both described the db as *"a derived, gitignored cache"*,
               so the settlement of `mirror` onto the same file left two words on one
               concept — the sprawl `rule.forbid.domain-term-inconsistency` grades a blocker
- claim      = `cache` states the property that matters most operationally: **safe to
               delete**. a reader who meets `cache` knows at once that no recovery is owed
- counter    = `cache` also carries a property this file does NOT have. a cache may be
               **partial** and may be **stale by design** — that is what caches are for.
               the eco db is neither: `setStoreHealed` and `setDbRestored` between them
               force the two copies to converge on every open, and a db that holds a row
               the store lacks is a **refusal**, not an accepted staleness. so `cache`
               understates the guarantee
- resolution = keep `mirror`; record `cache` as a forbidden synonym. it was also the
               wisher's explicit word for this file, which settles a close call

⇒ 🟡 **the nuance `cache` carried outlives the word that carried it.** the `.what` states
*"safe to delete at any moment"* in plain prose, so the property survives.

## .evidence

### why the mirror may be thrown away, checkably

`[case29]` provisions a store, deletes the db, reopens, and asserts every row returns.
`[case41]` does the same against a db torn mid-write. both pass, which is what converts
*"the mirror is derived"* from a claim into a measurement.

### why the store may NOT

measured 2026-09-14 in this repo:

```
git log -- .eco/priority.jsonl     →  no commits
.eco/priority.jsonl   disk=36   carried=29   omitted=11
```

⇒ eleven rows sat in a work tree and in no commit. **no mirror could have rebuilt them** —
a mirror is rebuilt *from* the store, so a store that never reached a commit is a store no
clone ever sees. that asymmetry is exactly why the two words must not be swapped.

## 🟡 .the arrears this term names

the file `.husky/check.eco.store.sh` was written as `check.eco.mirror.sh` on the day before
this settlement and renamed with it. any future artifact that carries `mirror` in a name
should be read against `.what` above: if it acts on `.eco/*.jsonl`, the word is wrong.
