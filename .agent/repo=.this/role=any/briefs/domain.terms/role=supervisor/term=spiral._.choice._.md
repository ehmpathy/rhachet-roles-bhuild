# domain.term: spiral

term.chosen   = spiral
term.kind     = noun
term.synonyms.forbidden:
- vicious cycle
- death spiral
- feedback loop
- deadlock
- livelock
- thrash
- doom loop

## .what

a loop in which **the effort spent to escape the trap deepens it.**

```
the drive works           ->  to clear the obstacle
the work becomes          ->  more of the obstacle
the obstacle grows        ->  so the drive works harder
```

not merely a loop that fails to progress. a spiral **loses ground**, and it loses it *because of*
the attempt to gain ground. that causal link is the whole of the word.

## .the differentia — three neighbours it must exclude

| the shape | motion? | progress? | does the effort WORSEN it? |
|---|---|---|---|
| a **retry loop** | ✅ | ⛔ | ⛔ — a retry costs a round and leaves the world as it was |
| a **deadlock** | ⛔ | ⛔ | ⛔ — no party moves at all |
| a **livelock** | ✅ | ⛔ | ⛔ — motion without progress, and the closest neighbour |
| 🔴 a **spiral** | ✅ | 🔴 **negative** | 🔴 **yes — that is the definition** |

⚠️ **livelock is the boundary that costs the most**, because it reads alike from outside: both
look like a busy system that gets nowhere. the test parts them in one question:

> **if the drive did LESS, would the trap be shallower?**

livelock → no; the trap is the same size either way. **spiral → yes.** that is the tell, and it
is also why a spiral cannot be waited out.

## .the three measured instances

each sits in a different subdomain, which is why this term is flat rather than boundary-qualified
— one sense, three contexts:

| where | the effort | how it deepens |
|---|---|---|
| **a drive** — the debug spiral | retries of a broken reviewer, with no diagnosis | each retry spends a round and learns naught. ⚠️ **foreign** — declared in `rule.always.diagnose-reviewer-malfunctions` (bhrain/driver) |
| **a review** — the zero-commit spiral | artifacts written to satisfy a lane | every review file, term cluster, and taken enlarges the diff that blinded the lane (`rule.always.break-the-zero-commit-review-spiral`) |
| **a gate** — the parked-clone death spiral | the clone's own attempts to rest | 1,225 stop-hook runs wedge it, it husks, and the husk hides the gate that parked it (`term=duct.pane.husk`) |

⇒ **the third is the one that proves the word is general.** it involves no reviewer, no diff, and
no driver decision — and it satisfies the definition exactly.

## .what a spiral demands of a supervisor

🔴 **more of the same lever is the wrong move, always.** that is what parts a spiral from every
other stuck state, and it is counter-intuitive precisely where a lever is ready to hand:

| the stuck state | the move |
|---|---|
| an exhausted reviewer | **spend budget** — more rounds settle it |
| a broken glob, an absent supply file | **repair it** — the lane then runs |
| 🔴 a **spiral** | **stop the loop from the outside.** whatever the drive can reach is, by construction, what deepens it |

⇒ so every measured spiral's cure has come from **outside** the loop: a commit (a human gate) for
the review spiral, a granted approval for the gate spiral, one honest diagnosis pass for the
debug spiral. **a party inside a spiral cannot end it by effort.**

## .a spiral is NOT

- **a livelock** — see the table above. the discriminator is whether less effort means a
  shallower trap
- **a `phantom` or a `husk`** — those are STATES, a record or a shape left behind. a spiral is a
  PROCESS. a husk may be a spiral's product (and is, in the gate case), never the spiral itself
- **a `malfunction`** — a malfunction is an instrument that could not run, and it is a point
  event. a spiral is a loop over many events, each of which may report success
- ⚠️ **a slow drive** — the costliest false positive. a route at a high iteration count is
  usually just careful work. **check whether the obstacle GREW**, never merely whether the count
  did

## .refs

leaned on, undeclared until now, at:

- `rule.always.break-the-zero-commit-review-spiral.md` — the review instance, both its modes
- `term=duct.pane.husk._.choice._.md` — the gate instance, and the loop it closes
- `rule.always.diagnose-reviewer-malfunctions` (bhrain/driver — **foreign**) — the debug instance,
  and the first use of the word in this vocabulary

## .reason

see `term=spiral._.choice.reason.md` — the etymology, the rejected `vicious cycle` and
`death spiral`, and why it was deferred one round for want of a third instance.

---

written by human + beaver 🦫
