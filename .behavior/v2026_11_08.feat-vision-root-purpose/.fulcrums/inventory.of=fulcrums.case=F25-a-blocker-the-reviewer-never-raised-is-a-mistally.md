# F25: a blocker the reviewer never raised is a mistally

## .the fork

- **A — concede the 2 blockers.** the tally counts them, so treat them as owed
- **B — dispute them as a tally misread.** the reviewer's own stdout raised none

## .taken, and why

B. the `enroll-verif-snapshot-blemishes` lane (i003 r011) states its verdict in plain words:
`Tally: 0 blockers, 7 nitpicks. None of them ships a harm I can name.`

- each of its 7 enumerated concerns is labeled `[nitpick][better]`
- the word "blocker" appears only in prose:
  - "the rule text calls inconsistent format a blocker. I graded it a nitpick"
  - the `[blocker][better]` label it lists under "considered and not raised"
- that lane emits no numeric `N blockers` line, so a sub-brain tallied it. the tally then read
  those two prose mentions as 2 blockers
- there is no defect behind them to fix, and a concession would assert one

## .rework

clean. if a council reads a real blocker there, it names it, and the driver answers it.

## .confidence, and why

90%. the reviewer's own words settle it. the residual doubt is whether the council wants the lane
re-run rather than disputed.

## .where

`.reviews/peer/5.3.verification._.review.i003.9f7e1d3897ca484c6c.r011._.given.by_peer.enroll-verif-snapshot-blemishes.md`

## .followup

the root cause is a reviewer that prints no numeric count lines (`contract.reviewer-output`). it is
caught as a reseed to bhrain: `dreams/2026_11_20.reseed-enroll-lanes-emit-numeric-counts.dream.md`.
