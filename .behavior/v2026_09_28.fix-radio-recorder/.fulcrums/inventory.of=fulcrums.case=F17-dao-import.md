# F17 — `daoRadioTaskRecord` imported, not injected via context

- **the fork:** import the fs dao · thread it through `context` of each record operation
- **taken:** import it. the dao is a local-file adapter whose only test double would be a mock,
  and mocks are forbidden in integration tests (`rule.forbid.integration.mocks`); every record
  operation is proven against a real temp dir instead. the swappable input — which dir — already
  rides in `context.dir`
- **rework:** clean — add `dao` to the context shape of four operations
- **confidence:** 75%
- **where:** `getAllRadioTaskRecordsHeld.ts`, `getOneRadioTaskRecordHeldSeqNext.ts`,
  `setRadioTaskRecordFromPush.ts`, `setRadioTaskRecordUpstream.ts`; peer r5 nitpick.3
- **verdict:** —
