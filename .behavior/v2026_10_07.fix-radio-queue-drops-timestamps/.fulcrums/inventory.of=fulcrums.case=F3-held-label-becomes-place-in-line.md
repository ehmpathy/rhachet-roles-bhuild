# F3 — stdout `held since <stamp>` becomes `held #N in line`

- **the fork** — `asRadioHeldSinceLabel` renders `held since 2026-09-29T09:14Z` from `heldAt`. with no `heldAt`: (a) show the place in line, `held #3 in line`; (b) drop the label; (c) keep `heldAt` in an untracked sidecar to keep the label.
- **taken** — (a). the wish says order comes from position; the label then says the one fact the record still holds. stdout is untracked, but it has no clock to read.
- **rework** — clean. one transformer + its snapshots.
- **confidence** — 75%. the label existed to say how long a task waited; (a) loses the "how long". (c) restores it at the cost of a second file.
- **where** — `src/domain.operations/radio/record/asRadioHeldSinceLabel.ts`, `asRadioPushOutput.ts`; recorder acceptance snapshots.
- **verdict** — ruled 2026-10-07: confirmed (a). "loose held since, its irrelevant" — no `.log/` sidecar.
