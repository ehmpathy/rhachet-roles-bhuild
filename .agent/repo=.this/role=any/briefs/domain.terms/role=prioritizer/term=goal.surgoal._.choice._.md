# domain.term: goal.surgoal

term.chosen   = surgoal
term.kind     = noun
term.boundary = goal
term.synonyms.forbidden:
- parent-goal
- epic
- supergoal
- overgoal

## .what

**the goal one rung UP from a given goal** — the whole that the given goal is a part of.

it is a **relation**, never a kind: `surgoal(X)` is a function of X. any goal can be a surgoal,
and the same goal is a surgoal to its parts and a part to its own surgoal at the same moment.

```
surgoals(subrock://R/a/b)  = { subrock://R/a }
surgoals(subrock://R/a)    = { bigrock://R, altrock://R }   — either root kind serves
surgoals(bigrock://R)      = ∅                               — a root answers to naught
```

## 🔴 .the discriminator — a RELATION, never a rank

| | what it is | the question it answers |
|---|---|---|
| a **goal** | a target, taken up and finished | *"is it done?"* |
| a **surgoal** | 🔴 **a position relative to another goal** | *"what is this a part of?"* |

a surgoal is not bigger, not more important, and not longer-lived than the goal beneath it. it is
**above it in one tree**, and that is the whole word. a `p3` surgoal above a `p0` part is legal and
common — the rank is an opine, and the tree is a decomposition.

⚠️ **so `surgoal` carries no claim about closure.** a surgoal completes exactly as any goal does —
when every part beneath it does (`define.invariant.eco.a-part-gates-its-whole`).

## .the consequence — a surgoal is a REFERENCE, and it is checked

because a surgoal is a position rather than a property, a goal that names one makes a **claim about
another row**. that claim is checked at write time: a goal may name a surgoal only if some priority
already declares it (`define.invariant.eco.a-surgoal-must-be-declared-first`).

⇒ and the rename consequence falls out of the same fact: to move a surgoal is to move every part
beneath it, which no sequence of one-row writes can express — hence `goal.mv`.

## .refs

- `.agent/repo=bhuild/role=prioritizer/briefs/define.invariant.eco.a-surgoal-must-be-declared-first.md`
- `.agent/repo=bhuild/role=prioritizer/briefs/define.invariant.eco.cost-rolls-up-and-sums.md`
- `.agent/repo=.this/role=any/briefs/define.invariant.eco.gain-propagates-down-and-sums.md`
- `.agent/repo=bhuild/role=prioritizer/skills/work/ecowork.db.schema.mjs` — the FK · `ecowork.db.goal.mjs` — its refusal, `assertSurgoalDeclared`
- `.agent/repo=bhuild/role=prioritizer/skills/eco.priority.sh` — the human surface

## .reason

- `term=goal.surgoal._.choice.reason.md`

---

written by human + beaver 🦫
