# F15 — pre-extant skips left as-is at 5.3

- **the fork**: (a) unskip all 9 `describe.skip` suites in this pr · (b) leave them, each with its
  cause recorded and a caught dream that carries the fix
- **taken**: (b)
- **why**: none of the 9 files differs from `origin/main` (`git diff origin/main...HEAD --stat` on
  all 9 prints naught), so no skip is a gap this pr opened. each needs what this round cannot prove:

| suite | skip cause | the fix, and why not here |
|---|---|---|
| `daoRadioTaskViaGhIssues.integration` (7 tests) | a github token that writes to the demo repo | `EHMPATH_BEAVER_GITHUB_TOKEN` already does, in ci; but it is absent on this host, so a rewire is provable only in a ci run, and the done gate holds one commit |
| `radio.task.pull.via-gh-issues.acceptance` [case1]–[case4] | same key | same; and its scene lacks `radio.uses allow`, so a blind unskip goes red |
| `review.behavior` ×4, `review.deliverable` (acceptance) | shells the real `claude` binary, absent in ci | ci provisions claude — not this repo's code |
| `imaginePlan.brain.case1`, `decompose.behavior.brain.case1` (integration) | `invokeBrainRepl` shells claude inside a hook-laden repo | `.dream/v2026_09_28.fix-invokebrainrepl-shells-claude-inside-a-hook-laden-repo.md` |

  the radio pair is caught, with its new shape, in
  `dreams/v2026_09_28.restore-live-coverage-for-three-external-contracts.md`
- **rework**: clean — each suite is one test file; a later pr unskips it with no prod change
- **confidence**: 80% — the stone forbids skips with no carve-out for pre-extant ones; a wisher may
  want the radio pair unskipped here and a ci round spent on it
- **where**: 5.3 verification, zero-skips check
- **verdict**: —
