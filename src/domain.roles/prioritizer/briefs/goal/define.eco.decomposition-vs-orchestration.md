# define.eco.decomposition-vs-orchestration

## .what

two purposes sit over the same priority rows, each served by its own datastruct. **orthogonal**
— neither implies the other — with exactly one exception: a part gates its whole.

| purpose | the question | relationship | datastruct | shape |
|---|---|---|---|---|
| **decomposition** | what is this a part of? | part-of | a **rootstruct** | a tree, rooted at a rock |
| **orchestration** | what has to happen first? | must-precede (a gate) | a **timeline** | the order gates impose |

decomposition asks what a rock is made of. orchestration asks what order work runs in.
`rootstruct`/`timeline` are just the datastructs each purpose uses.

⇒ pairs with `define.eco.rock-lifecycle-and-treestruct`, which builds the rootstruct in full
(that brief calls the same tree the **treestruct** — see `.term-note`).

## .why not the same

a part is not a prerequisite; a prerequisite is not a part. the house proves it:

```
decomposition: house = { foundation, walls, roof, paint }   — flat, says naught about order
orchestration: foundation → walls → roof; paint gates none
```

- `paint` is part of the house but gates none — part-of ≠ must-come-first
- `walls` gates `roof`, yet neither is part of the other — siblings; decomposition draws no edge
  between them, orchestration does

## .the one implication — a part gates its whole

orthogonal in every direction but one, and it is not policy — it is what "part" denotes:

```
beneath(part, whole)  ⇒  mustPrecede(part.done, whole.done)
```

a subrock cannot reach `done` while a part of it is open — the tree already said it, so the store
DERIVES this edge from `--goal` and refuses a hand-typed copy (a fact with two homes can drift).

⚠️ this is easy to misread when a row is both a part AND a prerequisite of the same parent — the
two edges land on one pair and look like one relationship. they are not: part-of is derived, the
gate table holds naught for it. `paint` (part, no gate) and `walls→roof` (gate, no part) are the
honest cases.

⇒ full treatment: `define.invariant.eco.a-part-gates-its-whole`.

## .the cross-branch case

a row can be part-of one branch and gate-of another, across the tree — a piece belongs to exactly
one whole, but an orchestration edge crosses the tree freely. this is the case the gate table
exists for.

🔴 aim the gate at the LEAF that does the work, never at the roll-up above it — on the roll-up the
edge is redundant (its parts already gate it) and imprecise (the leaf would show startable). aimed
at the leaf, the block reaches the roll-up on its own, up the tree. ⇒ `rule.require.aim-a-gate-at-the-work`.

## .the state of each half

| purpose | datastruct | built? | briefed? |
|---|---|---|---|
| decomposition | rootstruct | `eco.priority --goal` (bigrock/altrock/subrock uris) | `define.eco.rock-lifecycle-and-treestruct` |
| orchestration | timeline | `--gates` / `--gated-by` / `--status` / `--ready` | this brief + the invariant |

the `gate` table holds `(gater, gated, set_at)` — one edge, two ends, so `--gates` and
`--gated-by` can never disagree. `--ready` answers *"which row has no open gate before it, and no
open part beneath it?"* — the question that matters when the grove caps live trees. a `status`
column (`enqueued | inflight | done | held`) backs it, since `done` is what opens a gate.

## .why it matters

decomposition answers *"do we move the objective that matters?"* — groups work by goal.
orchestration answers *"what can we start right now, in what order?"* — sorts work by readiness.
decomposition alone cannot tell you which of five p1 rows no gate holds; it would pick by
filename age, the failure `eco.priority` exists to end.

## .term-note

`rootstruct` (this brief) and `treestruct` (`define.eco.rock-lifecycle-and-treestruct`) name the
same datastruct — a synonym to settle, not leave adrift. recommend `rootstruct` as canonical (it
pairs with `timeline` and names the root-slug trace `goalRoot`); retire `treestruct` on next
touch, no forced rewrite.

## .see also

- `define.invariant.eco.a-part-gates-its-whole` — the one implication in full
- `rule.require.aim-a-gate-at-the-work` — where a stored gate belongs
- `define.eco.rock-lifecycle-and-treestruct` — the decomposition datastruct, in full
- `define.domain-operation-grains` (ehmpathy/architect) — the orchestrator at the code scale
- `define.invariant.eco.quant-informs-opine` — the rank the two purposes narrow, never reorder

---

written by human + beaver 🦫
