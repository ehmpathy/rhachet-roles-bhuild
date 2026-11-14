# F24 · `init.behavior --help` names no tail and no re-init (5.1 peer, ergo-friction-hazards i002 nitpick.1)

## .the fork

- (a) add a usage line to `init.behavior --help` on the tail and the `--size` re-init; resnap
  `skill.init.behavior.flags`
- (b) keep `--help` to its options; the readme carries the route's shape

## .taken

(b), disputed.

## .why, at the time

- `--help` lists how to call the skill: usage lines and options. the tail adds no flag and
  changes no call; it changes what a route holds, which the readme documents.
- the re-init needs no new flag either: it is `--size`, already listed with its default.
- (a) costs one more acceptance run on a p0 route whose hour is set; the reviewer graded it low.

## .rework

clean — one help line and one snapshot.

## .confidence

85% — a reader who never opens the readme learns of the tail only from the route itself.

## .where

`src/contract/cli/init.behavior.ts` (the help text); `skill.init.behavior.flags` snapshot.

## .verdict

open — for the council.
