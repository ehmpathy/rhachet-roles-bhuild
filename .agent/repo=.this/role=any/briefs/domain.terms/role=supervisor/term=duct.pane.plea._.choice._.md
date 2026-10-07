# domain.term: plea

term.chosen   = plea
term.kind     = noun
term.boundary = duct.pane
term.synonyms.forbidden:
- ask
- request
- escalation
- gate
- blocker

## .what

**the clone itself named a human-only gate and printed the command to open it** — the literal
`route.stone.set … --as approved` (or `--as overruled`) found in the pane.

a plea asserts that the **pane holds that line**. it asserts naught about whether the gate is
still open, and the render says `SEEN` for exactly that reason.

```
🔋 cap    the pane holds a vendor quota line        -> join reset-vs-now + still
🙋 plea   the pane holds the clone's own grant cmd  -> join still + stone-not-already-👋
```

## .why it exists — the stone CANNOT report this

a stone records the route's last **settled** transition. the transition that clears an approval
gate is a **human command**. so a clone that has converged and now awaits `--as approved` renders
whatever gate it last stopped at — **indefinitely**, because what would advance it is the very
command nobody has run.

⇒ the stone is not stale by defect. it is stale **by construction**, and no read of the stone can
ever correct it. that is why the fact needs a channel of its own.

## .it is NOT the moved-discriminator's case

`git.crew.poll`'s `STONE_HUMAN_MOVED` asks *"did this duct move THIS poll?"*, which parts a clone
mid-turn from a parked one. the two staleness kinds are **independent**:

| the kind | the clone is | the tell |
|---|---|---|
| **mid-turn** | at work — the stone predates the turn in flight | absent from the still-map |
| **plea** | genuinely parked, correctly still | the pane holds the grant command |

⇒ a clone with a plea is *"still"* in every sense, so the extant discriminator reports it as
honestly parked and routes it by a stone that cannot advance. both tells are owed.

## .plea is NOT

- **`ask`** — the word this was split from, and the reason for the split. `ask` is already a
  `box_kind` in `duct.poll.sh`: a modal whose shape is a question rather than a permission. one
  word, one sense
- **`escalate`** — the act a **supervisor** performs on the clone's behalf. `plea` is what the
  **clone** does. different subject, so not a synonym
- **`gate`** — the genus. a gate exists whether or not a clone ever named it; a plea is the
  clone's own utterance of one
- **a verdict** — the line lives in **scrollback**, so a clone whose gate was granted an hour ago
  still carries it. see `.reason` for why a row that read `AWAITS A GRANT` would be a false-report
- **a permission modal** — that is `box=prompt`, a live keystroke request. a plea needs no key

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `duct.poll.sh` — the `plea` grep, the `$slot.plea` file, and the `🙋 plea SEEN` render arm

## .reason

see `term=duct.pane.plea._.choice.reason.md` — the measured incident it was coined from, why the
word is `plea` and not `ask`, and the open question of whether `plea` and `cap` want a shared
parent term for what they have in common.

---

written by human + beaver 🦫
