# F26 — a transition guard for `RadioTaskRecordStatus`

- **the fork:** transitions implied by the writes that make them — QUEUED → DELIVERED | REFUSED,
  and back to QUEUED only via `isRadioTaskRecordRequeuedByPush` (as shipped) · one explicit
  guard, as `RadioTaskStatus` has `applyStatusTransition`, that every record write passes through
- **taken:** implied. three writes make transitions, each in one place, each covered by an
  integration case; the one invalid shape a reader can hit (DELIVERED with no exid) fails loud
- **rework:** clean — a guard wraps the extant writes with no contract change. deferred as a dream
- **confidence:** 75%. a guard would catch the invalid write at write time, not at render time
- **where:** i006 r011 nitpick 4; dream
  `dreams/2026_09_29.guard-radio-task-record-status-transitions.dream.md`
- **verdict:** —
