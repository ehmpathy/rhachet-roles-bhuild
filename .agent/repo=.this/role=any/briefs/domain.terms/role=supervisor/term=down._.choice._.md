# domain.term: down

term.chosen   = down
term.kind     = adj
term.synonyms.forbidden:
- stopped
- dead
- offline
- idle
- inactive
- killed
- asleep

## .what

a crew whose **work axis is off while its tree still stands** — no live duct, and a worktree on
disk to boot one onto.

```
😶 at work    one or more live ducts
😴 asleep     the GROVE did not answer   -> rhx git.grove.wake <grove>
💀 down       no duct, tree on disk      -> rhx git.crew.boot
👻 phantom    no duct, no tree           -> a felled tree's stale rows
```

it is the third rung of the crew-axis verdict set, and the only one of the four that is
**reversible by a single verb run from HERE**.

## .the property that defines it: RECOVERABLE

`down` is a pause, not an end. the tree, the branch, and the work all survive it — only the
conversation is gone. so every `down` row carries its own cure in the same breath:

```
💀 3 down       — rhx git.crew.boot --tree <tree>
```

that is what parts it from every other off-state in the fleet, and why it renders as an **action
row** rather than as litter.

## .down is NOT

- **`idle`** — an idle crew is AT WORK with an empty input box. a down crew has no duct at all.
  this is the sharpest boundary in the set, because both read as *"naught moves"* from the outside
  and they need opposite cures: an idle clone takes a nudge, a down crew takes a boot
- ⚠️ **`asleep`** — the boundary this term paid for. an unanswered grove yields the same empty
  session list as a live grove with no crews, so **a crew that could not be READ used to land
  here** — and `down`'s own cure would then fail, because `crew.boot` cannot reach a box that is
  not up. the two are parted by the FAILURE of the session-list call, never by its result
  (`term=asleep`)
- **`phantom`** — a phantom has no tree, so there is nowhere to boot. `down` is recoverable;
  `phantom` is litter (`term=duct`)
- **`felled`** — `fell` is terminal and drops the ledger row. `down` keeps it (`term=fell`)
- **`stopped`** — `stop` is one CAUSE of down, never the state itself. see `.reason`

## .⚠️ `down` asserts a crew DIED — so it is only true of a crew that was BORN

the glyph is a skull, and the word means *was up, now is not*. neither is available about a tree
that never held a crew.

on 2026-08-24 a disk-derived poll rendered `💀 down` over **~128 trees that never had a crew** —
142 trees on disk against 14 that were ever booted. every one of those rows cleared both
`false report` discriminators: the tool did not fail, and the content was untrue.

that defect is the whole reason the ledger exists (`term=ledger`), and it binds any instrument
that renders this word:

> **`down` is a claim about a crew's HISTORY, so it may only be derived from a source that records
> history. a set derived from present substance — trees on disk — cannot support it.**

## .the loudest row in the fleet

a `down` crew whose tree is **✋ dirty** is the one state that loses work: the work exists, nobody
is on it, and no instrument other than `git.crew.poll` names it.

```
⚠️  N WORK ORPHANED — a dead crew on a dirty tree. boot it or set the work aside
```

it leads the action list on purpose — every other row is a decision, this one is a countdown.

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `git.crew.poll.sh` — the verdict, its tally, and the orphan row
- `git.crew.boot.sh` — the one verb that lifts it
- `git.crew.stop.sh` — the deliberate way into it
- `term=ledger._.choice.reason.md` — the false-report record this term inherits

## .reason

see `term=down._.choice.reason.md` — etymology, the rejected `stopped`, and the evidence.

---

written by human + beaver 🦫
