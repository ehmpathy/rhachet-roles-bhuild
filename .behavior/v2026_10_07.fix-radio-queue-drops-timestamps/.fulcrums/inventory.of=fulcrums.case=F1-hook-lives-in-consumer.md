# F1 — the cited hook lives in the consumer repo, not here

- **the fork** — the wish says the record "violates the repo hook that forbids driftable timestamps". either (a) this repo ships or should ship that hook, or (b) the hook lives in the consumer repo where the dispatch landed.
- **taken** — (b). this repo's claude hooks (`.agent/.actors/actor.via.slug=.default/brain/.claude/settings.json`) list no timestamp hook; the installed `rhachet-roles-ehmpathy@1.39.3` mechanic inits hold none; `.radio` is gitignored here (`.gitignore:28`), so no record could be tracked in this repo. the record was tracked in a consumer.
- **rework** — clean. if the wisher wants this repo to ship the hook too, that is an added deliverable, not a reversal.
- **confidence** — 70%. i did not see the hook; i infer its home from absence.
- **where** — vision `## open questions`; criteria will scope "the hook passes" to the clamp test this repo owns.
- **verdict** — ruled 2026-10-07: confirmed. "its a husky hook". it is `check.timestamps.sh` from `declapract-typescript-ehmpathy`; this repo's `.husky/` lacks it, and the wisher wants it here too (F11).
