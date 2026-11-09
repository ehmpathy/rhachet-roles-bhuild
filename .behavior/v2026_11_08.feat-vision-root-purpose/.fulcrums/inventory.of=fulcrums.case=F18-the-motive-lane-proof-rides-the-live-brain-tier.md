# F18 — the motive lane's live proof rides the repo's `BRAIN_LIVE` tier, a `runIf` gate

## .the fork

three 5.1 i002 concerns name one shape: `initBehaviorDir.rootPurposeMotive.brain.integration.test.ts`
gates its four live cases on `given.runIf(RUN_BRAIN_TEST)`.

- `mech-failhides` blocker.1: `rule.forbid.failhide` names `given.runIf` a forbidden skip
- `behavior-intent-coverage` nitpick.1: the mechanism refusal has no proof in the default run
- `ergo-friction-hazards` nitpick.2: the live verdict is count-asserted, never masked and snapped

options:

- **A — keep the tier** (taken): the four live cases stay on `RUN_BRAIN_TEST`; the deterministic half
  of the lane is clamped in every default run
- **B — fail loud by default**: a plain `given` that throws a `ConstraintError` when `BRAIN_LIVE` is
  unset, so every default `integration` run is red until a human unlocks prep and sets the flag
- **C — hold the suite out of the config**: forbidden here — `suitesGated.integration.test.ts`
  goes red on any negation that holds a suite out of its gate

## .taken, and why at the time

A. the tier is this repo's declared design on main (#605): `src/.test/utils/RUN_BRAIN_TEST.ts`
names it, and `initBehaviorDir.brain.claude.integration.test.ts` uses the same gate, "so a vendor
catalog shift never reds an unrelated ci push". B turns a live model's drift, cost, and a prep key
into a precondition of every push; C is forbidden by the repo's own ratchet.

what the default run does prove, deterministically, about the motive lane:

- the guard binds `rule.forbid.vision-root-purpose-mechanism.md` in both variants
  (`initBehaviorDir.integration.test.ts`)
- the lane's scope is the yield alone, and its run line is pinned (`initBehaviorDir.visionScope`)
- every brief a guard binds ships with the role (`guardTemplateBriefPaths.integration.test.ts`)
- the rule never states the depth floor, so the lane cannot re-grade depth (content clamp)

what only the live tier proves: that a model, given that rule, refuses a mechanism root. it ran
live on this branch (4 passed, the 5.1 yield's proof table), and the human gate on `1.vision`
reads each vision too.

a masked snapshot of the live verdict (ergo nitpick.2) pins no more than the count asserts: the
prose varies per run, so a mask leaves only the header and the two numeric lines, which
`toMatchObject({ blockers })` already holds. and the tree a mask would keep is not this repo's
contract: the lane's stdout is bhrain's `rhx review` render (`genReviewOutputStdout`), whose shape
bhrain snaps in its own suite. this repo owns the rule the lane binds, and that is clamped above.

5.3 i001 raised the same fork from three lanes (`ergo-contract-snapshots` blocker.1,
`mech-external-contracts` blocker.2, `ergo-acceptance-journey-coverage` nitpick.3); each is
disputed to this fulcrum, so the call stays in one place.

## .rework: clean

B is one file: replace each `given.runIf(RUN_BRAIN_TEST)` with `given`, plus a scene that throws
`ConstraintError('the live motive lane needs a brain', { hint })` when unset. a repo-wide change
of the tier (both brain suites, the ci job) is a separate pr.

## .confidence: 65%, and why it is low

`rule.forbid.failhide` names `given.runIf` outright, with no carve-out for a declared tier; the
wisher may hold the rule over the tier, or want the tier itself revisited.

## .where

`src/domain.operations/behavior/init/initBehaviorDir.rootPurposeMotive.brain.integration.test.ts`;
`src/.test/utils/RUN_BRAIN_TEST.ts`; `jest.integration.config.ts`;
`src/domain.roles/suitesGated.integration.test.ts`.

## .verdict

(unruled)
