# F16: the nudge render reads the push args from `radio/cli/`

## .the fork

- **A, taken:** `record/asRadioPromiseNudgeOutput` takes the parsed `RadioPushArgs` and composes the re-run via `cli/asRadioPushCommandWithPromise`
- **B:** the contract composes the command and passes a finished string, plus each arg fact the render needs (inherited body, stdin body, status present)

## .why A, at the time

`radio/cli/` is the radio domain's own arg vocabulary under `domain.operations/`, not the contract layer: `RadioPushArgs` is a domain type, and the contract imports it from there. the render reads more than the command — whether the body was piped, whether it was inherited, whether a status rides along — so B would pass four loose facts in place of one typed shape. precedent: `record/asRadioPushOutput` already imports `cli/asTaskDetailOutput`. the dependency runs one way (`record → cli`, never back), so no cycle.

## .rework: clean

a move of one call into the contract and three booleans into the render's input.

## .confidence: 80%

## .where

`src/domain.operations/radio/record/asRadioPromiseNudgeOutput.ts`; peer round i002: arch-smell-scopeleaks nitpick.1.

## .verdict

open.
