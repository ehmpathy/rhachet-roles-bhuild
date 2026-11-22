# F11 — the light guard's lanes are proven by a template read, not a live journey

## .the fork

the `enroll-impl-behavior-intent` lane (5.1, i005, a nitpick) notes the light guard never runs
live; only the heavy journey drives the 1.vision guard.

options: **read both variants' lanes in isolation** (as now), or **add a light-guard journey**.

## .taken, and why at the time

**read in isolation.** `initBehaviorDir.integration.test.ts` asserts both root-purpose lanes, with
their run lines, in each variant (`rule.require.guard-variant-consistency`). the journey drives
heavy, the superset. a second live journey costs a full bhrain drive to re-prove a gate that the
template read already pins, which `rule.forbid.live-review-rosters-in-acceptance-journeys` warns
against.

## .rework: clean

parameterize the vision journey's [case2] over `--guard light | heavy`. no caller depends on it.

## .confidence: 80%, and why it is low

a light-only defect in the guard's other sections (judges, budget) would slip past a lane-only
template read; the journey would catch it.

## .where

`blackbox/role=behaver/skill.init.behavior.guards.journey.vision.acceptance.test.ts`;
`src/domain.operations/behavior/init/initBehaviorDir.integration.test.ts`.

## .verdict

(unruled)
