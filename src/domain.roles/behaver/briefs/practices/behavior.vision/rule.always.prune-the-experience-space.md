# rule.always.prune-the-experience-space

> **before you verdict a cell, ask whether the design could delete it. a combination you forbid,
> redirect, or guard away cannot occur, so it owes no code path, test, demo, or support case.**

the walk produces a product of axes.

- the extant four verdicts — `demoed` · `itemized` · `forbidden` · `impossible` — each *describe* a
  cell you have found
- ⇒ this rule adds the act that runs first: shrink the space, so the driver spends the verdicts on fewer cells

## .why — the extant discipline grades COVERAGE, and coverage rewards a larger space

- `rule.require.dimensional-decomposition` demands the product be walked
- `rule.require.experience-coverage` demands each critipath be demoed
- ⇒ both are satisfied by a space of any size
  - a 200-cell space with 200 verdicts scores the same as a 40-cell one
  - and costs five times as much to hold, test, and maintain

⇒ **no extant rule asks whether the space should have been that big.** a walk with no prune step
accepts every combination the first draft permitted.

and each cell that survives is not free.

- it is a code path, a test, a doc line, a support case, and a place for a defect to hide
- ⇒ the cheapest experience is the one that cannot occur

## .the parent — this is `fewer-paths-via-idempotency`, one level up

the architect already states the move for code:

> *"do not branch around an unsafe operation — make the operation safe. leverage idempotency to
> collapse code paths."*
> — `rule.require.fewer-paths-via-idempotency`

that rule collapses **branches**. this collapses **experiences**, and it fires one stage earlier —
at the vision, before a branch exists to collapse. the pressure is identical: **do not handle the
case; remove it.**

## .the three levers, and what each costs

| lever | what it does | the space goes from | what it costs |
|---|---|---|---|
| **forbid** | the actor may attempt it; the behavior refuses, loud | N cells → **1** sharp rejection | one invariant, one demo |
| **redirect** | the attempt funnels into an extant path | N cells → **0** new | one route map, no new experience |
| **guard** | the attempt cannot be made | N cells → **impossible** | one constraint at the boundary |

⇒ they are a **ladder, cheapest last** — a guard removes the attempt, a redirect removes the
outcome, a forbid removes every outcome but one. reach for the highest rung the domain permits.
then record which rung you took.

## 🔴 .the precondition — merge before you prune, or you hide a defect in the MODEL

a subset that reads prunable is sometimes a subset that was never real:

| what you found | it is a defect in the… | the move |
|---|---|---|
| two axis values that behave identically across every other axis | **model** | merge the values. the space shrinks and no design changed |
| a whole row or column that cannot occur | **axes** — two were not orthogonal | find the latent axis (the howto already says so) |
| a subset the design genuinely permits and should not | **design** — real complexity | **prune it** — this rule |

⇒ **a merge is free and a prune is a design decision.** to prune first is to ship a forbid against a
combination your model invented.

## .the test — per SUBSET, never per cell

> **name a subset of two or more cells. would the behavior be worse if not one of them could occur?**

no → prune it, and name the lever · yes → keep it, and say what it buys · you cannot name a subset
→ the space may already be minimal, and that result is itself on record.

🟡 **the grain is the subset.** a per-cell question yields *"this cell is fine"* every time — each
cell, alone, is defensible. the prune only becomes visible when you hold a **row, a column, or a
plane** and ask what it collectively earns.

| when… | then… |
|---|---|
| an axis has a value that only ever appears in itemized cells | the strongest cue. does that value need to exist? |
| the product exceeds ~50 cells | ask which axis carries combinations nobody asked for |
| two axes multiply into a plane you cannot name one use for | 🔴 a plane, not a cell. prune the plane |
| a cell is real, rare, and expensive to support | a **redirect** into the common path, often at no loss |
| an actor can reach a state by two routes | one route, and a redirect. two routes double every downstream cell |
| a value exists because the wish mentioned it once | check whether the wish **asked** for it or merely **named** it |
| the demos feel repetitive | repetition across cells is a merge signal, not a demo-style problem |
| you are about to write the 15th `case=N` | 🔴 ask what a forbid would have removed |

## .the record — a prune is a DECISION, so it is on record or it did not happen

the inventory carries a prune section. one row per pruned subset:

| what it names | why |
|---|---|
| the subset — the axis values that define it | so a reader can re-derive which cells went |
| the count — how many cells it removed | the one figure that makes the prune checkable |
| the lever — forbid · redirect · guard | it fixes what the design now owes |
| the cost — what the actor can no longer do | a prune is a capability removed; say so plainly |

🔴 **the cost column is the one that gets omitted, and it is the one a reviewer needs.** a prune with
no stated cost reads as a free simplification, and no such prune exists: every one takes something
away from someone.

⇒ and a pruned subset does not vanish from the inventory. it is recorded as pruned, with its lever,
so the next traveler can tell *"we decided against it"* from *"we never thought of it"*.

## .the bound — do not prune a critipath to shrink a number

the failure this rule can cause is worse than the one it fixes: a space pruned to look small, with
a real path forbidden because it was inconvenient to demo.

| a violation | not a violation |
|---|---|
| a subset pruned with no stated cost | a subset pruned, cost stated, judged worth it |
| a critipath forbidden to avoid a `case=N` | an alterpath redirected into the common path |
| a prune that the wish asked for in so many words | a prune of a combination the wish never asked for |
| a merge sold as a prune | a merge performed **before** the prune, and named as a merge |

**the line that parts them: did an actor lose something they came for?** yes → that is a scope cut,
and it is the wisher's. no → a prune, and it is yours.

## .enforcement

blocker:

- a walked space with no prune pass on record
- a pruned subset with no stated cost
- a pruned subset with no named lever — *which* lever decides what gets built
- a prune that removes a critipath where no wisher verdict granted it
- a merge recorded as a prune — it conceals that the model was wrong

nitpick: a prune pass that finds no subset, with no statement of why the space is already minimal.

## .see also

- `rule.require.fewer-paths-via-idempotency` (ehmpathy/architect) — the parent move, at the code grain
- `rule.require.dimensional-decomposition` — the walk this prunes
- `howto.experience.decompose` — where the prune step sits in the method
- `rule.require.experience-coverage` — the coverage bar a smaller space is cheaper to clear
- `rule.prefer.prevent-over-correct` (ehmpathy/ergonomist) — the same ladder, for errors: make it
  impossible, make it hard, catch it early, report it well
- `rule.require.experience-catalog-evolution` — a prune reversed downstream re-grows the contract
