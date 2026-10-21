# F3 — port each file three-way, never copy over

## .the fork

- **A.** for each modified file, apply `git diff d121127 58f7430 -- <src>` onto the published copy (three-way), resolve conflicts by hand
- **B.** copy the source at `58f7430` over the published file, then re-apply the lift's adaptations

## .taken — A, and why

the published copies carry three adaptations the source lacks: nested brief layout, the private-name
scrub, and split test suites. B re-derives all three per file and risks a missed scrub. A keeps
them by construction, and the wish says so outright ("never blind-copy over a file the lift
already adapted").

## .rework — dirty

once 70+ files are ported one way, a switch means a redo.

## .confidence — 95%, and why it is not higher

for the five split suites, a three-way patch cannot apply mechanically; new cases are placed by
topic by hand. the yield counts `then` blocks per source suite vs the sum of its splits, so no case
is dropped unseen.

## .where

every `M` file in the delta.

## .verdict

(pending the council — though the wish already implies A)
