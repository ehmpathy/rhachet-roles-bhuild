# F16 · r011's tallied 2 blockers + 1 nitpick are a parse of its history prose, not its verdict

## the fork

i003 r011 (`enroll-verif-snapshot-blemishes`) wrote `**0 blockers**` / `**0 nitpicks**` and "no
re-raise needed". its summary also recounted r006's i001 round: "2 blockers (…) + 1 nitpick (…)".
the guard tallied that line: `2 blockers, 1 nitpick`, so the lane reads `rejected`. it recurred at
i004: the same `**0 blockers**` / `**0 nitpicks**` verdict, the same history line, the same 2/1 tally.

| option | cost |
|---|---|
| A · dispute the three counted concerns, cite the reviewer's own verdict (taken) | the council reads one dispute row; no code change |
| B · concede and "fix" | there is no defect to fix; a concession would record a false repair |
| C · wait for a re-run to parse correctly | spends a budget round on a parser defect, and may misparse again |

## taken, and why at the time

A. the reviewer's verdict lines are unambiguous and its body names zero new concerns. the counted
items are r006's i001 concerns, already answered (r006 approved at i002 with 0 blockers).

## rework

clean: if the council disagrees, re-run the lane.

## confidence, and why it is not higher (90%)

- the tally rule is bhrain's; a council may prefer a re-run over a dispute on a parser defect

## where

- `.reviews/peer/5.3.verification._.review.i003.e92403fe26381fb7c6.r011._.given.by_peer.enroll-verif-snapshot-blemishes.md`
- dream: `.dream/v2026_10_05.reseed.bhrain-tally-reads-history-prose.md`

## verdict

awaits the wisher.
