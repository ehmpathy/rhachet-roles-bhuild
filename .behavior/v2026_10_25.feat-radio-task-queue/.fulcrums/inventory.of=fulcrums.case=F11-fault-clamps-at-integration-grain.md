# F11 — the fault-path clamps live at integration grain, not in the acceptance journey

- **the fork**: (a) each fault path (access, not-found, rate-limit halt, auth amend, `--auth` override) is clamped in `setRadioTaskRecordsDrained.integration.test.ts`, against a stub `gh` on PATH that returns each fault on demand · (b) also drive each fault through the blackbox acceptance journey
- **taken**: (a). the acceptance journey runs via `os.fileops`, which has no auth and cannot fault upstream; a gh-issues acceptance run would need a real repo that 403s, 404s, and rate-limits on demand, which no test env holds. `--auth as-human` cannot run in a test env at all (the test-env guard forbids it). the integration grain is the cheapest grain that observes each fault (`rule.require.clamp-edge-cases`: clamp at the grain that observes it). each clamp went red with the fix reverted (yield `.clamps`)
- **the clamps, by case**:
  - #511 set aside, the rest deliver → `[case1] a record the robot may not write, ahead of deliverable ones (the #599 shape)` `[t0]`
  - a halt on a wall, the line kept in order → `[case2] a rate limit ahead of others (F1)` `[t0]`, `[t1]`
  - `set --auth` then drain (the #599 / #603 cure) → `[case1]` `[t1] its auth is amended, then the queue is drained again`
  - `drain --auth` override (#513) → `[case4] a drain under a one-off --auth (F3)`
  - not-found → `[case3]`; a shut gate delivers naught → `[case6]`
  - 401 against the real gh → `setRadioTaskRecordsDrainedByPush.integration.test.ts` `[case7]`, `[case7.1]`
  - oldest first across 2+ records → `setRadioTaskRecordsDrainedByPush.integration.test.ts` `[t2] the backlog drains oldest first, then this push`
- **rework**: clean — a gh-issues acceptance step can be added once a demo repo can fault on demand
- **confidence**: 80% — a reviewer who wants each critipath walked through the skill entrypoint may prefer (b); the entrypoint itself is covered by the acceptance journey on the happy and gate paths
- **where**: 5.1 peer review i001, `behavior-intent-coverage` blocker.1, blocker.2, nitpick.2
- **verdict**: —
