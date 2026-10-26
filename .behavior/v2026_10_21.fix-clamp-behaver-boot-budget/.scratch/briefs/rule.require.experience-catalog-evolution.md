# rule.require.experience-catalog-evolution

> **the experience artifacts are a durable coverage contract, not a vision-stage deliverable. a new
> experience found at any later stage evolves the contract before that stage passes.**

the contract = `1.vision.experience.dimensions.md` (axes) · `1.vision.experience.case=_.md`
(inventory) · `1.vision.experience.case=N.$slug.md` (demos).

on discovery, evolve all three:

1. **add the axis or cell** to `dimensions` — name the dimension it varies on, or the absent value
2. **itemize it** in `case=_` — verdict (demoed / itemized / forbidden / impossible), and feel × care if real
3. **demo it** in a `case=N` (narrative + bdd `[tn]`) **if critipath** — an alterpath may stay itemized

grow the contract; never bolt an experience on outside it.

| discovered at | evolve |
|---|---|
| criteria — a bdd case implies an unnamed experience | add cell, itemize, demo if critipath |
| execution — a code path reveals an unlisted boundary | add dimension/value, itemize, demo if critipath |
| verification — a test exercises an uncataloged experience | itemize; demo if critipath |
| playtest — a byhand walk hits a surprise | the surprise IS a new experience — evolve all three |

trigger: **a real experience exists that the contract does not hold.**

## .the verification terminus

vision owes a critipath a **sketch**; verification owes it **proof**. by the time verification
passes, grade both directions:

- **forward** — every critipath in `case=_` has a real test
- **backward** — every experience a test reveals has an inventory row

## .bounds

- a discovered alterpath may stay itemized, undemoed
- a discovery outside the wish's scope is flagged to the wisher, not force-fit

## .enforcement

- a new critipath found downstream, absent from the inventory or undemoed, while the stage passes = **blocker**
- an experience demoed or tested outside the catalog — no inventory row to match = **blocker**
- a catalog critipath with no real test once verification passes = **blocker**
- a discovered alterpath left un-itemized = **nitpick**

## .see also

- `rule.require.experience-catalog-evolution.reason.md` — why the contract must stay current
- `rule.require.experience-coverage` — the vision-stage rule this keeps alive downstream
- `rule.require.dimensional-decomposition` — the walked space this keeps current
- `howto.experience.decompose` · `howto.experience.demonstrate` · `define.experience`
