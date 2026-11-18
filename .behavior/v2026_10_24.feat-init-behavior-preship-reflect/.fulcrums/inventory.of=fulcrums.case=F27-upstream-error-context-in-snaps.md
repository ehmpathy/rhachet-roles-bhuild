# F27 · the error context blocks upstream prints stay in the journey.tail snaps (5.3 peer, ergo-snapshot-visual-blemishes i001 blocker.2)

## .the fork

- (a) mask the json context block and the `[args]` line out of the `[t7]` and `[t1]` snaps
- (b) snap them verbatim: they are the error a caller meets

## .taken

(b), disputed.

## .why, at the time

- `[t7]` is named "the error a stranger meets, snapped". its whole job is to show what a consumer
  with no mechanic role sees. a mask would show a cleaner error than the one that ships.
- the json block is the `helpful-errors` metadata of a `ConstraintError` (rhachet) and of a
  `BadRequestError` (bhrain): context by design, per `rule.require.failloud` (errors carry their
  context). the `[args]` line is rhachet's own echo. neither is code this repo owns.
- a mask in this repo's test cures no caller; it only hides an upstream format from the one
  reviewer who could see it drift. if the format is a blemish, its cure is in rhachet.
- the other blemish this lane raised (the banner twice, joined across stdout and stderr) was
  this repo's own test seam, and it is fixed: each stream is now labeled.

## .rework

clean — one mask function and a resnap, if the council rules (a).

## .confidence

85% — a council may read the context block as noise the rule forbids regardless of its owner.

## .where

`blackbox/role=behaver/skill.init.behavior.guards.journey.tail.acceptance.test.ts` [t1], [t7].

## .verdict

open — for the council.
