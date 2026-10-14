# F20 — a push reads the records three times, and each read is needed

- **the fork** — peer enroll-impl-behavior-intent (i006 nitpick.2): the mint, the drain, and the
  backlog count each read every record. (a) thread one read through all three; (b) keep three.
- **taken** — (b), as correct, not as a deferral. each read sees a state the one before cannot:
  - the mint reads before the push is saved, leniently, so a bad record elsewhere never stops the save
  - the drain reads after the save, under its lock, so a concurrent drain never leaves it a stale copy
  - the count reads after the drain wrote each fate, so it counts what still waits
  one shared read would hand the drain and the count a state from before the save. a repeat push
  keeps its seq and skips the mint sweep.
- **rework** — clean. no change owed.
- **confidence** — 85%. low part: records are never pruned, so each read grows with use. that is a
  prune question, not a read-count one, and no record count yet makes a push slow.
- **where** — `radioTaskPush.ts`, `setRadioTaskRecordFromPush.ts`, `setRadioTaskRecordsDrainedByPush.ts`.
- **verdict** — ruled not a defect; the dream is closed.
