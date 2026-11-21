# F14: a visibility read that meets a rate limit or an outage halts the drain; it is not nudged as unreadable

## .the fork

- **A, taken:** a halt-class fault on the read (rate limit, 5xx, reset, timeout) is a wall: the drain halts, the record stays QUEUED in place, the row names `visibility read: <code> (<cause>)`; the next drain reads again
- **B:** treat every read fault as `public-repo:unreadable`: drop the push's own record with the nudge, hold others for a vouch

## .why A, at the time

criteria `2.1.criteria.blackbox.yield.md` usecase.12 declares it: *"given a visibility read that meets a rate limit or an outage, when the drain reaches it, then the drain halts as for a send wall; the record is not marked unreadable"* (catalog #30–32). usecase.3's "network" row sits in the given of an unreadable read; usecase.12 refines which network faults: a transient one is a wall, the same rule a request fault already follows. under B, a minute of github outage would drop every pusher's record and ask each to vouch for text that is likely bound to a private repo. both forks send naught unchecked; A keeps the record and retries the read.

## .rework: clean

one predicate in `getOneRadioPromiseHold` (`isRadioUpstreamReasonHalt` on the read's code).

## .confidence: 85%

## .where

`src/domain.operations/radio/record/getOneRadioPromiseHold.ts`; journey [case8][t1–t2]; peer round i001: behavior-intent-coverage blocker.2.

## .verdict

open.
