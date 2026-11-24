# F19 — a record with no --auth replays box-relative, named; its identity is not pinned

- **fork**: a record queued with no `--auth` is drained on a box of another identity. (a) pin the identity the push derived onto the record, and replay that · (b) derive on the box that drains, and name the source the drain paid with
- **taken**: (b). a record file stores no token, and a pinned label (`as-ehmpath (via ambient)`) would replay against a box that lacks that spot, so it would hold anyway. the drainer acts on purpose, and every send now names its source (`auth: as-human (via ambient email)`), so the identity never shifts unseen. a record that must keep one identity names it: `rhx radio.task.queue set --uuid <uuid> --auth <auth>`
- **rework**: clean — at hold time, write the derived value (`as-ehmpath-via-ambient`, `as-human`, …) into `record.auth` when it is null; the replay path already reads it
- **confidence**: 75%. the director may want (a), so a robot's queued task never leaves under a human's login
- **where**: `src/domain.operations/radio/record/getOneRadioContextForRecord.ts` (doc note); integration `getOneRadioContextForRecord.integration.test.ts` (box-relative) case1 [t0] [t1]; `radioTaskQueue.ts` `--help` (none) row
- **verdict**: —
