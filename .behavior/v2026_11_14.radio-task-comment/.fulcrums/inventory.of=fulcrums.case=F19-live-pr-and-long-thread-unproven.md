# F19 — the live suite comments on an issue only, never a pr or a long thread

raised by the mech-external-contracts peer, 5.3 round 1, nitpick.1.

## .the fork

- **A** keep the live suite on one demo issue; prove the pr and the long thread at the stub layer and
  from gh's source (R1)
- **B** add a live comment on a pr and on a thread past one page, in the demo repo

## .taken — A, and why

- the pr path calls the same two gh commands as the issue path: `gh issue view <n>` and
  `gh issue comment <n>`. gh resolves a pr number through both, so a live issue call exercises the
  same endpoint, the same flags, and the same json shape the dao parses
- a live pr needs a pr fixture in `ehmpathy/rhachet-roles-bhuild-demo`: a branch, a commit, an open pr
  kept alive across runs. the robot token on this host is absent, so the fixture cannot be made or
  proven here
- a live long thread needs 30+ comments on one issue, each a write to a shared demo repo per run
- the paged read is settled from gh's source (R1: `gh issue view --comments` pages through every
  comment); the stub suite proves the drain on `#652`, a pr url

## .rework — clean

one new `given` in the live suite, once a pr fixture exists in the demo repo. no contract change.

## .confidence — 80%

why not higher: gh's pr resolution in `issue view` is read from its docs and source, not a live call.

## .where

`blackbox/role=dispatcher/skill.radio.task.comment.via-gh-issues.acceptance.test.ts`

## .verdict

open
