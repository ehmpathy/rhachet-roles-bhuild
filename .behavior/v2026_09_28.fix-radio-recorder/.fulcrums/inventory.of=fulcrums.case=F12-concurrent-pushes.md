# F12 — two pushes at once in one worktree

- **the fork:** a file lock (or compare-and-set) around seq allocation and record writes · no lock;
  lean on convergence
- **taken:** no lock. the record store converges without one:
  - **order** — two pushes that race have no happens-before between them, so no order among them
    is "the push order". a tie on `heldSeq` falls to `heldAt`, then to `key` — deterministic, and
    each order is as true as the other. pushes that do not race get distinct seqs
  - **state** — the worst interleave (A writes DELIVERED, B writes back its stale QUEUED) leaves a
    delivered task marked QUEUED. the next drain re-sends it; upstream findsert (X2) finds the
    extant issue and the record closes as `already upstream — marked delivered` (case=4). a status
    update re-sent sets the same status. no task is lost, none is doubled upstream
  - the write itself is atomic (temp + rename), so no reader sees a torn file
- **rework:** clean — a lock wraps the dao's `set.upsert` and `getOneRadioTaskRecordHeldSeqNext`
  in one place; no caller changes
- **confidence:** 80%. low because the stop reminder can show a delivered task as held for one
  cycle after such a race, until the next push drains it
- **where:** `getOneRadioTaskRecordHeldSeqNext.ts`, `setRadioTaskRecordFromPush.ts`,
  `setRadioTaskRecordDispatched.ts`; peer r7 blocker.1 + blocker.2
- **verdict:** —
