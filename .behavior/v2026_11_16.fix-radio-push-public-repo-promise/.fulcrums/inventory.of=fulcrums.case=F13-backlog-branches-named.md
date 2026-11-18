# F13: the nudge's backlog branches stay a named transformer, with one caller

## .the fork

- **A, taken:** keep `asRadioPushBacklogBranches` (sections → fates, then the shared backlog line), called from `radioTaskPush.ts`
- **B:** inline its composition at the one call site in the contract

## .why A, at the time

the call site is a contract orchestrator. inline, it would hold a section spread, an empty-check, and a branch append — decode-friction in an orchestrator, which `rule.forbid.decode-friction-in-orchestrators` grades a blocker. `rule.prefer.wet-over-dry` governs when to *generalize* similar code, not whether an orchestrator may name its steps; a named step with one caller is the architect's narrative form. the one piece with two callers, the backlog line, is lifted (`asRadioBacklogBranch`).

## .rework: clean

## .confidence: 85%

## .where

`src/domain.operations/radio/record/asRadioPushBacklogBranches.ts`; peer round i001: arch-opport-decomposition nitpick.2.

## .verdict

open.
