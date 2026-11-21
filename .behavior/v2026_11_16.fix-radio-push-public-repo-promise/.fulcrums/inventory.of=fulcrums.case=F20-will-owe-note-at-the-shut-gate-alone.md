# F20: the "will owe --promise" note shows where the gate is known to be ahead

## .the fork

- **A, taken:** the held push names the promise it may owe where the gate is known to be ahead: the radio.uses shut gate (the `lift` branch), and the visibility read wall (F14), whose detail the promise gate writes itself. every other held branch states its own fix
- **B:** add the note to every held branch of a text record with no promise and no `public-repo:*` reason

## .why A, at the time

a shut gate holds a record before any send, and the read runs only for a record that owes a promise. in both, the gate is ahead and the note is true. the other held branches mix two states the fate does not tell apart:

- a fault before the gate: the auth derive, or a wait behind a halt or an earlier update. the gate is ahead
- a fault on the send itself (`upstream:*` from the request). the gate already passed: the repo read private, or the record carried the promise

B would print "a public repo will owe --promise" under a send fault for a private repo. that is a false instruction (`rule.forbid.surprises`).

a record that does meet the gate on a later drain is held as `public-repo:*`. from then on, `queue get`, the drain row, and the hook.onStop line each name the vouch in full. the cost of A is one more round trip for a caller whose pre-gate fault later meets a public repo. that is the alterpath.

## .rework: clean

to tell the two states apart, the held fate would need a field that says whether the gate ran. a new field and one branch.

## .confidence: 80%

## .where

`src/domain.operations/radio/record/asRadioPushOutput.ts` (`asHeldFixBranch`); peer round i004: enroll-impl-behavior-intent item 2.

## .verdict

open.
