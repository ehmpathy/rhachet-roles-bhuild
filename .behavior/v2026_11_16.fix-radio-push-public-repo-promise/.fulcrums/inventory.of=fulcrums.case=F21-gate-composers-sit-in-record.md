# F21: the promise gate composers sit in `record/`, not `promise/`

## .the fork

the blueprint drew five files in `radio/promise/`: `asRadioPromiseHoldReason`, `asRadioPromiseNudgeFromFate`, `asRadioPromiseNudgeOutput`, `getOneRadioPromiseHold`, and `getOneRadioFateHeldOnPromiseGate` (built as `setRadioTaskRecordHeldOnPromiseGate`, since it writes the record).

- **A, taken:** the five sit in `radio/record/`. `promise/` holds the leaf vocabulary only: the literal, the reason set, the owed test, the hold-reason guard, the hold detail, the text test
- **B:** the five sit in `promise/`, as drawn

## .why A, at the time

each of the five composes `record/` vocabulary: the fate type, the hold writer `setRadioTaskRecordHeld`, the upstream-reason predicates, the send-limit step, the tree-line render. `record/` already imports `promise/` (the literal, `isRadioPromiseHoldReason`). under B, `promise/` would import `record/` back, so the two subdomains would depend on each other (`rule.require.directional-deps`).

under A the dependency runs one way, `record → promise`, checked: `grepsafe "from '../record"` in `promise/` finds none. the blueprint's decomposition claim still holds: the per-record send composes the gate at one line, `setRadioTaskRecordHeldOnPromiseGate`.

## .rework: clean

five file moves and their imports. no caller contract changes, and no behavior changes.

## .confidence: 85%, and why not higher

the blueprint chose `promise/` with the whole design in view. a reader who wants every promise file in one place pays a second directory. the cost of B is the cycle, which the blueprint did not weigh.

## .where

`src/domain.operations/radio/record/{asRadioPromiseHoldReason,asRadioPromiseNudgeFromFate,asRadioPromiseNudgeOutput,getOneRadioPromiseHold,setRadioTaskRecordHeldOnPromiseGate}.ts`; found at 5.2 evaluation.

## .verdict

open.
