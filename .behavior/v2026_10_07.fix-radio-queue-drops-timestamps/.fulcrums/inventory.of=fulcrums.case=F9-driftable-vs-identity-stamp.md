# F9 — "driftable" = recomputed per run; a stamp minted once as a name is legal

- **the fork** — the wish's rule: "never write a driftable timestamp into a tracked file". this repo writes dates into tracked **paths** by design: `init.behavior` names routes `.behavior/v2026_10_07.<slug>/`, `catch.dream` names `.dream/v$date.<slug>.md`. (a) the rule forbids any clock value in a tracked file or path — and those conventions fall; (b) the rule defines driftable as a value the writer **recomputes per run**, so a rerun with no change in sense writes new bytes; a stamp minted once as identity is not drift; (c) leave the term undefined.
- **taken** — (b). the wish's own reason is "a clock value changes on every run with no change in sense". a route name does not change on rerun — it is minted once and found thereafter. (a) would forbid conventions the wish never named; (c) leaves a reviewer to guess.
- **rework** — clean. a sentence in the brief.
- **confidence** — 75%. the wisher may want (a) and a later migration of route names; that is far larger than this wish.
- **where** — the brief; vision `## the contract we propose`, `## what is awkward`. the clamp (F8) scans radio writes only, so it does not collide with route names.
- **verdict** — ruled 2026-10-07: superseded by a simpler line. "only timestmaps, datestamps are fine". the rule forbids a value with a time of day (an iso datetime, an epoch number); a datestamp is allowed wherever it sits, so route and dream names stand with no driftable-vs-identity test.
