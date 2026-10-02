# F33 — the extant blocked-push tests now pin the held contract

- **the fork:**
  - (a) re-point the extant blocked / bad-auth push tests from "throws `BadRequestError` /
    `ConstraintError`" to "held QUEUED, exit 2, reason + lift named"
  - (b) keep the old throw asserts and cover the hold only in new tests
- **taken:** (a). the wish changes this exact contract, in its own words: *"a blocked push leaves
  that record **QUEUED**, with the block as its reason — never an error that drops it"*
  (`0.wish.md`). once the push holds rather than throws, a throw assert cannot pass; (b) is not
  available — it would pin the defect the wish exists to remove. each re-pointed test keeps what it
  guarded (the gate level, the auth mode, the fix the human must run) and asserts it on the held
  output: exit 2, the reason, the lift / fix line, and a snapshot. asserts the rewrite had dropped
  were restored in 5.3 (`has-preserved-test-intentions`: case7 `as-robot:env` / `as-robot:shx`,
  case8 `check the command runs`, case10 every mode)
- **rework:** dirty — to revert is to revert the wish
- **confidence:** 95% — the wisher's own words
- **how found:** peer r008 (mech-test-intent) blocker.1 + blocker.2
- **where:** `src/contract/cli/radioTaskPush.integration.test.ts`, `blackbox/role=dispatcher/skill.radio.uses.integration.test.ts`,
  `blackbox/role=dispatcher/skill.radio.task.push.via-gh-issues.acceptance.test.ts` and their snaps
- **verdict:** settled by the wish; recorded for the council
