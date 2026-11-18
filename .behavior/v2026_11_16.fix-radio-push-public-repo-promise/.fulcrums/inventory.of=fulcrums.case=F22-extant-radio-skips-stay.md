# F22: the two extant radio skips stay skipped in this pr

## .the fork

5.3 demands zero skips. two radio suites carry `describe.skip` since 2026-02-20 (`0538fad`):
`daoRadioTaskViaGhIssues.integration` and `skill.radio.task.pull.via-gh-issues.acceptance`. each reads
`BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN`, which no keyrack holds.

- **A, taken:** leave both skipped. the cure is recorded in the extant dream
  `.dream/v2026_10_22.fix-unskip-external-contract-suites-on-main.md`, symlinked at this route's `dreams/`,
  with the cheaper cure this route found: point both at the keyrack robot token, then unskip
- **B:** point both at `EHMPATH_BEAVER_GITHUB_TOKEN` and unskip them in this pr

## .why A, at the time

B fails SAFE. this host lacks the robot token, so neither suite can run here before the push. after
nine months skipped, their asserts may have drifted, and ci is where they would first run, red, on a
p0 pr whose own code they do not test. neither file is in this route's scope: the pull suite's only
change here is `--promise` on its text pushes, so it stays green the day it unskips.

## .rework: dirty

an unskip that goes red in ci must be debugged against real github under a token this host lacks, so
the work cannot be done here.

## .confidence: 75%, and why it is low

the 5.3 stone says plainly "skips are gaps; gaps get fixed". a reader may rule that a skip in a suite
this pr touched (the pull suite) is in scope, whatever its age.

## .where

`blackbox/role=dispatcher/skill.radio.task.pull.via-gh-issues.acceptance.test.ts` L133;
`src/access/daos/daoRadioTask/daoRadioTaskViaGhIssues.integration.test.ts` L46; found at 5.3.

## .verdict

open.
