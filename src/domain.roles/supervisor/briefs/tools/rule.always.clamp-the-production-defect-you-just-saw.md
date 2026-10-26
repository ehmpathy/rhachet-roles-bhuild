# rule.always.clamp-the-production-defect-you-just-saw

> **when a supervisor or prioritizer tool renders a wrong verdict in production, cure it IN THE
> TOOL and CLAMP it with a test that reproduces the exact case — before the tick moves on.**

this is the reflex `surgoal.polish-the-supervisor-and-prioritizer-tools` fires: accumulate and
clamp production cases, the moment you see one.

## .why — a worked-around tool defect returns, and the recurrence is the whole cost

a tool that renders a confident WRONG verdict does not fail loud. you notice it once — a wedge
read as healthy, a husk read as at-work, a rank that spent a nudge on the wrong tree —
diagnose it by hand, steer around it, move on. the tick is saved and the tool is not. the same
class of miss returns on the next pane that looks a little different, with no test in its way.

a transient-429 wedge read as healthy more than once, each time diagnosed by hand and never
clamped — the recurrence IS the defect. a byhand diagnosis cures one tick; a clamp cures every
tick after it. the corpus of clamped cases is the tool's memory of every way it has been wrong.

## .the move — five steps, in order

| # | step | the tool |
|---|---|---|
| 1 | reproduce — the verbatim pane / ledger row / rank input, as a fixture | the test |
| 2 | watch it fail under the un-fixed tool — the clamp must bite | `rule.require.clamp-edge-cases` |
| 3 | cure it in the tool — never by hand, never around it | `rule.forbid.byhand-heal`, `rule.always.fix-the-verb-that-left-you-the-gap` |
| 4 | re-run — watch it pass, neighbours stay green | the test suite |
| 5 | only then the tick moves on | — |

## .the cues

| when… | then… |
|---|---|
| a classifier renders a verdict a human says is WRONG | 🔴 the sharpest cue — reproduce as a fixture, watch it fail, fix in the tool |
| you diagnose a wedge/husk/cap/modal BY HAND | the tool missed it — that diagnosis is step 1 of a clamp, not the end |
| the human says "why AGAIN" / "we keep seeing regressions" | a recurrence — the prior fix had no clamp, add one now |
| about to work around a tool and move on | 🔴 stop — the workaround saves the tick and abandons the tool |
| a fix lands with no test that reproduces the case | 🔴 the lesson is lost — the same miss returns unguarded |
| the prioritizer spends a nudge on a tree you would not have | judgment or defect? a defect clamps; a judgment does not |
| the classifier is unsure between two states | bias to DETECT — a false detect costs one nudge, a miss costs hours |

## .the test

> if I close this tick now, will the tool catch this exact case next time — or only my memory?

tool will → clamped, move on. only memory → the clamp is owed; memory fades between sessions.

## .the bound

a defect renders a WRONG verdict, or forces a byhand finish. not a rank judgment you disagree
with, a slower-but-correct render, or a guess dressed as a tune (a change with no measured
before-and-after). those are not clamped.

## .enforcement

- a tool defect seen in production, worked around and left un-clamped = **blocker**
- a fix with no regression clamp, or a clamp with no teeth (passes under the un-fixed tool) = **blocker**
- a wedge/husk/cap cured by hand where the tool has (or could have) a cure path = **blocker**
- a recurrence of a class already seen, with no clamp added the prior time = **blocker**
- a rank judgment or a micro-optimization filed as a tool defect = **false positive**

## .see also

- `surgoal.polish-the-supervisor-and-prioritizer-tools.md` — the objective this reflex serves
- `rule.require.clamp-edge-cases` (ehmpathy/mechanic) — the clamp with teeth, red then green
- `rule.forbid.byhand-heal.md` — the cure lives in the tool
- `rule.always.fix-the-verb-that-left-you-the-gap.md` — a tool gap is closed, never worked around
- `rule.always.cure-detected-defects-same-tick.md` — the tick does not move past a found defect
- `define.invariant.crew.ratelimit.healable-transient.md` — the four rate-limit states

---

written by human + beaver 🦫
