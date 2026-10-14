# F10 — the drain lock dir writes its own `.gitignore`

- **the fork** — the drain lock lives at `.behavior/.radio/.locks/` (`withRadioDrainLock.ts:10-11`), inside a dir a consumer may track. its envelope holds `expiresAtMse`, an epoch-ms clock (`simple-on-disk-cache@1.8.1` `asSerializedEnvelope.js:17`); the cache's valid-keys index holds one too (`KeyWithMetadata.d.ts:12`). a clean release deletes the lock; a crash leaves it. (a) the lock dir writes `.gitignore` = `*` on creation; (b) move the lock out of `.behavior/` (e.g. under `.log/` or the os temp dir); (c) leave it — crashes are rare.
- **taken** — (a). the lock dir is already a radio-owned subdir; a self-ignore keeps it where the drain finds it and hides every file in it from git — lock and index alike — in any consumer. (b) changes where every clone looks for the lock, so two clones on one worktree at different versions would hold two different locks across an upgrade. (c) leaves the wish's harm open through a side door.
- **rework** — clean. one file write beside the mkdir; or a path move.
- **confidence** — 70%. low part: i did not confirm whether the valid-keys index file outlives a clean release. the `*` covers it either way.
- **where** — case=9; `src/domain.operations/radio/record/withRadioDrainLock.ts`.
- **verdict** — unruled.
