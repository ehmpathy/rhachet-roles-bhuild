# F23 · a bare re-init of a nano route adds every medi stone (5.1 peer, ergo-friction-hazards nitpick.1)

## .the fork

- (a) change `init.behavior` so a re-run with no `--size` infers the route's own size, or warns
- (b) keep the default `medi`, extant on `main`; the readme names it and says to pass `--size`

## .taken

(b), disputed.

## .why, at the time

- the default is extant behavior, not this pr's. a size inferred from the files on disk is a new
  contract for `init.behavior`, and the wish (#590) asks for the tail, not for a re-init redesign.
- inference has its own hazard: a route whose stones were removed by `route.stone.del` reads as
  a smaller size than it was inited at, so an inferred size can drop the stones a driver meant to
  restore.
- the friction is named where a reader meets it: the readme paragraph on the tail says to re-init
  at the route's own `--size` and that a bare re-run adds every medi stone.

## .a third option, raised by peer review (5.1, i005, r011)

(c) when the behavior dir already exists and `--size` is absent, refuse with a `ConstraintError`
that names the sizes. it sidesteps (a)'s inference hazard, and the readme note then describes a
guard rather than a trap.

## .rework

clean — a later behavior on `init.behavior`'s size flag; no template or test here leans on (b).

## .confidence

90% — the reviewer graded it a nitpick and named the readme note as mitigation.

## .where

`readme.md`, the init.behavior tail paragraph; `src/contract/cli/init.behavior.ts` (the default).

## .verdict

open — for the council.
