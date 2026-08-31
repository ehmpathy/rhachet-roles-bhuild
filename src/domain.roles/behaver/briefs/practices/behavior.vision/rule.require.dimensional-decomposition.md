# rule.require.dimensional-decomposition

## .what

the vision must **decompose the experience space into orthogonal dimensions and walk the product**
— not free-list a handful of experiences. the discovered dimensions live in a
`1.vision.experience.dimensions.md` artifact; the walked matrix lives in the
`1.vision.experience.case=_.md` inventory; every cell is verdicted (demoed / itemized / forbidden / impossible).

without this, an author cannot claim they **considered** the critipaths — they only sampled the
paths they happened to recall.

## .why

a free-listed set of experiences is a *sample*, and a sample's coverage is unfalsifiable: a
reviewer cannot tell a complete list from one with a silent hole. the product of orthogonal
dimensions is complete **by construction** — so "did we consider it all?" becomes a checkable
question about the *dimensions*, not a guess about the author's memory.

this is the teeth behind `howto.experience.decompose`. it also closes the
**self-authored-yardstick** gap in `rule.require.experience-coverage`: that rule grades cases
against the catalog, but the author writes both. grading the **dimensions** — are they orthogonal,
are they exhaustive — is an external check the author cannot quietly pass by omission.

## .what it requires

for the vision to pass:

1. **a dimensions artifact** — `1.vision.experience.dimensions.md` names the axes
   the experience varies over (actor, goal, path-variant, feel-trigger, resource-state,
   concurrency, …), each a small closed value set, each justified as **orthogonal** to the rest.
2. **a walked matrix** — the inventory takes the product of those axes and gives **every cell** a
   verdict: **demoed** (a real experience, demonstrated — named feel × care), **itemized** (a real
   experience on record, deliberately not demoed), **forbidden** (can't occur by *nurture* — the
   behavior rejects it), or **impossible** (can't occur by *nature* — no attempt is possible).
3. **forbidden cells recorded as invariants** — a nurture-barred path with its *why* is a checkable
   rule the execution must hold (its rejection is often a sharp critipath to demo); an impossible
   cell is noted, then set aside — nature bars it, no guard needed.
4. **the hidden-dimension check** — a whole row or column that cannot occur means two axes were not
   orthogonal; the latent dimension must be surfaced, not left implicit.

## .how a reviewer grades it

apply these questions to the dimensions artifact + inventory:

- **orthogonal?** does any value on one axis imply a value on another? if so, they are one axis, or
  a latent dimension hides — the decomposition is not yet clean.
- **exhaustive?** is each axis a *closed* set, or did the author list two values and imply "etc."?
  an open axis is an un-walked space.
- **walked?** does every cell carry a verdict, or are cells silently absent? an absent cell is an
  unconsidered experience.
- **barred-with-reason?** does each **forbidden** or **impossible** cell state *why* it cannot
  occur — and which it is (nurture vs nature)? a bare "can't happen" hides whether it is a real
  rejection invariant or a dodge.
- **the missing-axis smell** — could you name a dimension the author did not? concurrency, actor =
  `system`, resource-absent states are the usual omissions. a real path off a missing axis is a
  **blocker**: the space was under-decomposed.

## .severity

- **no dimensions artifact / a free-listed inventory with no decomposition** = **blocker**.
- **a non-orthogonal decomposition** (correlated axes, a latent dimension left hidden) that hides a
  real experience = **blocker**.
- **an un-walked cell** — a valid combination with no verdict — where the cell is a critipath =
  **blocker**; where it is a lower-severity path = **nitpick**.
- **a forbidden or impossible cell with no recorded reason** = **nitpick** (a real invariant left unstated).
- **an axis listed with an open "etc." value set** = **nitpick**.

## .enforcement

graded at the `1.vision` guard by a peer reviewer scoped **only** to the decomposition:

- **peer-review** `dimensional-decomposition` (light-enrolled) — an independent reviewer confirms
  the dimensions are orthogonal + exhaustive and the product is fully walked, before the human
  approves. its rubric is this rule alone — it does not grade the demos, only the discovery.

## .see also

- `howto.experience.decompose` — the method this rule mandates
- architect `howto.dimensional-decomposition`, `rule.require.dimensional-decomposition` — the
  general morphological-box method + its architect-scale mandate
- `rule.require.experience-coverage` — the companion rule (grades the demos; this grades the space)
- `define.experience._.axis=care.path=criti-vs-alter` — how each walked cell's care is set
