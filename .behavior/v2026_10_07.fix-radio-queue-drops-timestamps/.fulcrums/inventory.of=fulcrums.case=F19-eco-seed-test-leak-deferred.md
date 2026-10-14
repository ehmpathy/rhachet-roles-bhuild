# F19 — the eco.seed case that pushes runs in a hermetic temp repo

- **the fork** — peer enroll-impl-arch-defects (i006 nitpick.6) found
  `eco.seed.integration.test.ts` case6 writes a radio record into the real worktree. (a) make the
  case hermetic; (b) delete the stray record, and dream the harness fix.
- **taken** — (a). case6 alone runs in a temp git repo that links this repo's `.agent/` and
  `node_modules/`, so `rhx` and the skill's package import find the same code, and the push records
  in the temp repo. the other cases write no record, so they keep the suite's cwd.
- **why (b) was wrong** — its reason ("a temp cwd breaks every case") assumed a whole-suite change.
  only the one case that pushes needs a temp cwd, and two symlinks give it one. the leak recurred on
  every full run (`record.80100d2dc7fa36e9.json`, listed to a human by `radio.task.held`), so the
  deferral cost real confusion.
- **rework** — clean. a `cwd` on the `seed()` helper, one temp-repo helper, one clamp.
- **confidence** — 90%.
- **where** — `src/domain.roles/prioritizer/skills/eco.seed.integration.test.ts` case6 `[t3]`
  (red with the `cwd` dropped: the record lands in this worktree again).
- **verdict** — reversed, per the wisher: "if its a clean simple fix, do the fix."
