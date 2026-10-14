# F21 — the legacy-record and cross-dir drain journeys are proven at integration, not at the cli

- **the fork** — peer enroll-impl-behavior-intent (i007 nitpick.4, nitpick.5): journey case=3 (a
  legacy record with clock fields) and case=4 (a drain across a route dir and the unbound dir) have
  no cli test or snapshot. (a) add two acceptance cases through `radio.task.push`; (b) keep them at
  integration.
- **taken** — (b). both are real tests on the real filesystem, with no mocks:
  `setRadioTaskRecordsDrainedByPush.integration.test.ts` case12 drives two legacy records (one
  unbound, one in a route dir) through a drain and asserts every record ends DELIVERED with no clock
  key; case11 drains across both dirs and asserts heldSeq order `[1,2,3]` and byte-identical reruns.
  the cli adds only the stdout render on top, and that render (one drained line per record, in
  drain order) is pinned by the recorder acceptance snapshot [t4]. a cli case would repeat the
  integration proof through a slower door.
- **rework** — clean. two more acceptance cases, if the council wants them.
- **confidence** — 80%. low part: `rule.require.test-coverage-by-grain` asks contracts for
  acceptance + snapshots, and a strict read wants each journey at the contract.
- **where** — `src/domain.operations/radio/record/setRadioTaskRecordsDrainedByPush.integration.test.ts`
  (case11, case12); `blackbox/role=dispatcher/skill.radio.task.recorder.acceptance.test.ts` ([t4]).
- **verdict** — reworked to (a) at verification, 2026-10-12: the verification stone asks each
  journey at the contract, so recorder acceptance case5 drives case=1, case=3 and case=4 through
  `radio.task.push` alone (a legacy record, a push held unbound, a route bind, a push held bound,
  the radio opened, a drain) in two repos seconds apart, and asserts byte-identical records plus a
  snapshot of their bytes. a clock field at transcribe turns it red. the integration cases stay.
