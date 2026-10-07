# rule.forbid.budget-top-ups

## .what

**never add review budget.** the budget a route declared is the budget.

```sh
rhx route.guard.budget --for review --add N   # ⛔ not a lever a bot reaches for
```

a supervisor does not run it, does not steer a clone toward it, and does not name it in a
report as the cure for an exhausted lane.

## .why

### the budget is a declaration, not a defect

a route author chose `budget: 18` on that lane with the whole rubric in view. to top it up is
to overrule that judgment with the judgment of whoever happens to sit at the keyboard when it
runs out.

### exhaustion is terminal

`rule.always.converge-to-terminal` (bhrain/driver) names `exhausted` a terminal verdict:
exhaustion is earned, never casual, and an exhausted level owes a record — what was tried, and
what would fix that reviewer for the next traveler. a top-up is the move that lets a level skip
that record, by pushing the due date out.

### it deepens the trap, cheaply

a lane that failed to converge in N rounds is usually stuck on a cause an extra round will
meet again — this is the `spiral` shape (`term=spiral`): the remedy that resembles the defect.
`--add N` costs one command and no thought, sits adjacent to the real work (convergence — a
re-read of every open point, a `.taken` per point, a defensible argument), and reads as
progress, which is exactly when the real work stops.

## .what to do instead

| the lane is | you |
|---|---|
| exhausted, blockers still open | converge — a `.taken` per open `.given`, then re-arrive (`rule.always.converge-with-reviewers`) |
| exhausted, and you believe it is wrong | refute with cited evidence, in a `.taken` |
| exhausted, genuinely terminal | record what was tried and what would fix the reviewer; let it stand |
| malfunctioned (a broken lane, not a verdict) | repair it — this rule does not touch malfunctions |
| stuck past every one of those | surface it with what you found — never with `--add N` as the ask |

⚠️ a re-arrival is cheap and is not a top-up — the guard reuses any lane that returned 0
blockers, keyed on the artifact hash, so convergence does not re-spend what already passed.

## .exhaustion discharges the rounds, never the debt

> budget exhausted ∧ every raised blocker carries a paired `.taken` ⇒ the stone passes.

N rounds is N chances to convince. after that you owe answers, never agreement — a blocker with
no `.taken` is not terminal; the debt outlived the budget and must be answered. a top-up is
forbidden, and so is a silent wait-out.

## .the carve-out

**a human may still grant budget.** this rule binds bots. if a human, with the route in view,
decides a lane deserves more rounds, that is a decision on record rather than a reflex at round
19. the ask a supervisor may make is *"this lane is exhausted with N open, here is what was
tried and why it did not converge"* — never *"top up the budget."*

## .enforcement

- `route.guard.budget --add N` run by a bot = **blocker**
- a clone steered toward a top-up = **blocker**
- an exhausted lane reported to a human with `--add N` named as the fix = **blocker**
- an exhausted lane left terminal with no record of what was tried = **blocker**
- a malfunction treated as exhaustion and left unrepaired = **blocker**

## .see also

- `rule.always.converge-with-reviewers` (bhrain/driver) — the `.given`/`.taken` loop that
  replaces the top-up
- `rule.always.converge-to-terminal` (bhrain/driver) — exhaustion is terminal, and owes a record
- `rule.always.diagnose-reviewer-malfunctions` (bhrain/driver) — the verdict this rule does not
  cover
- `rule.require.ask-why-the-reviewer-wont-agree` — the question that comes first
- `term=spiral._.choice._.md` — the remedy that resembles the defect
- `rule.forbid.self-grant-human-gates` — the gates that were never yours; budget is now
  nobody's

---

written by human + beaver 🦫
