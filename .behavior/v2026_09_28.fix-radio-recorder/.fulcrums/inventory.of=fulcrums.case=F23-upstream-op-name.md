# F23 — the upstream send op keeps its name `radioTaskPush`

- **the fork:** keep `radioTaskPush` as the name of the upstream send op the recorder calls ·
  rename it to say it is the raw send (e.g. `setRadioTaskUpstream`), since the cli
  `radio.task.push` now means "record, then maybe send"
- **taken:** keep. the op predates this tree and has callers + tests of its own; the recorder
  reaches it only via `setRadioTaskUpstreamFromRecord`, whose name already says "upstream"
- **rework:** dirty-ish — a rename across the op, its tests, and every caller, outside the diff
  this tree opened. deferred as a dream
- **confidence:** 75%. a reader who meets `radioTaskPush` may assume it records, as the cli does
- **where:** i005 r011 nitpick 4; dream
  `dreams/2026_09_29.rename-radio-task-push-op-to-name-the-raw-send.dream.md`
- **verdict:** —
