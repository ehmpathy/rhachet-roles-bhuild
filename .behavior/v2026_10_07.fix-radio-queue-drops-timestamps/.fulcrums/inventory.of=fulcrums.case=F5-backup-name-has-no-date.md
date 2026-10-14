# F5 — os.fileops backup is `task.<exid>.bak.md`

- **the fork** — `getBackupFilePath` names `task.<exid>.bak.<date>.md`. (a) one backup, `task.<exid>.bak.md`, overwritten per edit; (b) a seq, `task.<exid>.bak.<n>.md`; (c) no backup.
- **taken** — (a). the repo readme calls it "backup from prior edit" — singular. a same-day edit already overwrites today; (a) makes that the rule for every day.
- **rework** — clean.
- **confidence** — 80%. low part: a two-day edit chain loses the elder backup that a date name kept.
- **where** — `src/access/daos/daoRadioTask/daoRadioTaskViaOsFileops.ts:62`, the repo readme in `bootstrapRadioDir.ts:75`.
- **verdict** — ruled 2026-10-07: reversed. the name holds a datestamp, which the wisher allows; `task.<exid>.bak.<date>.md` stays.
