# F12 — the wish quotes a real timestamp, so the check blocks this route's own commit

- **the fork** — `0.wish.md` lines 11 and 28 quote `"heldAt": "2026-10-07T…Z"` with a real time of day. once `check.timestamps.sh` runs in pre-commit (F11), a commit that stages the wish halts. (a) mask the time in the wish to `THH:MM:SSZ`, with the wisher's consent; (b) commit the route before the hook lands; (c) leave the wish out of the commit.
- **taken** — (a), once the wisher consents. the time adds no sense to the wish — the date and the field name carry the evidence. the vision artifacts already mask their examples the same way.
- **rework** — clean. a two-line edit.
- **confidence** — 70%. the wish is the wisher's verbatim text; an edit to it is theirs to grant.
- **where** — `.behavior/v2026_10_07.fix-radio-queue-drops-timestamps/0.wish.md:11`, `:28`.
- **verdict** — confirmed by the wisher, 2026-10-13: "mask the ones in the wish". both quotes now
  read `2026-10-07THH:MM:SSZ`. the other route files that quote a clock time sit under gitignored
  `review/self/` and `.reviews/peer/`, so they never reach the gate.
