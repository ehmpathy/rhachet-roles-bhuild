# F4 — where a dropped record lives, and what a re-push does to it

- **the fork**: (a) a new `recordStatus: DROPPED` in place, `reason: "dropped: <why>"`, body kept · (b) move the file to an archive dir beside the queue (#604's words)
- **taken**: (a). the record dao, the held filter, and the clock-shed sweep already read one dir per route; a new status is one enum value and one filter. a move adds a dir every reader must know to skip
- **and**: a re-push of a DROPPED key re-queues it, as a re-push of a REFUSED key does today (`isRadioTaskRecordRequeuedByPush`, F10 there). without this branch, the rule falls through to "keep the fate" and the re-push stays DROPPED with no word — a push the help calls never lost, lost
- **rework**: clean — (b) is a rename at del time
- **confidence**: 75%. #604 says "archive beside the queue"; (a) keeps the body beside the queue, in the same file
- **where**: `RadioTaskRecordStatus.ts`, `isRadioTaskRecordHeld.ts`, `isRadioTaskRecordRequeuedByPush.ts`
- **verdict**: —
