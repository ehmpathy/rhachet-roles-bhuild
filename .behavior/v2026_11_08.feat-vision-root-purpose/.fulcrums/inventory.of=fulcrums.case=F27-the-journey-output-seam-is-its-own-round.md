# F27: the journey helper's output seam is its own round

## .the fork

`asCallOutput` in `blackbox/role=behaver/.test/skill.init.behavior.guards.journey.ts` joins
`stdout + stderr` with no seam. so a journey snapshot runs `reason: wait for human approval`
straight into `🪨 run solid skill`.

- **A — add a `\n\n` seam now**
- **B — catch it as a dream for its own round**

## .taken, and why

B.

- the helper is shared by every guard journey suite, not only the vision one. a seam resnaps all
  of them, and the bytes of [case1] predate this branch
- a resnap of that width, in a verification round, hides this branch's own snapshot changes
  inside a wide unrelated diff, which is what the snapshot reviewer exists to read
- the reviewer graded it `[nitpick][better]` and named no shipped harm. the defect is in test
  output alone

## .rework

clean. it is a one-line join plus a resnap, in a round of its own.

## .confidence, and why

80%.

## .where

`blackbox/role=behaver/.test/skill.init.behavior.guards.journey.ts`, caught at
`dreams/2026_11_20.fix-journey-output-seam.dream.md`.

the same call covers the vision journey cases i004 asked for (the absent-section red, a pass
before the yield, a snapped given, labeled stub lanes): each resnaps the same shared suites, so
they ride in that round, caught at `dreams/2026_11_20.journey-the-vision-depth-lane-refusals.dream.md`.
