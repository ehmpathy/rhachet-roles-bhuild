# domain.term: ledger

term.chosen   = ledger
term.kind     = noun
term.synonyms.forbidden:
- registry
- log
- history
- index
- cache
- manifest
- record book

## .what

a **durable record that a subject EXISTED**, kept apart from any record of whether it is live.

```
~/.crewwork/crews/<tree>.json    one row per tree a crew was ever booted on
```

written on creation, **never removed on teardown**. only the terminal act — a `fell` — drops a row.

## .the property that defines it: EXISTENCE outlives LIVENESS

a ledger exists because two questions have different lifetimes and cannot share one source:

| the question | the source that answers it | lifetime |
|---|---|---|
| is it **at work** right now? | live tmux | seconds |
| does it hold a **duct** right now? | the duct registry | until `duct.stop` |
| was it **ever** created? | **the ledger** | until the tree is felled |

the duct registry cannot answer the third, and the reason is mechanical:
`__duct_unregister_duct` does an `rm -f` **and** rmdirs the parent. so **the evidence is destroyed
by the very act whose history you want to read.** a stopped crew becomes byte-identical to a tree
that never had one.

## .a ledger is NOT

- **a registry** — a registry says what is REGISTERED NOW, and is erased on teardown. that is the
  exact half a ledger exists to complement. `~/.ductwork/ducts/` is a registry; this is not
- **a log** — a log is append-only and holds every event. a ledger holds one row per subject and
  upserts it (`bootedFirst` preserved, `bootedLast` refreshed), so it converges rather than grows
- **a cache** — a cache is derived and may be rebuilt from its source. a ledger IS the source; no
  other artifact can reconstruct it, which is why its backfill is permanently incomplete
- **a history** — it says a subject existed, never what happened to it

## .the canonical key

rows are keyed by the **canonical dotted tree name** (`__crew_canon_name`), because tmux forbids
`.` in a session name and silently writes `_`. an unkeyed ledger would carry two rows for one crew
— the same double-registration that makes `duct.poll` report one pane twice with verdicts that can
disagree (`term=false-report`).

## .⚠️ a backfilled ledger is not a history

a ledger seeded after the fact recovers only what has not yet been erased. every subject created
**and** torn down before the ledger existed left no trace, and none is recoverable.

so a backfilled ledger is complete **only from its own creation forward**, and a count read as
history is a `partial audit`. the instrument must say so in its own output — `git.crew.ledger`
prints the caveat on every backfill rather than let the number read as a total.

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `work/crewwork.sh` — `__crew_ledger_set` · `__crew_ledger_del` · `__crew_ledger_list` · `crew.ledger`
- `git.crew.ledger.sh` — the read and the backfill
- `git.crew.boot.sh` — writes the row, after the ducts come up
- `git.crew.fell.sh` — drops it, and only on a confirmed tree removal
- `git.crew.poll.sh` — derives its subject set from it

## .reason

see `term=ledger._.choice.reason.md` — etymology, the rejected `registry`, and the evidence.

---

written by human + beaver 🦫
