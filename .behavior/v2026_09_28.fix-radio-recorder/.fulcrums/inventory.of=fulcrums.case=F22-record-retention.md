# F22 — how long a settled record is kept

- **the fork:** keep every record (DELIVERED and REFUSED stay on disk) · archive or prune settled
  records past some age or count
- **taken:** keep all. a record is route-local (F8), so the route's own lifespan bounds it; a
  route holds tens of pushes, not thousands. the settled record is also the proof a re-push reads
  (`already delivered as #N`, C3/C9) — prune it and a verbatim re-push would re-send
- **rework:** clean — a retention pass is additive (move settled records aside), provided it keeps
  the identity a re-push needs. deferred as a dream
- **confidence:** 80%. the cost grows with a long-lived route: every push and every stop hook
  reads all records in the worktree (F4 sweep)
- **where:** i005 r011 nitpick 1; dream
  `dreams/2026_09_29.radio-record-retention-for-settled-records.dream.md`
- **verdict:** —
