# F8 — the clamp is a byte scan for any iso date or datetime

- **the fork** — how tests prove "no clock field". (a) scan the written bytes for `\d{4}-\d{2}-\d{2}` (with or without `T…`); (b) assert a field allowlist on the record shape; (c) both.
- **taken** — (a), plus the two-run byte-identity test the wish names. (a) catches a clock in any field, a title, or a file name; (b) misses a clock smuggled into `reason`.
- **rework** — clean.
- **confidence** — 85%. low part: a task title the human wrote may hold a date (`ship by 2026-11-01`) — the scan must run on fixture titles that hold none, and the rule exempts human-authored text.
- **where** — case=6; the radio record + task integration suites.
- **narrowed by F9** — the scan matches an iso **datetime** only (a date followed by `T` and a time); a bare datestamp passes. the two-run byte test binds the queue records, and catches an epoch number the scan cannot read.
- **verdict** — unruled.
