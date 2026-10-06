# domain.term.choice.reason: store

## .etymology

a **store** is where a copy is kept — the one you would go to if every other copy were
gone. that is exactly the eco invariant's claim about `.eco/*.jsonl`:

> *"the jsonl can rebuild the db. a db cannot rebuild a git history."*

the word was already load-bearing here before it was ever settled as a term: the invariant
brief's own headline is `define.invariant.eco.the-store-is-plaintext-in-git`.

## 🔴 .the word was INVERTED in code until 2026-09-14

the codebase called the jsonl the **mirror** and the sqlite the **db**. that reads the
authority backwards: a mirror is a reflection of an original, so to call the authoritative
copy a mirror tells every reader that the sqlite is the real one.

the wisher caught it, verbatim:

> *"or i guess, sqlite should be the mirror, plaintext should be the source"*

⚠️ **the behavior was already correct — only the words lied.** `setDbRestored` rebuilds the
db from the jsonl on every cold open, and the jsonl is what git tracks. so this is a rename,
never a re-architecture, which is precisely why it was worth the round: no behavior was at
risk, and the cost only ever rises with each new file that adopts the inverted word.

## .disputes

### dispute: source — raised 2026-09-14 — status: RESOLVED (keep `store`)

- raised.by  = the wisher, in the correction quoted above
- claim      = `source` is the natural peer of `mirror`. the two are idiomatic far beyond
               this repo — a package mirror, a git mirror, an rsync mirror each have a
               *source*. a reader who meets `mirror` expects `source` beside it
- counter    = `store` is already the canonical word HERE, and not incidentally — it is
               the **title** of the invariant that governs this whole subject, and it
               recurs across that brief's body, its enforcement clauses, and the clamp
               names. to adopt `source` is to mint a **second word for a concept that
               already has one**, which is the sprawl `rule.forbid.domain-term-synonyms`
               exists to stop
- resolution = keep `store`; record `source` as a forbidden synonym. the wisher named the
               **concept** — that the plaintext is the authoritative copy — and that is
               what was settled. the word was the prioritizer's call, and it goes to the
               extant one on precedence

⇒ 🟡 **the counter is not a claim that `source` is a worse word.** in a repo with no prior
term it would likely be the better one, because `source`/`mirror` carries its own direction.
it loses here on one ground only: the slot is already occupied.

## .evidence

### the measured inversion

`setStoreDumped` (then `setMirrorDumped`) reads the db and writes the text:

```js
const rows = db.prepare(`SELECT * FROM ${table} ...`).all();
// ... writes asStorePath(dbPath, table)   →  the .jsonl
```

⇒ so the function named for the **mirror** produced the **jsonl**. the word named the
plaintext, and the plaintext is the copy git carries.

### the rename, as applied 2026-09-14

| before | after |
|---|---|
| `setMirrorDumped` | `setStoreDumped` |
| `setMirrorHealed` | `setStoreHealed` |
| `asMirrorPath` | `asStorePath` |
| `asMirrorRows` | `asStoreRows` |
| `getAllMirroredTables` | `getAllStoredTables` |

⚠️ **`setDbRestored` was deliberately NOT renamed.** `db` is an implementation noun that
names the sqlite file concretely and is no synonym of either term, so it carries no
inversion to repair.

**teeth:** the suite read `291 passed, 2 failed` before the rename and `291 passed, 2
failed` after, with the same two human-gated failures — so the rename moved no behavior.
`[case43]` was the one at real risk, since it greps the module source for
`const setMirrorDumped`; it was swept in the same pass and still passes.

## 🟡 .the prose arrears, stated rather than hidden

the **contracts** are renamed. the **prose** is not: roughly 104 occurrences in
the `ecowork.*.integration.test.ts` parts and 86 in the invariant brief still use `mirror` for the
plaintext.

that is deliberate, on two grounds:

1. `rule.forbid.domain-term-synonyms` binds contracts and permits prose to be *"left in
   place until disturbed — no forced mass-rewrite"*
2. 🔴 **a blind sweep would be WRONG in a large share of them.** some occurrences
   legitimately mean the sqlite side, and some mean the act rather than the file. only a
   per-occurrence read can part them, and a sweep cannot

⇒ so the invariant brief carries a **banner** that states the settlement up front, and the
body is fixed forward on contact. a reader who meets the stale word is told, before they
reach it, which way it points.
