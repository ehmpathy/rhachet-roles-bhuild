# F16 · the sprout gate reads the token half live, per ask; no persisted token record

## .the fork

each `--for` ask that the grove half does not refuse runs `git.crew.tokens` and `calibrate`: one
fleet-wide transcript scan, plus up to two span scans once cap rows exist. measured 135–227s per scan
on a 4-cpu grove at load 37–56.

- **(a)** keep the live read; refuse early on an unread grove or a 🔴 stall; run the two token reads
  one after the other, never at once
- **(b)** persist the derived token record (burn per kind-hour, calibration) with its age under
  `~/.rhachet/storage`; the gate reads it, and a record past its age bound reads ⚪
- **(c)** a probe that emits time-bucketed usage, so one scan serves every window
- **(d)** (5.3 i003, repo-rules) ask the scan-free cap-row arm of `calibrate` first, and run the
  fleet-wide burn read only once a cap pair exists

## .taken, and why

(a). (b) and (c) are a new store and a new probe contract. each needs its own age bound, its own
writer, and its own clamps. the gate is one call per sprout, and a sprout is rare next to a tick. the
early refusal already spares the loaded box the scan in the one state where the gate must say no.
the serial order removes the two overlapped scans the review measured.

(d) is not a free cut: the burn read feeds more than the token limit. `idle_crews` in
`work/capacitywork.sh` reads `burned` from the token record (`select(.cores < 0.05 and (.crew as $c
| burned | index($c) | not))`), and the gate's ram refusal names those crews as the ones to fell
(G9, capacity [case11]). with the burn read skipped, every crew reads burn-free, and the refusal
names crews at work as idle — a false report. (d) done right reads the burn on the refusal path and
on a calibrated pool, which is a two-pass gate; it rides with (b), since (b) also ends the per-ask
scan.

## .rework

clean. the gate reads one record either way. (b) swaps where that record comes from, and the gate
code beside it does not change.

## .confidence, and why it is low

60%. on a 🟡 grove each ask still waits minutes, and `FREE` is read before the scans end. a fleet
that sprouts in bursts would feel this first.

## .where

`git.grove.capacity.sh` (the token half, `gate_refuse_early`); caught as a dream:
`.dream/v2026_11_07.feat.capacity-gate-token-record-and-hold-lifecycle.md`.

## .verdict

open.
