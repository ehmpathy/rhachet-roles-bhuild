# F2 — heldSeq spans the worktree, not one dir

- **the fork** — with `heldAt` gone, the cross-dir drain (`getAllRadioTaskRecordsHeld` → `asRadioTaskRecordOrder`) loses its lead key. (a) mint `heldSeq` as 1 + the max across every record dir in the worktree; (b) keep per-dir seq and order by dir then seq; (c) accept key-hash order across dirs.
- **taken** — (a). it keeps the true push order, needs one change in `getOneRadioTaskRecordHeldSeqNext` (read `get.dirs` not `[dir]`), and needs no new field.
- **rework** — clean. one transformer and its read scope.
- **confidence** — 85%. low part: two concurrent pushes in two dirs could mint the same seq; the extant drain lock covers the drain, not the mint. the key tiebreak keeps the order total either way.
- **where** — case=4; `src/domain.operations/radio/record/getOneRadioTaskRecordHeldSeqNext.ts`.
- **raised** — arch-hazards-maintenance, i002 blocker.3, names this same race. a tie occurs only
  between two pushes at one instant, which have no true order between them; the key tiebreak gives
  them a total, stable order; and the drain runs under the worktree lock, so neither is lost or sent
  twice. to close it fully, the mint must move under a lock, so every push waits on every other push.
  that is dirty, so it stays here, disputed.
- **verdict** — unruled.
