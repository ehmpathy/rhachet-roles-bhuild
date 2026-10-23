# rule.require.experience-catalog-evolution.reason

the argument behind `rule.require.experience-catalog-evolution`. the rule boots as a cue; this
file holds why the cue is right. fetch it to dispute the rule, or to teach it.

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

## .why each step

- **add the axis or cell** — the new experience is a point in the space; to name the dimension it
  varies on (or the value that was absent) keeps the space walked.
- **demo it if critipath** — a critipath owes a demonstration; an alterpath may stay itemized.

## .why the contract is discovered, not frozen

a new experience found downstream is evidence the vision's decomposition was incomplete — the fix
is to grow the contract, never to bolt the experience on outside it.

## .why the terminus runs both ways

at the vision, a critipath owes only a **sketch** — graded "named + sketched, never proven"
(`rule.require.experience-coverage`). verification is where that sketch must become **proof**.
the coverage contract that opened as an illustration closes as an assertion.

- **forward** — the sketch became proof.
- **backward** — no test exercises a path the catalog never named; this is the drift check.

## .why the caveat

evolution is proportionate, not busywork. an alterpath's absence is a nitpick, not a blocker
(`rule.require.experience-coverage`).

## .why each enforcement grade

- an experience demoed or tested outside the catalog is a blocker because the contract drifted
  from reality.
- a catalog critipath with no real test once verification passes is a blocker because the sketch
  never became proof — the forward terminus.

## .see also

- `rule.require.experience-catalog-evolution` — the rule this argues for
