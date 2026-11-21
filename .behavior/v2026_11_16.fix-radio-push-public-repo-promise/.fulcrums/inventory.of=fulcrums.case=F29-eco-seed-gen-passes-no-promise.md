# F29: `eco.seed gen` passes no `--promise`; a seed into a public repo stops at the nudge

## .the fork

`eco.seed gen` (prioritizer) pushes a seed body through `radio.task.push --description @stdin`. with the gate,
a seed into a public repo meets the nudge. the fork:

- **a.** add a `--promise` passthrough to `eco.seed gen`, and a journey that runs a stub-public seed end to end
- **b.** keep `eco.seed` as it is but show the push's stdout on a failed push, so the nudge reaches the caller
  (clamp: `eco.seed.integration` [case6][t4], proved red with the fix reverted); the passthrough is a dream

## .taken: b, and why at the time

- **#675 names `radio.task.push`, not the prioritizer.** a passthrough is new surface on another role's skill,
  its help, and its boot, which sits near its token cap
- **the gate fails safe there.** a seed into a public repo exits non-zero with the nudge shown; naught leaks
- **the shape is caught**: `.dream/2026_11_17.eco-seed-gen-passes-promise-through.dream.md`, symlinked at this
  route's `dreams/`; the pr body says plainly that `eco.seed` into a public repo is blocked until it lands

## .rework

clean. one flag in `eco.seed.sh`, validated as the literal, passed through; one journey case with a stub-public
read.

## .confidence, and why it is low

80%. the clamp proves the stdout reaches the caller with a push that holds; no test runs a stub-public seed, so
the nudge bytes through `eco.seed` are unsnapped.

## .where

`src/domain.roles/prioritizer/skills/eco.seed.sh`; `eco.seed.integration.test.ts` [case6][t4]
