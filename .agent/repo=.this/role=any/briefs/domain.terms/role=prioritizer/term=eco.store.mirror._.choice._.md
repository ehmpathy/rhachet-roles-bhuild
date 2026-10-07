# domain.term: mirror

term.chosen   = mirror
term.kind     = noun
term.boundary = eco.store
term.synonyms.forbidden:
- cache
- snapshot
- replica
- store

## .what

the **derived sqlite db** that reflects the eco store — `.eco/*.db`. it is gitignored,
rebuilt from the store on any cold open, and safe to delete at any moment.

it exists for one reason: **query speed**. no fact lives here that the store does not
already carry, so a mirror thrown away costs naught but the rebuild.

⚠️ **`store` is forbidden here and canonical for its PEER** (`term=eco.store`). the two
words were inverted until 2026-09-14 — the code called the *jsonl* the mirror.

## .the direction is one-way, and it is the whole point

```
store (.jsonl)  ──restore──▶  mirror (.db)      a cold mirror is rebuilt from the store
mirror (.db)    ──dump────▶  store (.jsonl)     every write re-emits the store
```

⇒ a mirror can always be regenerated. **a store cannot** — its history lives in git and
nowhere else.

## .refs

- `.eco/priority.db` · `.eco/gate.db` (and their `-wal` / `-shm` peers)
- `ecowork.db.mjs` — `genDb` · `ecowork.db.store.mjs` — `setDbRestored`
- `.eco/.gitignore` — the rules that keep every mirror out of a commit
- `define.invariant.eco.the-store-is-plaintext-in-git.md`

## .reason

- `term=eco.store.mirror._.choice.reason.md`
