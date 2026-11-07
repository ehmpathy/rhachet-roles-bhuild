# F17 — the phone keeps its own treestruct renderer; the lift to infra is deferred

## .the fork

- **A (taken)**: the phone renders with its own recursive `asPhoneTreeLines`, a fifth hand-rolled
  `├─` / `└─` renderer in the repo
- **B**: lift one renderer into `src/infra/render/` and migrate radio, behavior, and cli arg errors
  onto it in this delivery

## .taken, and why at the time

found in the `has-consistent-mechanisms` self review of stone 5.1. the extant radio renderer is fixed
at two levels and the phone needs three, so reuse as-is was not possible. B would touch four extant
surfaces and their snapshots that this delivery never opened — safe, but dirty to pull in.

## .rework

clean. the phone renderer is already the general shape (recursive, any depth); a later lift moves
it and renames it, and the phone's own callers change one import each.

## .confidence — 85%

the risk is only that the wisher wanted the lift in this delivery. the lift is caught as dream
`2026_10_21.treestruct-renderer-lift`, with the migration plan and the byte-identical snapshot bar.

## .where

`src/domain.operations/phone/render/asPhoneTreeLines.ts`; peers listed in the dream.

## .verdict

open.
