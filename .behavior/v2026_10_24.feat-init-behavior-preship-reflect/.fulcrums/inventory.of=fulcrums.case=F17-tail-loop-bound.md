# F17 · the tail's loop bound

## .the fork

the tail bounds each loop (a fix round, a watch) at 3 tries, then a halt with the cause verbatim.
the wish says "drive it green", which a halt after 3 cuts short. a watch cut off by a tool timeout
is not ruled.

- (a) 3 per loop; a timeout counts as a try
- (b) 3 per loop; a timeout is re-run and not counted
- (c) another count

## .taken

none — reserved for the commander as blueprint q10. raised at i005 by `enroll-blueprint-behavior-intent`
(nitpick 3): the bound was added at i002 to answer an unbounded-loop hazard, and was never itself
put to the commander.

## .rework

clean — one line of `6.preship.stone`.

## .confidence

n/a — not guessed.

## .where

blueprint `6.preship.stone` step 3; `## open questions` q10.

## .verdict

open.
