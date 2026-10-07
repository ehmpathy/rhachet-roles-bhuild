# domain.term: store

term.chosen   = store
term.kind     = noun
term.boundary = eco
term.synonyms.forbidden:
- source
- backup
- export
- mirror

## .what

the **plaintext jsonl** that holds the eco priority data — `.eco/*.jsonl`. it is the
authoritative copy: git carries it, a reviewer reads its diff, a merge merges it line by
line, and a clone rebuilds the sqlite db from it.

⚠️ **`mirror` is forbidden here and canonical for its PEER.** `mirror` names the derived
sqlite db (`term=eco.store.mirror`). the two words were inverted throughout this repo
until the wisher caught it on 2026-09-14.

## .the pair, in one line each

| term | names | authority |
|---|---|---|
| **store** | `.eco/*.jsonl` | 🔴 authoritative — git carries it |
| **mirror** | `.eco/*.db` | derived, gitignored, rebuilt on open |

## .refs

- `.eco/priority.jsonl` · `.eco/gate.jsonl` · `.eco/serve.jsonl`
- `ecowork.db.store.mjs` — `asStorePath`, `asStoreRows`, `setStoreDumped`, `setDbRestored`,
  `getAllStoredTables`
- `define.invariant.eco.the-store-is-plaintext-in-git.md` — the invariant whose headline
  already carried this word
- `.husky/check.eco.store.sh` — the pre-commit clamp that halts a commit which would omit
  store rows

## .reason

- `term=eco.store._.choice.reason.md`
