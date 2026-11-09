# F9 — keep the depth lane's `layers: N of 3` label

## .the fork

the `ergo-friction-hazards` lane (5.1, i003, nitpick.2) holds that `layers: N of 3` startles at
both ends: a 4-deep vision reads `layers: 4 of 3` (more than the total), and three flat bullets read
`layers: 1 of 3` against three visible bullets. it proposes a label that cannot read past the floor,
e.g. `depth: 4 (floor 3)`.

options: **keep the label**, or **relabel** (and re-pin every snapshot and the vision's demos).

## .taken, and why at the time

**keep.** the label is the output contract of the approved vision: `1.vision.yield.md` prints
`├─ layers: 2 of 3` in its deterministic-lane sketch, and demos case=3, case=4 (`layers: 4 of 3`),
case=7, and case=8 pin the same shape. the director approved 1.vision with that line in view. to
relabel at 5.1 would quietly overrule an approved surface. and the surprise is softened where it
bites: a flat vision's blocker names the cause on the next line (`fix: nest each \`- why:\` …;
bullets at one indent are one layer`).

## .rework: clean

one template string in `asVisionRootPurposeReport.ts`, then `--resnap` across the unit, integration,
and acceptance suites, plus the `toContain('layers: …')` asserts and the vision's demo lines. no
caller parses the line; the guard reads only the two numeric summary lines.

## .confidence: 80%, and why it is low

the reviewer's point is real ergonomics, and the vision may simply not have weighed the `> floor`
case. a wisher who reads `4 of 3` cold may prefer the relabel; it is theirs to call.

## .where

`src/domain.operations/behavior/vision/asVisionRootPurposeReport.ts` (the `layers:` line);
`1.vision.yield.md` (the lane sketch); demos case=3, 4, 7, 8.

## .verdict

(unruled)
