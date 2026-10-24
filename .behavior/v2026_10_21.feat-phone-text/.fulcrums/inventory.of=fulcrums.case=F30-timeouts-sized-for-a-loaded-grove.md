# F30 — the acceptance journey budget and the daemon start wait are sized for a loaded grove

## .the fork

two bounds grew in this delivery: the acceptance file's journey budget (`jest.setTimeout(600_000)`)
and the daemon start wait (`START_WAIT`, 10s → 30s, prod code).

- **A (taken)**: size each bound to the sum of what it waits on, measured on a loaded grove; keep
  every inner wait short and loud, so a real hang fails at its own step with its own cause
- **B**: keep the tight bounds, and accept red runs on a loaded grove that no assertion caused

## .taken, and why at the time

measured 2026-10-23: each skill run loads the built package in a fresh node, ~2s idle and 10–15s at
a load average of ~90; a daemon claims its lock in >3s at moderate load and >10s at ~90. at the old
bounds the journeys timed out with no assertion failed, and `phone.daemon set` reported a daemon
that did start as UNCONFIRMED.

a real hang does not run ten minutes: every wait in the journey is bounded and fails loud with a
named cause — `getSaidWhen` and `getWithheldWhen` at 60s (`the stub took N says, not M, within
60s`), `getThreadWhen` at 60s (`the thread never read '…' within 60s`), and each `runRhachetSkill`
at `timeout: 90000`. the start wait ends the moment the lock shows, so the 30s is paid in full only
where no daemon came up, which is the case it exists to report.

## .rework

clean. both are one constant each.

## .confidence — 80%, low because

a ten-minute jest budget reads as slack to a reviewer, and the fast ci runner never needs it.

## .where

`blackbox/role=dispatcher/skill.phone.acceptance.test.ts` (`jest.setTimeout(600_000)`, with its
measured `.why`), `src/domain.operations/phone/daemon/genPhoneDaemon.ts` (`START_WAIT`, with its
measured `.why`). raised by r12 n1 at 5.3 i004.

## .verdict

(open — for the council)
