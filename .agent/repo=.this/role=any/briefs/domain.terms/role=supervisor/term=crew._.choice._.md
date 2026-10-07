# domain.term: crew

term.chosen   = crew
term.kind     = noun
term.synonyms.forbidden:
- team
- squad
- pair
- worker set
- clone group
- tree agents

## .what

the **set of clones that work ONE tree**.

our standard crew boots ONE clone, and opens ONE seat beside it:

| role | what fills it | what it does |
|------|--------------|--------------|
| `mechanic` | a brained clone, auto-booted | does the work — drives the route, writes the code |
| `foreman` | the human, for now — or a clone the human enrolls ad-hoc | a seat on the tree the supervisor's hands reach through (e.g. `git tree del`) |

⚠️ **the foreman is a SEAT, with no clone to fill it yet.** the human sits in it for now, or
optionally enrolls their own clone ad-hoc — but a foreman clone is NOT part of the standard crew
yet. `crew.boot` opens the seat as a bare shell (`duct.open`) and resumes a claude only into the
mechanic (`--resume mechanic`). so the seat does not observe, converge, approve, or answer a modal
on its own — nobody is home unless a human or an ad-hoc clone sits down. ⇒ a foreman at a `➜`
prompt is HEALTHY, its normal state — never a husk
(`define.invariant.crew.husk.discriminator-parity`), and never resumed.

a crew is bound 1:1 to a tree, which is itself 1:1 with a branch and a pr
(`rule.require.one-pr-per-worktree`). so the chain is:

```
crew  ↔  tree  ↔  branch  ↔  pr
```

## .the two halves a crew is made of

this is the distinction the word most needs, because the destructive mistakes live in the
gap between them:

| half | what it is | where it lives | reversible? |
|------|-----------|----------------|-------------|
| **work** | one duct per role — the role's shell, plus a brain's conversation where a role has one | tmux | ⛔ no |
| **view** | one kitty tab per role — how a human watches | kitty | ✅ yes |

⚠️ **only a brained role holds a conversation to lose.** the mechanic's duct carries a shell AND a
claude conversation, so its work is irrecoverable once stopped. the foreman's duct is a shell only
— stopping it loses no conversation, because there was never one.

a crew can lose its whole VIEW and be entirely unharmed; it cannot lose a brain's WORK and be
recovered. that asymmetry is why the four single-axis verbs — `boot` / `stop` / `show` / `hide` —
split along work-vs-view rather than along on/off.

## .the verbs

| axis | turn on | turn off |
|------|---------|----------|
| work | `crew.boot` | `crew.stop` |
| view | `crew.show` | `crew.hide` |
| **existence** | *(rides on `crew.boot`)* | **`crew.fell`** |
| BOTH work + view | `crew.open` | *(none — on purpose)* |

plus `crew.list` — every tree that has a crew, and which roles are up.

each **single-axis** verb on the work and view rows has an exact inverse, and those pairs never
cross. the existence row is the one asymmetry, and it is deliberate — see below.

### the third axis, and why it has no on-verb of its own

work and view are **states** a crew moves between; existence is not. a crew that does not exist
has nobody to send a verb to, so its on-side cannot be a verb a caller invokes against a crew —
it has to be the act that MAKES one.

that act is `crew.boot`, which does double duty: it brings the work up **and** writes the ledger
row that says this crew was ever born (`term=ledger`). so existence has no dedicated on-verb; it
rides on the work axis' on-verb.

`crew.fell` is the only verb that ends it — the tree, the branch, and the record, in that order
(`term=fell`). the order carries the safety property: where the gate refuses, the ledger row
**stays**, because a crew whose tree still stands is still a crew.

so the three off-verbs act on three lifetimes at three wildly unequal costs, and that spread is
why they are three verbs rather than one flag:

| verb | the axis | the cost |
|---|---|---|
| `hide` | the view | free — reversible with `crew.show` |
| `stop` | the work | ends a claude conversation for good |
| `fell` | existence | ends the tree, the branch, the record |

