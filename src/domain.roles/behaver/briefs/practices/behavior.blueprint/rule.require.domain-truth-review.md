# rule.require.domain-truth-review

## .what

every blueprint stone's guard runs a **domain-truth** peer review lane. the lane reads:

- each domain object the blueprint declares, against its `term=*` definition and its deal sentence
- each field, against `rule.require.domain-objects-stated-in-the-deal`
- each case of `inventory.of=invariant._`, against the blueprint's fields, ops, and contracts

it flags any field the definition does not account for, any total stored on a commitment, and any
case the blueprint breaks. a broken case is a blocker. it also flags a guard, gate, or refusal the
blueprint declares that maps to no case: an unsourced enforcer.

it also sweeps every object for a second home of a fact, in each shape:

- a stamp (`paidAt`, `settledAt`, `completedAt`) an event record which cites the entity already
  proves (`rule.forbid.state-stamps-that-restate-events`)
- a stored entity named for one stage of its life, e.g. `PurchaseStarted`
  (`rule.forbid.entities-named-for-one-stage`)
- a copy of a field another object or service owns; a flag stored for a branch to read

## .why

- **the check must not rest on one driver's memory.** the lease defect passed six peer rounds and
  two blind reviews; each lane graded rule conformance, and none read the object against its
  definition
- **a lane in the guard runs every round,** for every driver, at no cost to the human

## .how

the rubric for the lane is this rule, `rule.require.domain-objects-stated-in-the-deal`,
`rule.forbid.domain-objects-shaped-by-their-readers` (with its case
`rule.forbid.aggregate-fields-on-commitments`), and the inventory itself. bind it to the blueprint
yield and its experience cases, plus `.agent/repo=.this/role=any/briefs/domain.terms/**` and
`inventory.of=invariant.*.md` as refs.

## .enforcement

- a blueprint guard with no domain-truth lane = **blocker**
- a domain-truth lane that does not read the inventory = **blocker**

## .see also

- `rule.forbid.implicit-invariants (upstream, architect)` — keeps the inventory the lane reads
- `rule.forbid.amend-a-rule-to-fit-a-design` — what the lane prevents upstream

---

written by human + beaver 🦫
