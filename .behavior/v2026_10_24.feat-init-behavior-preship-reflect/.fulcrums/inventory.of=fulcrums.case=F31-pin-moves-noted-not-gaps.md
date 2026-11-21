# F31 · three pin moves the test-intent lane notes, each with no behavior lost (5.3 l3 i005 r012 nitpicks 1–3)

## .the fork

the lane counts three notes as nitpicks, and its own text grades each "no behavior lost":

1. the `templates.tail` pin `'the step 3 preflight refuses…'` became `'the preflight refuses…'`
2. `asDriveOutputThroughHalt` became `asDriveOutputThroughFrontier`: the drive snaps stop at the
   `brain =` row
3. `asCallOutput` became `asStreamsOutput`: color stripped, streams labeled

- (a) concede each and change the pins back
- (b) dispute each: the pins moved with the text or the claim they hold

## .taken

(b), disputed.

## .why, at the time

1. the stone no longer names a step number, so a pin on `step 3` would assert a text the stone does
   not hold. the pin matches `6.preship.stone` line 139 verbatim, which the lane confirms ("the
   stone was reworded to match").
2. the cut was asked for by `ergo-snapshot-visual-blemishes` (i004 nitpick.1): the snap stops where
   the title's claim ends; the halt line is still asserted by `toContain` (lines 176, 214).
3. the labels were asked for by the same lane (i001 blocker.1, i004 nitpick.2); every `toContain` is
   unchanged, and a color code is no contract.

each is a change another lane asked for, with the claim kept. to revert it would reopen the concern
that lane closed.

## .rework

clean — three lines.

## .confidence

95%.

## .risk

low — none ships; each pin still holds its claim.

## .where

`src/domain.operations/behavior/init/templates.tail.integration.test.ts` [t1];
`blackbox/role=behaver/.test/skill.init.behavior.guards.journey.ts`;
`blackbox/role=behaver/skill.init.behavior.guards.journey.tail.acceptance.test.ts`.

## .verdict

open — for the council.
