# F30 — the two gh suites gated on `BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN`

- **the fork:**
  - (a) leave `daoRadioTaskViaGhIssues.integration` and `skill.radio.task.pull.via-gh-issues.acceptance`
    as `describe.skip`; hand the key to the foreman (handoff §3)
  - (b) unskip them now, so they fail red on the absent key
- **taken:** (a). the skips predate this branch (unchanged on `main`), and the key is absent from
  `rhx keyrack status --owner ehmpath`; only a human fills a keyrack key. (b) turns a known,
  named wall into two red suites with the same cause and the same owner, and hides the F20 reds
  among them. the recorder's own gh dependency is the push path, which F20 proves in cicd
- **rework:** clean — once the key lands, delete two `.skip` and run
- **confidence:** 80%. the stone reads "remove the skip"; against it, a skip whose only remedy is a
  key the driver cannot fill, pre-extant, and outside the recorder's changed surface
- **how found:** self review has-zero-test-skips; peer r003 (mech-external-contracts) nitpick.1
- **where:** handoff §3
- **verdict:** awaits the wisher (fill the key, or rule the skips stand)
