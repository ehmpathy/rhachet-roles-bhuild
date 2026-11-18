# F26 · the re-init journey: frontier reopen built, bare re-init pinned as it ships, its contract open with F23

## .the fork

5.1 peer review, i008, `enroll-impl-behavior-intent` nitpick.1 (graded `better`):

- (a) build it now: one hermetic journey that re-inits a finished nano route at `--size nano` and
  drives the frontier back to `6.preship`, plus a snap of the bare re-init (F23)
- (b) defer it to a dream; this pr keeps `idempotent [case10]` (the re-init stdout, snapped) and
  `initBehaviorDir.integration [case8]` (exactly the four tail files added, a driver-edited stone
  left byte for byte)

## .taken

(a), in two steps:

- the frontier half at 5.3, per its `has-fixed-all-gaps` review: `journey.tail` [case2] strips the
  tail from a fresh nano route, passes its three stones, re-inits at `--size nano`, asserts the
  re-init adds the four tail files and no other stone, and drives the frontier back to `6.preship`
  (snapped).
- the bare re-init snap at 5.3 l3 (i005 r010 nitpick.1): `idempotent` [case11] re-inits a nano route
  with no `--size` and snaps today's output — the nano files kept, every medi stone added. it pins
  the behavior as it ships; F23 (whether a bare re-init should infer the size) stays for the
  council, and a council verdict there shows as a snap diff.

the dream `.dream/2026_11_16.init-behavior-reinit-journey-drives-the-frontier.dream.md` now holds
only F23's contract question.

## .why, at the time

- the frontier is what a re-init exists to move; a journey proves it live under the bhrain driver
- a snap of the bare re-init costs one case and moves no contract, so it is safe and clean to land
- `computeNextStones` is bhrain's, and its "first incomplete stone by name" rule is bhrain's suite
  to hold

## .rework

clean — test cases and snaps; no template or contract moves.

## .confidence

90% — the doubt left is F23's, not this one's.

## .risk

low — the re-init at the route's own size is clamped by file effect and by the live frontier; the
bare re-init is pinned, so any change to it shows in review.

## .where

`blackbox/role=behaver/skill.init.behavior.guards.journey.tail.acceptance.test.ts` [case2];
`blackbox/role=behaver/skill.init.behavior.idempotent.acceptance.test.ts` [case10], [case11];
`initBehaviorDir.integration.test.ts` [case8]; `1.vision.experience.case=14.*`.

## .verdict

frontier half: built (journey.tail [case2]). bare re-init: pinned (idempotent [case11]); its
contract open with F23, for the council.
