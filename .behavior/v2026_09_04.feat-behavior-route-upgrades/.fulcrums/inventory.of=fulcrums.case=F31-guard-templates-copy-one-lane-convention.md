# F31 — guard templates copy one lane convention by hand: compose them, or clamp the copies

- rework: **clean** — to keep the copies is the status quo; a later compose step replaces them whole
- status: open — best-guessed, drive on
- confidence: **75%**
- raised: 2026-10-21, `5.1.execution.from_vision` round i007

## .the fork, stated fairly

`enroll-impl-arch-defects` blocker.2: each sweep lane in the 5.1 and 5.3 guards repeats one bind,
`--paths-with '**/*.{ts,sh,md,snap}' --paths-wout '.behavior/**' --paths-wout '.dream/**'`, and the
two 5.1 guards are near-identical files. the inert `.behavior/*` exclusion of i006 was one copy that
drifted. nitpick.1 adds that the arch lanes bind no `.guard` or `.stone`, so they never read the
templates they would flag.

| option | what it costs |
|---|---|
| compose guards from shared lane fragments now | a template build step this repo lacks; bhrain's guard format has no include, so every guard becomes generated output, and every snapshot and journey test re-baselines |
| keep the hand copies, clamp them | the copies stay; a test reads every copy and fails on drift |

## .taken, and why

keep the copies, under the clamp. `initBehaviorDir.integration` `[case13]` reads every sweep line of
every stamped guard and requires both `**` exclusions, so the defect class the reviewer names — one
copy edited, another missed — goes red at once. `[case18]` does the same for the close-lane
anchors. a compose step is a new build mechanism, outside the twelve issues, and it touches every
guard this route stamps.

the arch lanes' scope (nitpick.1) rides with it: to widen every lane to `.guard` and `.stone` is the
same hand edit across every copy, and it raises each lane's overflow risk.

## .rework, and why it is clean

a compose step replaces the hand copies with generated ones of identical text, so no route and no
caller sees a change. the clamps stay true either way.

## .confidence, and why it is not higher

the reviewer is right that a clamp is vigilance by test rather than one source of truth, and that
the next lane added is a new copy. the hold rests on scope: no issue in the wish asks for a
template build step.

## .where

`src/domain.operations/behavior/init/templates/5.1.execution.*.guard` ·
`templates/5.3.verification.guard` · the dream
`.dream/v2026_10_21.followup.compose-guard-templates-from-shared-lanes.md`
