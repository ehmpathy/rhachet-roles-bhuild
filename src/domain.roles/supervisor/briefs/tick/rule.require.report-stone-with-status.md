# rule.require.report-stone-with-status

## .what

whenever you report, tally, or route on a crew's route state, name the **stone** it sits at —
never the status at that stone alone.

the poll renders three parts, and all three carry weight:

```
🗿 mechanic: 5.1.execution.from_vision, review.peer, l3@i009 🔍
             └──── the STONE ────┘  └── the PHASE ──┘  └ owner
```

| part | what it answers |
|---|---|
| the **stone** | **WHERE on the route** — how far the work has come |
| the **phase** | what it awaits at that point |
| the **glyph** | whose the halt is (`👋` human · `✋` driver · `🔍` in review) |

a report that carries the last two and drops the first has answered *what* and never *how far*.

## .why

**the same status at two stones is two different situations.** `judge, approved? 👋` means
opposite things: at `1.vision` it unblocks a build that has not started; at `5.3.verification`
it ships work already built and verified. same phase, same glyph, same words — one is the front
of a route, the other its end, and only the stone parts them.

**N gates with no stones read as interchangeable.** `🙋 4 await approval` invites the read "four
alike things"; with the stone attached they sort themselves by what the keystroke actually
costs or buys.

**the stone is the only datum that says the ROUTE advanced.** a phase can repeat byte-identical
for days while a clone works, and it can repeat byte-identical while a clone sits stopped. the
stone is what moves when the work moves.

**it costs naught — the instrument already rendered it.** `git.crew.poll --stones` already
prints the stone on every at-work crew. to drop it is a loss introduced by the report, which is
what makes it cheap to fix and easy to miss.

## .the evidence

a 2026-09-02 tick reported `🙋 4 await approval` as a table with no stone column, and `2 × 🔍 in
review` as one merged row. attached, the stones said what neither report could: the fleet was
bimodal — four builds not yet started (each stopped on one human keystroke at `1.vision`), three
deep in execution and in want of no human at all. `🙋 4` is a number; "four builds have not
started, and each is stopped on one keystroke of yours" is actionable.

it also changed a ROUTE verdict, not merely a report: `blocked ✋` at `5.1.execution.from_vision`
is a driver mid-convergence, expected and healthy. the identical `blocked ✋` at `1.vision` is a
clone stuck before it began, which is grave. one string, two verdicts, and only the stone parts
them.

## .the elision is institutional, not merely a habit

`rule.require.nudge-parked-clones`'s own route table writes the stone as a wildcard
(`N.stone, judge, approved? 👋`), correctly, because that table routes by OWNER and the owner is
a property of the phase and glyph alone. so this rule does not amend that table — it bounds it:
**the stone is elidable when you ROUTE by owner, and never when you REPORT.**

## .how to apply

- every crew line names its stone the first time that crew appears in a report
- every tally breaks down by stone, or states the distribution in a sentence — a count alone is
  not a report
- every verdict you route on a `✋`/`👋`/`🔍` reads the stone first, because the same phase at two
  stones can route two ways
- once a crew's stone is named, later lines about that same crew may elide it

## .the cheap check

before a status leaves you, ask: **would this sentence read the same if the crew were at the
opposite end of its route?** where the answer is yes, the stone carried weight your sentence
dropped.

## 🔴 .the stone you report may be badly STALE

a route records only **settled** transitions, so a clone mid-convergence runs past its last
recorded gate — and the lag can be large, not merely one turn. two trees measured the same day,
by a check of the pane against the rendered stone: one showed a 28-iteration gap, the other an
11-iteration gap.

a re-check of the second tree later the same day found the gap had held **constant** (6
iterations advanced on both sides, gap still 11) — so the offset is structural rather than a
divergence that grows. n=2, one route shape, so 11 is not a constant to trust; what the re-check
establishes is narrower: **the size of the gap is no evidence of a stall.**

### what the staleness costs

a tree that renders the same stone across six consecutive polls reads as stuck when it may be
deep in convergence the whole time. it can corrupt a supervisory decision, not merely a
sentence: on the strength of a stone frozen at one point, a budget top-up looks like the
textbook move (`rule.always.spend-own-levers-before-escalation`) — when the clone was never
budget-blocked at all.

> **name the stone — and wherever you would act on its STILLNESS, read the pane first.**
> a stone that has not moved is evidence of naught. only the pane says whether the clone did.

### .the cheap discriminator

| the pane above the unmoved stone | the read |
|---|---|
| a live spinner, a climbed token counter, a turn timer past an hour | 🟢 **stale stone** — the clone advanced. leave it |
| an idle box, no timer, no recent output | ⚠️ **genuine stillness** — now the stone means what it says |

the second row still needs the owner check — a genuinely still clone may be **parked**, and a
park's cure is a relay rather than a budget (`term=park`).

## .enforcement

- a route status surfaced to the human with no stone named = **blocker**
- an aggregate tally (`🙋 4 await approval`) with no stone breakdown = **blocker**
- a verdict routed from the phase alone, where the stone would have changed it = **blocker**
- the stone elided on a follow-up line about a crew already named with its stone = **not a
  violation**
- the stone abstracted in a rule's owner-route table = **not a violation**

## .see also

- `rule.require.nudge-parked-clones.md` — the owner-route table this bounds, and the
  drivable-work-below-the-gate read the stone is a term of
- `rule.require.babysit-cron-per-dispatch-fleet.md` — the tick that renders these stones
- `rule.require.speak-at-the-supervisor-layer.md` — a stone is a work-layer datum, so it belongs
  in a report by that rule's own test
- `term=partial-audit._.choice._.md` — a report whose subject set is narrowed by its own author,
  with no trace of the omission in the verdict
- `rule.forbid.self-grant-human-gates.md` — what a `👋` stone may and may not ask of you

---

written by human + beaver 🦫
