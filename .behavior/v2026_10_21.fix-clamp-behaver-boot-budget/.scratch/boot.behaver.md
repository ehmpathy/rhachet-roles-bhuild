<stats>
quant
  ├── files = 56
  │   ├── briefs = 23
  │   │   ├── say = 2
  │   │   └── ref = 21
  │   └── skills = 0
  │       ├── say = 0
  │       └── ref = 0
  ├── tokens = 2,075 (full emitted payload, o200k_base)
  └── budget = 2,075 / 2,200 tokens (94% used)
</stats>

<readme path="src/domain.roles/behaver/readme.md">
## 🌲 behaver

used to declare clear and testable behaviors that can be reliably built and verified.

</readme>

<brief.say path="src/domain.roles/behaver/briefs/practices/behavior.verification/philosophy.verification-strictness.md.min">
# philosophy: verification strictness

a behavior is a promise. verification is the proof.

## .zero tolerance

- **deferrals** — a deferred test is a lie
- **fake tests** — fraud that provides false confidence
- **unproven claims** — cite command + output or it's a guess
- **credential excuses** — blocker, not deferral
- **skips** — hidden lies that pass ci

## .exhaustive coverage

every positive path, negative path, edge case. no gaps.

if not snapped:
- reviewers can't vibecheck
- drift goes undetected
- regressions ship silent

## .real integration tests

mocks lie. only real calls prove integration works.

credential difficulty = blocker. not exception.

## .cost of leniency

leniency compounds → erodes trust → ships defects

## .benefit of strictness

strictness compounds → builds trust → prevents defects

zero tolerance. zero exceptions. that's the price of trust.

</brief.say>

<brief.say path="src/domain.roles/behaver/briefs/practices/behavior.vision/rule.require.experience-catalog-evolution.md">
# rule.require.experience-catalog-evolution

> **the experience artifacts are a durable coverage contract, not a one-time vision-stage
> deliverable. when a new experience surfaces at any later stage, you must evolve the contract to
> hold it before that stage passes.**

the contract = `1.vision.experience.dimensions.md` (axes) · `1.vision.experience.case=_.md`
(inventory) · `1.vision.experience.case=N.$slug.md` (demos). later stages = criteria, blueprint,
execution, verification, playtest.

on discovery:

1. **add the axis or cell** to `dimensions` — name the dimension it varies on, or the absent value
2. **itemize it** in `case=_` — verdict (demoed / itemized / forbidden / impossible), and feel × care if real
3. **demo it** in a `case=N` (narrative + bdd `[tn]`) **only if critipath** — an alterpath may stay itemized; its absent demo is a nitpick

grow the contract; never bolt an experience on outside it.

| discovered at | evolve |
|---|---|
| criteria — a bdd case implies an unnamed experience | add cell, itemize, demo if critipath |
| execution — a code path reveals an unlisted boundary | add dimension/value, itemize, demo if critipath |
| verification — a test exercises an uncataloged experience | itemize; demo if critipath |
| playtest — a byhand walk hits a surprise | the surprise IS a new experience — evolve all three |

trigger: **a real experience exists that the contract does not hold.**

## .the verification terminus

vision owes a critipath a **sketch** (narrative + `[tn]`); verification owes it **proof**. by the
time verification passes, every catalog critipath owes a real test that exercises it. grade both
directions:

- **forward** — every critipath in `case=_` has a real test
- **backward** — every experience a test reveals has an inventory row

bound: a discovery outside the wish's scope is flagged to the wisher, not force-fit.

## .enforcement

- a new critipath found downstream, absent from the inventory or undemoed, while the stage passes = **blocker**
- an experience demoed or tested outside the catalog — a `case=N`-shaped artifact or test with no inventory row to match = **blocker**
- a catalog critipath with no real test once verification passes = **blocker**
- a discovered alterpath left un-itemized = **nitpick**

## .see also

- `rule.require.experience-catalog-evolution.reason.md` — why the contract must stay current
- `rule.require.experience-coverage` — the vision-stage rule this keeps alive downstream
- `rule.require.dimensional-decomposition` — the walked space this keeps current
- `howto.experience.decompose` (find it) · `howto.experience.demonstrate` (demo it) · `define.experience` (feel × care)

