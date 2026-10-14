# F25 — the skips that predate this branch stand; each waits on a human grant or ci infra

- **the fork** — the verification stone forbids skips. the full runs hold 8 `describe.skip` suites
  (19 integration tests, 33 acceptance tests). (a) unskip each and make it pass now; (b) leave each
  as found, since none is this branch's, and name what each waits on.
- **taken** — (b). `git diff --stat origin/main` over every skipped file is empty, and none tests
  a radio record, a dispatched task body, or the gate:
  - `review.behavior` ×4, `review.deliverable` — shell the real `claude` binary, absent in ci
  - `daoRadioTaskViaGhIssues`, `radio.task.pull via gh.issues` — need
    `BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN`, absent from the keyrack (`rhx keyrack status --owner
    ehmpath` lists no github token)
  - `imaginePlan.brain.case1`, `decompose.behavior.brain.case1` — an infra defect in
    `invokeBrainRepl`, caught as `.dream/v2026_09_28.fix-invokebrainrepl-shells-claude-inside-a-hook-laden-repo.md`
  an unskip would either fail on an absent key (a human grant) or open an infra seam far past the wish.
- **rework** — clean. each unskips the moment its key or infra lands; no code here leans on them.
- **confidence** — 80%. low part: the stone reads "zero skips" without a scope bound.
- **where** — the 8 files named above.
- **verdict** — confirmed by the wisher, 2026-10-13: "keep suites skipped as before".
