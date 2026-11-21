# F17: the record-path renders read `process.cwd()`, not a cwd input

## .the fork

- **A, taken:** `asHeldFixBranch`, `asRadioHeldOutput`, `asRadioDrainHeldRow` build the record path with `{ cwd: process.cwd() }`
- **B:** each render takes `cwd` as an input, threaded from the contracts' `context.cwd`

## .why A, at the time

`rule.forbid.cwd-override` fixes cwd as `process.cwd()`, the repo root, so both forks render the same path at runtime. B changes six renders, two contracts, and dozens of test call sites for no behavior change. the deferral is for dirt, so a dream holds the shape of B: `.dream/2026_11_17.radio-renders-take-cwd-as-input.dream.md`.

## .rework: dirty

six render signatures and their test call sites.

## .confidence: 75%

## .where

the three renders above; peer round i003: arch-opport-decomposition nitpick.1.

## .verdict

open.
