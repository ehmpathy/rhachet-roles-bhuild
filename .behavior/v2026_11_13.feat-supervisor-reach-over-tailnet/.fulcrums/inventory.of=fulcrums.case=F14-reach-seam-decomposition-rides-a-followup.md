# F14 — the reach-seam decomposition rides a followup, not this route

## .the fork
two reviewers proposed decompositions of the seam this route grew in `work/grovework.sh`, plus a
wider set of render snapshots:

- extract the row fold + probe arm shared by `saturation.sh` and `saturation.spend.sh`
- one `asGroveUnreachedKind` classifier for ssh's words, in place of three (duct, saturation, wake)
- extract the ssh alias render from wake (`asGroveSshAlias` / `setGroveSshAlias`), so `list` can flag alias drift
- named fields in place of the positional tab line `__grove_reach_of` returns
- the sweeps ride the wake's `-i <identity>`, via the shared probe
- compute the cure once per grove in the poll rows and summary
- probe groves in parallel in `list`
- snapshots for the saturation asleep row, the crew.poll caveat, the duct.poll footer, the send
  failure line, and tests for the wrong-account, ground-only-fold, and stale-port cells

options:
- (a) land them in this route
- (b) land the behavior fixes here; catch the decompositions and the extra snapshots as one followup

## .taken — (b)
- none changes what a human sees or where a grove is reached: each is a refactor of code that is
  correct, or a test of a render already clamped by assertion
- this route's done-means are a live run on the hetzner and ec2 groves and a green pr, held to a
  deadline; a cross-file refactor of saturation, duct, poll and wake re-opens every one of their
  suites and every review lane on them
- the behavior halves landed here: wake now halts at once on a key or host-key refusal with its
  own cure; the reader validates every field it emits; the tailnet cure is one transformer; the
  crew-verb no-answer render has its own suite (`work/ductwork.unreachable.integration.test.ts`)

## .rework — clean
each item is local to its files, and callers read the reader's output through one shape today.
caught as `.dream/2026_11_14.refactor.grove-reach-seam-decomposition.dream.md`.

## .confidence — 80%
the call that none of these is a shipped harm rests on the reviewers' own grades: every item is
`[nitpick][better]`, none `urgent`.

## .where
`work/grovework.sh`, `git.grove.saturation.sh`, `git.grove.saturation.spend.sh`,
`work/ductwork.uri.sh`, `git.grove.wake.sh`, `work/pollwork.*.sh`, `git.grove.list.sh`.

## .verdict
awaited — the council rules on the dispute.
