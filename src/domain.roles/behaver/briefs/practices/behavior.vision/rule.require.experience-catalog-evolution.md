# rule.require.experience-catalog-evolution

## .what

the three experience artifacts — `1.vision.experience.dimensions.md` (the axes),
`1.vision.experience.case=_.md` (the inventory), and each `1.vision.experience.case=N.$slug.md`
(the demos) — form a **standing coverage contract**, not a one-time vision-stage deliverable. when a
new experience surfaces at **any** later stage (criteria, blueprint, execution, verification,
playtest), you must evolve the contract to hold it **before that stage passes**:

1. **add the axis or cell** to `dimensions` — the new experience is a point in the space; name
   the dimension it varies on (or the value that was absent), so the space stays walked.
2. **itemize it** in the `case=_` inventory — give the cell its verdict (demoed / itemized /
   forbidden / impossible) and, if it is a real experience, its feel × care.
3. **demo it** with a `case=N` file (narrative + bdd `[tn]`) **if it is a critipath** — an
   alterpath may stay itemized; a critipath owes a demonstration.

the contract is discovered, not frozen. a new experience found downstream is evidence the vision's
decomposition was incomplete — the fix is to grow the contract, never to bolt the experience on
outside it.

## .why

the whole point of the shift-left of experience demonstration (see `rule.require.experience-coverage`)
is to make the critical-path surface **visible and checkable**. that guarantee decays the moment the
artifacts fall out of step with reality:

- **a stale inventory lies** — it asserts "these are the critipaths" while a newly-found critipath
  sits outside it, undemonstrated. the coverage contract silently becomes a coverage *sample* again.
- **downstream stages inherit the gap** — `2.1.criteria` bdd, acceptance tests, and `5.5.playtest`
  all feed off the `case=N` demos. an experience absent from the catalog is absent from each artifact
  it seeds.
- **the space stops being falsifiable** — `rule.require.dimensional-decomposition` earns its
  completeness "by construction" from the walked product. bolt an experience on outside the
  dimensions and that construction no longer holds — the reviewer can no longer trust the walk.

evolution of the contract on discovery keeps the cheap-gap-detection promise alive past the vision.

## .when it fires

| discovered where | what you evolve |
|------------------|-----------------|
| criteria — a bdd case implies an experience no cell named | add the cell, itemize, demo if critipath |
| execution — a code path reveals an unlisted boundary | add the dimension/value, itemize, demo if critipath |
| verification — a test exercises an experience not in the catalog | itemize it; demo if critipath |
| playtest — a byhand walk hits a surprise | the surprise IS a new experience — evolve all three |

the trigger is always the same: **a real experience exists that the contract does not hold.**

## .the verification terminus

at the vision, a critipath owes only a **sketch** — a narrative + `[tn]` demo, graded
"named + sketched, never proven" (`rule.require.experience-coverage`). verification is where
that sketch must become **proof**: by the time the verification stage passes, every critipath
in the catalog owes a **real test** that exercises it. the coverage contract that opened as an
illustration closes as an assertion.

so verification grades the contract in **both directions**:

- **forward** — every critipath in the `case=_` inventory is caught by a real test (the sketch
  became proof).
- **backward** — every experience the tests reveal is in the inventory (no test exercises a
  path the catalog never named — the drift check above).

## .the caveat

evolution is proportionate, not busywork. a discovered **alterpath** may be itemized and left
undemoed — its absence is a nitpick, not a blocker (`rule.require.experience-coverage`). only a
discovered **critipath** compels a `case=N` demo. and a discovery that is genuinely out of the
wish's bounded scope is flagged to the wisher, not force-fit into the contract.

## .enforcement

- a new critipath discovered downstream, left out of the inventory (or in the inventory with no
  demo), while the stage passes = **blocker**.
- a new experience demonstrated or tested outside the catalog — a `case=N`-shaped artifact or a
  test with no inventory row to match = **blocker** (the contract drifted from reality).
- a catalog critipath with no real test by the time the verification stage passes = **blocker**
  (the sketch never became proof — the forward terminus above).
- a discovered alterpath left un-itemized = **nitpick**.

## .see also

- `rule.require.experience-coverage` — the vision-stage rule this keeps alive downstream
- `rule.require.dimensional-decomposition` — the walked space this rule keeps current
- `howto.experience.decompose` — the discovery method that surfaces the new experience
- `howto.experience.demonstrate` — how to render the new critipath's demo
- `define.experience` — the feel × care frame every new cell is verdicted against
