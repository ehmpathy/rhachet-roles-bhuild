# rule.require.yagni-and-simplicity

## .what

every component a vision or blueprint proposes must earn its place: it traces to an acceptance
criterion, and no smaller change meets the same criteria. the reviewer asks **what here is not
needed, and how can this be simpler?**

## .why

every behaver stage rewards thoroughness, and few ask *is this too much?* so artifacts grow guards
for defects that cannot happen, abstractions with one caller, and machinery for a future nobody
committed to. the cost lands at execution, on whoever inherits the complexity as settled.

the vision and the blueprint are where a design is chosen, so that is where the question is
cheapest to ask.

## .the checks

| # | check | blocker when |
|---|---|---|
| 1 | trace to acceptance | a component maps to no criterion in `0.wish.md` |
| 2 | count the callers | an abstraction has one call site and no second is named |
| 3 | is it extant? | a proposed seam, builder, or guard duplicates a boundary the repo already has |
| 4 | can the fix be smaller? | a simpler change satisfies the same criteria — state it concretely |
| 5 | speculative generality | built for a case the wish does not name (`rule.prefer.wet-over-dry`) |
| 6 | audit is not a guard | the wish asks a class be *audited*; a permanent enforcement mechanism is a scope leap |

## .the strongest form

*"here is the smaller change that satisfies every stated criterion"* — a concrete alternative,
never a bare objection.

## .the caveat — simplicity is not thinness

a criterion left unmet is a blocker however lean the artifact reads. this rule cuts the unasked-for,
never the owed.

## .examples

### 👎 bad

> the vision proposes a name-builder to contain an aliased env word. it has one call site per name,
> the two extant functions already serve as the seam, and the wish asks only that the class be
> audited.

### 👍 good

> change two words in the two extant functions. audit, no guard. every criterion still holds.

## .enforcement

- a component with no acceptance trace = **blocker**
- an abstraction with one caller and no second named = **blocker**
- a mechanism that duplicates an extant boundary = **blocker**
- complexity where a stated simpler alternative meets every criterion = **blocker**
- a cut that leaves a criterion unmet = **blocker** (thinness is not simplicity)

## .see also

- `has-pruned-yagni` — the self review at blueprint + execution; this is its peer counterpart
- `rule.prefer.wet-over-dry` (ehmpathy/mechanic) — check 5
- `rule.require.criteria-satisfied` — the bound this rule must not cut below
