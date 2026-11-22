# F13 · calibrate on two reads alone; the one-read path is deferred

## .the fork

the vision's `calibrate` derives tokens-per-% two ways: **(a)** from two cap reads, as the % rise
over the span against the burn in that span, or **(b)** from one cap read plus its window reset
time, as the % used since the window began against the burn since the window began.

- **ship (a) alone**, and catch (b) as a dream
- **ship both** in this branch

## .taken, and why

(a) alone. (b) needs each account's burn since its window began: 5h for the short cap, and
**7 days** for the weekly one — a scan of every transcript on every grove over 10,080 minutes, on
a box whose cpu stall reads 🔴 98%. the scan is the cost the wish asks us to cut
(`surgoal.squeeze-the-grove`: a census that forks per process is itself a saturator). (a) needs only
two ledger rows, which the seat restart yields within minutes, and its scan spans the gap between
them.

## .rework

dirty, a little: (b) adds a second verdict path to `calibrate`, and every render of a calibrated
window would say which path it took. the dream names the shape:
`$route/dreams/v2026_11_06.feat.calibrate-from-one-cap-read.md`.

## .confidence, and why it is low

70%. (b) would calibrate the 5h cap from the very first ledger row, so a fleet with one read sees
a number sooner. if two rows take longer to land than we expect (a seat that logs once and then
idles), (a) stays ⚪ while (b) would not.

## .where

`git.crew.tokens.sh` (`calibrate`, the `$straddled` and `sustainable_per_hour` block).

## .verdict

open.
