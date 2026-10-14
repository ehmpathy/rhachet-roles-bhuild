# F24 — the gh.issues proof awaits a credential only a human can set

- **the fork** — peer enroll-impl-behavior-intent (i007 blocker.2): 14 gh.issues acceptance tests
  and 2 integration tests do not run, because `EHMPATH_BEAVER_GITHUB_TOKEN` is absent from the
  ehmpath keyrack. (a) hold the stone until the token is set and the tests run; (b) pass the stone
  on the os.fileops proof plus the gh.issues compose clamp, and hand the token ask to the human.
- **taken** — (b), with the ask surfaced. the driver cannot set a keyrack credential. this change
  does not touch the gh.issues send path: `composeTaskIntoGhIssues` is unchanged and its unit clamp
  composes every status with no time of day. the 16 tests fail at the auth step, before any code
  this route changed, with `EHMPATH_BEAVER_GITHUB_TOKEN (status: absent)`.
- **the ask** — `rhx keyrack set --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env test`, then
  `rhx git.repo.test --what acceptance --against local --env test --scope 'path://radio.task.push' --mode apply`
- **rework** — clean. no code change; the human runs two commands.
- **confidence** — 85%. low part: `philosophy.verification-strictness` grades a credential gap a
  blocker, so the council may hold the merge on it.
- **where** — `src/domain.operations/radio/auth/genAuthFromKeyrack.ts`; the gh.issues acceptance suite.
- **verdict** — ruled by the wisher, 2026-10-13: "just use the cicd one". no local token is set;
  ci's keyrack firewall supplies `EHMPATH_BEAVER_GITHUB_TOKEN` from repo secrets, and ci proves the
  gh.issues suites on the pr. evidence the ci path is live: test run `37580117033` (main, v0.23.1)
  ran `skill.radio.task.push.via-gh-issues` against real github — `Tests: 31 passed, 31 total`.
  this branch changes no prod file on that send path (`git diff origin/main --stat` over
  `src/access/daos/daoRadioTask`, `src/domain.operations/radio/auth`, `src/domain.operations/radio/task`
  shows only two added compose test files).
