# F4 — os.fileops drops its date fields; RadioTask date fields go nullable

- **the fork** — the wish: "a radio push never writes a clock value into the task … it sends (… an os.fileops task file)". the file writes `pushed_at`, `claimed_at`, `delivered_at` as `IsoDateStamp` — a date, which still drifts across days. (a) drop all three from the file; `RadioTask.pushedAt/claimedAt/deliveredAt` become `| null`; os.fileops reads null (or a legacy value), gh.issues reads github's own `createdAt`; (b) keep them — a date is coarse enough; (c) derive from file mtime on read.
- **taken** — (a). (b) contradicts the wish's "two runs a day apart write the same bytes"; (c) reads a value that moves on every edit.
- **rework** — clean. the type change ripples to `asTaskDetailOutput` (already renders `(not set)`) and to tests that pin `'2026-01-30'`.
- **confidence** — 75%. the os.fileops dir is `~/git/.radio/…`, outside any repo — so it is not a tracked file today. the wish still names it, so it is in scope.
- **where** — `composeTaskIntoOsFileops.ts`, `extractTaskFromOsFileops.ts`, `setFullRadioTask.ts`, `setPartRadioTask.ts`, `RadioTask.ts`.
- **verdict** — ruled 2026-10-07: reversed to (b). "os.fileops too" — in scope — but "only timestmaps, datestamps are fine". the three fields are datestamps, so the file format, the reader, and `RadioTask` stay as they are. a clamp keeps them datestamps.