⚠️ **this table omitted `fell` until 2026-08-25**, while `git.crew.fell.sh` had shipped — so the
file was a false report about its own verb surface, which is the second time this exact table has
been one (see the boot/tab note below).

`crew.open` is the composite front door: a findsert on each axis, so a caller reaches "at work
and in view" without a read of which half is already up. it has **no inverse** by design — the
two off-verbs cost wildly unequal amounts (`hide` is free, `stop` ends a claude conversation for
good), so a composite off would bundle the cheap act with the irreversible one. the convenience
is offered only in the direction where it is free.

the axes are strict: **`crew.boot` opens no tab, and `crew.show` touches no duct.** `crew.open`
is the only verb that reaches both. that was not always true of the code — boot opened tabs
inline until 2026-08-09, which made this very table a false report about its own mechanism.

`crew.boot` was `crew.open` until 2026-08-09. **`open` remains a forbidden synonym of `boot`** on
the work axis: it does not pair with `stop`, and it overlaps in sense with `show` — so the reader
who wants a window reaches for the verb that ends a conversation. you boot a machine; you do not
boot a window.

**the word was later revived for the COMPOSITE**, later the same day, and the second dispute
records why it no longer carries that defect: the objection was that `open` sends a reader to the
wrong axis, and a verb that reaches BOTH axes has no wrong axis to send them to. reach for `open`
when you want a window and you get the window — plus the work, if it was down. both disputes are
in `term=crew._.choice.reason.md`.

## .the four states a poll renders

the verbs above are what a caller DOES. these are what a sweep SEES — the work axis, read from
outside:

| verdict | what it means | its term |
|---|---|---|
| `😶 at work` | one or more live ducts — the ONLY one that must be proven | `term=at-work` |
| `😴 asleep` | the GROVE did not answer — a claim about the READ, not the crew | `term=asleep` — paved 2026-09-03 |
| `💀 down` | no duct, tree on disk — reversible by `crew.boot` | `term=down` |
| `👻 phantom` | no duct, no tree — a felled tree's stale rows | `term=phantom` — paved 2026-08-28. this cell flagged the gap for ~15 rounds before it was filled |

⚠️ **`down` is not the same as an IDLE clone.** an idle clone holds a live duct and an empty box —
it is `at work` and awaits a word. the two read alike from outside and take opposite cures: a
nudge versus a boot.

⚠️ **`asleep` is the only row whose cure runs on ANOTHER MACHINE**, and it is why the row exists:
an unanswered grove yields the same empty session list as a grove with no crews, so its crews used
to land on `down` — whose `crew.boot` cannot reach a box that is not up. **this table said three
states for a full round after the fourth shipped**, which is the third time it has been a false
report about its own surface (see the boot/tab note and the `fell` note above).

## .a crew is NOT

- **a fleet** — a fleet is every crew across every tree; a crew is one tree's worth
- **a tree** — a tree is the worktree/branch/pr; a crew is who is on it. a tree can have
  no crew (felled, or not yet booted), and a `crew.stop` leaves its tree wholly untouched.
  ⚠️ `crew.fell` is the one exception, and it is not a counter-example: a crew is felled
  **through** its tree, so that verb reaches the tree by design (`term=fell`)
- **a clone** — a clone is one worker; a crew is the set

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `work/crewwork.sh` — the eight operations
- `git.crew.open.sh` · `git.crew.boot.sh` · `git.crew.stop.sh` · `git.crew.show.sh` ·
  `git.crew.hide.sh` · `git.crew.fell.sh` · `git.crew.list.sh` · `git.crew.ledger.sh` —
  the skill surface
- `git.crew.poll.sh` — the fleet read over every crew (`term=poll`)
- `define.work-primitive-hierarchy.md` — where a crew sits in the stack

## .reason

see `term=crew._.choice.reason.md` — etymology, the rejected synonyms, and the evidence.
