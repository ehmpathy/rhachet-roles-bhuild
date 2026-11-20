# F30: a test this branch added is no locked expectation

## .the fork

the test-intent lane grades each edit to a test as a changed criterion, a blocker whatever the
reason. in i004 and i005 it raised the refusal texts (`ENOTDIR`, `ELOOP` / `ENAMETOOLONG`, the
`<route>` hints) and the `visionScope` quantifier.

- **A — revert the refusal texts**, so the branch's earlier tests read as before
- **B — keep them**, and treat the branch's own tests as its draft contract, refined in review

## .taken, and why

B, for the refusal texts:

- every file the lane named is new on this branch: `git diff --name-status origin/main` prints `A`
  for `asRefusalOfReadCode.test.ts`, `getOneVisionFile.integration.test.ts`,
  `getOneVisionRootPurposeVerdict.integration.test.ts`, and the review skill's acceptance suite and
  snap
- no caller ever met the old text, so no shipped behavior moved. the rule guards behavior a
  release locked; an unreleased draft is refined, not regressed
- the commit that added them (`9060b15`) sits only on this pr's branch, above the last release
  (`7a4845a`, v0.24.0); pr #661 is open, unmerged. a push for review is not a release
- the reviewer's rule names no such exemption, so this is a call for the council, not a claim
  that the rule says so; the reviewer itself names "ratify" as the choice that keeps the fix
- a revert would restore the defect another lane proved: "write <path>" for a path through a file
  loops the caller back to the same refusal
- each new text is asserted and snapped; the reason sits in `5.3.verification.yield.md`

B, for `visionScope`, the one file that is on main:

- the two extant lanes keep identical asserts; the new lane gains its own
- the narrowed quantifier follows the approved vision: the motive lane reads the yield alone

## .rework

clean. a revert is one transformer and its tests.

## .confidence, and why

85%. the lane's own text grants that the `visionScope` change follows the approved design.

## .verdict

ruled by the director: B. keep the new refusal texts. the 4 test-intent blockers of i006 r012
stand disputed under F30, ruled by the director.

## .where

`src/domain.operations/behavior/vision/yield/asRefusalOfReadCode.ts` and its tests;
`src/domain.operations/behavior/init/initBehaviorDir.visionScope.integration.test.ts`
