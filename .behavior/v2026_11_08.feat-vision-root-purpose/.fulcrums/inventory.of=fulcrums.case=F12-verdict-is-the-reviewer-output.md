# F12 — the depth verdict returns the reviewer output, not a data shape

## .the fork

the `enroll-impl-arch-defects` lane (5.1, i006, nitpick 4) asks `getOneVisionRootPurposeVerdict`
to return `{ purpose, blockers, nitpicks }` as data, with the contract edge
(`review.vision.root-purpose.ts`) to render and print.

options: **return the rendered verdict `{ blockers, nitpicks, stdout }`** (as now), or **return
data and render at the edge**.

## .taken, and why at the time

**the rendered verdict.** the depth lane's contract with the guard is its stdout
(`contract.reviewer-output`): the guard reads two numeric lines from it and naught else. the
integration test and the review.vision acceptance test assert on that stdout, so they test the
very bytes the guard reads. the data the reviewer asks for already exists one grain down, and is
unit-tested there: `getOneVisionRootPurpose` (the read), `getAllVisionRootPurposeBlockers` and
`getAllVisionRootPurposeNitpicks` (the deciders), `asVisionRootPurposeReport` (the render). the
verdict is the one orchestrator that composes them for the lane, and it has one caller.

## .rework: clean

move the `asVisionRootPurposeReport` call into the cli entry; the verdict returns the decider
output. one caller and two test files change; no consumer outside this repo reads it.

## .confidence: 80%, and why it is low

a second caller (e.g. #590's preship lane) that wants the concerns as data would tip it; today
there is none, and a speculative shape is what `rule.prefer.wet-over-dry` warns against.

## .where

`src/domain.operations/behavior/vision/getOneVisionRootPurposeVerdict.ts`;
`src/contract/cli/review.vision.root-purpose.ts`.

## .verdict

confirmed by the director, 2026-11-08: the reviewer output is the verdict contract.
