# F29 — the shape of a cli input error (json hint block, `BadRequestError` header)

- **the fork:**
  - (a) leave the repo-wide input error shape; catch a dream
  - (b) fix only the radio skills' input errors in this branch
  - (c) fix the `asCli` printer + the class for every skill in this branch
- **taken:** (a). (b) leaves `--via` on one class and `--into` / `--from` on another inside the
  same skill, and a radio-only render beside every behaver skill's json block — inconsistency is
  worse than the extant shape. (c) touches ~50 throw sites and every skill's error snaps, and the
  recorder's REFUSED rule depends on the `BadRequestError`-not-`ConstraintError` split in
  `setPartRadioTask`, so a careless sweep would turn refusals into retried holds
- **rework:** dirty — every skill's error output and the recorder's refusal rule ride on it
- **confidence:** 75%. the fix is shown on every captured error, so no human is stuck; the cost is
  scan friction and an unqualified header, not a lost step
- **how found:** self review has-ergonomics-validated — a live `--via`-absent push
- **where:** `src/index.ts` `asCli`; dream `.dream/2026_09_30.cli-input-errors-read-as-qualified-trees.dream.md`
- **verdict:** awaits the wisher
