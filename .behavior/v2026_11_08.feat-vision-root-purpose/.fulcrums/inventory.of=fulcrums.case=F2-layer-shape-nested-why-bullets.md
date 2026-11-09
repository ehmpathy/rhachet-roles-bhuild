# F2: a layer is a nested `- why:` bullet

## .the fork

- **A — nested `- why:` bullets.** depth = the longest chain, each one indent under the last. the nest *is* "a why under a why"
- **B — a numbered list** (`1. why`, `2. why`, `3. why`). simpler to parse; reads as a list of reasons, not a descent
- **C — free prose**, graded by a brain alone. no deterministic count possible

## .taken, and why at the time

A. the wish says "a why under a why under a why" — the nest renders that literally, and a flat list (a common slip) is caught as depth 1.

## .rework

clean. the parser and the scaffold are the only two places that know the shape.

## .confidence, and why it is low

75%. the shape is a convention new to the repo; the wisher may prefer B for its plainness.

## .where

`1.vision.stone` scaffold; the depth parser.

## .verdict

(awaits the wisher)