</brief.say>

<briefs.ref base="src/domain.roles/behaver/briefs/practices/">
behavior.blueprint/rule.require.criteria-satisfied.md
behavior.blueprint/rule.require.determinism-declared.md
behavior.blueprint/rule.require.test-coverage-specified.md
behavior.blueprint/rule.require.test-patterns-specified.md
behavior.criteria/define.behavior-thoughtroute-hierarchy.md
behavior.criteria/define.criteria-blackbox-vs-blueprint.md
behavior.criteria/define.criteria-blackbox.md
behavior.criteria/define.criteria-blueprint.md
behavior.criteria/rule.prefer.dependency-order.md
behavior.criteria/rule.prefer.depth-groups.md
behavior.criteria/rule.prefer.usecase-groups.md
behavior.criteria/rule.require.bdd-format.md
behavior.criteria/rule.require.blackbox-no-implementation.md
behavior.criteria/rule.require.blueprint-contract-layer-only.md
behavior.roadmap/rule.prefer.clear-deliverables.md
behavior.roadmap/rule.prefer.dependency-order.md
behavior.verification/rule.require.contract-snapshot-exhaustiveness.md
behavior.verification/rule.require.external-contract-integration-tests.md
behavior.vision/rule.require.experience-catalog-evolution.reason.md
behavior.wish/rule.prefer.bounded-scope.md
behavior.wish/rule.prefer.clear-desires.md
</briefs.ref>

<also>
  <briefs.ref base="src/domain.roles/behaver/briefs/">
  define.behaver-ergonomist-relationship.md
  practices/behavior.execution/architect/rule.forbid.ambiguous-terms.md
  practices/behavior.execution/architect/rule.forbid.behavior-hazards.md
  practices/behavior.execution/architect/rule.forbid.friction-hazards.md
  practices/behavior.execution/architect/rule.forbid.maintenance-hazards.md
  practices/behavior.execution/architect/rule.forbid.scope-leaks.md
  practices/behavior.execution/architect/rule.prefer.decomposable-architecture.md
  practices/behavior.execution/architect/rule.require.behavior-intent-coverage.md
  practices/behavior.execution/ergonomist/rule.forbid.snapshot-visual-blemishes.md
  practices/behavior.execution/ergonomist/rule.require.acceptance-journey-coverage.md
  practices/behavior.verification/rule.forbid.test-intent-violations.md
  practices/behavior.vision/define.experience._.axis=care.path=criti-vs-alter._.demo.boundary=shoetie-on-carbumper-at-75mph.md
  practices/behavior.vision/define.experience._.axis=care.path=criti-vs-alter._.demo.catalog=freq-x-cost.md
  practices/behavior.vision/define.experience._.axis=care.path=criti-vs-alter.md
  practices/behavior.vision/define.experience._.axis=feel.path=happy-vs-sharp.md
  practices/behavior.vision/define.experience._.demo.surf-school.md
  practices/behavior.vision/define.experience._.metric=boundary-density.md
  practices/behavior.vision/define.experience.md
  practices/behavior.vision/howto.experience.decompose.md
  practices/behavior.vision/howto.experience.demonstrate.md
  practices/behavior.vision/howto.experience.enumerate.md
  practices/behavior.vision/rule.require.dimensional-decomposition.md
  practices/behavior.vision/rule.require.experience-coverage.md
  </briefs.ref>

  <skills.ref base="src/domain.roles/behaver/skills/">
  bind.behavior.sh
  feedback.give.sh
  feedback.take.get.sh
  feedback.take.set.sh
  give.feedback.sh
  init.behavior.sh
  reflect.on.reviews.self.sh
  review.behavior.sh
  review.deliverable.sh
  </skills.ref>
</also>

<stats>
quant
  ├── files = 56
  │   ├── briefs = 23
  │   │   ├── say = 2
  │   │   └── ref = 21
  │   └── skills = 0
  │       ├── say = 0
  │       └── ref = 0
  ├── tokens = 2,075 (full emitted payload, o200k_base)
  └── budget = 2,075 / 2,200 tokens (94% used)
</stats>