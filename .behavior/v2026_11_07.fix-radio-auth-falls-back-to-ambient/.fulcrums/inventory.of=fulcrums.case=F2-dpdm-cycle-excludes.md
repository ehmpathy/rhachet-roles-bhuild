# F2 — the new dpdm cycle gate: exclude the dependency cycles, per package, with upstream cited

## the fork

the boot's practice upgrade (declapract-typescript-ehmpathy 0.50.0) added `test:lint:cycles` and
`.dpdmrc.yaml` with `exclude: []`. CI runs `npm run test:lint`, and the gate reports 15 require
cycles, all inside dependencies, none in this repo's code.

- **A:** exclude each cycled package, one commented entry each, upstream dispatched
- **B:** leave `exclude: []` and hold the pr red until upstream fixes land
- **C:** pnpm overrides that force newer helpful-errors / domain-objects under emoji-space-shim

## taken: A, and why at the time

the director asked for a green pr by its 2026-11-08 deadline. B cannot meet it. C hides the cycle
locally only: overrides do not reach consumers, so it masks the very cycle the gate guards against.
A names each cycle, its cause, and its upstream task (emoji-space-shim#17, rhachet#729).

⚠️ two entries break the policy text, which says a prod-dep cycle is "never" excluded:
`helpful-errors@1.5.3` and `domain-objects@0.31.` arrive via `emoji-space-shim`, a prod dep. the
latest emoji-space-shim (0.1.7) still pins them, so no bump here clears it.

## rework: clean

delete the entries from `.dpdmrc.yaml`. no code leans on them.

## confidence: 70%, and why it is low

the policy forbids the two prod-dep entries outright; the commander may prefer B, or a swap of
emoji-space-shim.

## where

- `.dpdmrc.yaml`

## verdict

open — for the commander
