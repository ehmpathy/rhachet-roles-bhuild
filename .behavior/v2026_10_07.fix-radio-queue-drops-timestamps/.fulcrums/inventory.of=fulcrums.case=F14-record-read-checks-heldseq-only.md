# F14 — the record read checks the whole record shape

- **the fork** — a peer (arch-hazards-maintenance, i002 blocker.2) asks the dao read to validate every
  field of a record file, not just `heldSeq`. (a) a runtime schema at the dao read; (b) check only
  `heldSeq`, and defer.
- **taken** — (a). a zod schema parses each record file at the dao boundary. a wrong `repo`, `via`, or
  `recordStatus` fails loud at the read, which names the file and each field out of shape. the
  `heldSeq` check runs first and keeps its exact message. keys outside the shape are stripped, so
  legacy clock fields never reach the domain object.
- **why (b) was wrong** — its reason was scope ("predates this branch", "a new repo-wide pattern"). the
  fix sits in one file this branch already rewrote, and the schema lives at the read alone, so no
  construction site or fixture changes. a clear fix in code already open lands now.
- **rework** — clean. one schema and one parse, in the dao.
- **confidence** — 90%.
- **where** — `src/access/daos/daoRadioTaskRecord/index.ts` `schemaOfRecordFile`,
  `asRecordFromFileJson`. clamp: dao case10 (red with the parse off).
- **verdict** — reversed, per the wisher: "if you're already in that code and its a clear fix, do it
  now."
