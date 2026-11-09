# F16 — withdraw `git.restore.deleted.sh` and `git.repo.test.brain.sh` from this branch

## .the fork

two `repo=.this` skills were paved in this branch's sessions, neither part of the wish:

- `git.restore.deleted.sh` — restores tracked files deleted from disk. the 5.1 peer round
  raised one defect three ways (`mech-failhides`, `arch-hazards-maintenance`,
  `arch-hazards-behavior` blockers): a failed `git ls-files` inside `< <(...)` read as "none
  deleted", exit 0. a typo `--path` read the same way. repaired before withdrawal
- `git.repo.test.brain.sh` — runs the `BRAIN_LIVE` tier. `arch-hazards-behavior` nitpick:
  a cwd-bound binary path, and `--scope=x` refused. repaired before withdrawal

both carry no test (`behavior-intent-coverage`, `ergo-friction-hazards` nitpicks), and the
second lane named the inconsistency: F8 withdrew `declapract.apply.sh` for this exact cause.

options: **give `repo=.this` skills a test home here**, or **withdraw both, as F8 did**.

## .taken, and why at the time

withdraw both. jest excludes `.agent/**` by design (`jest.integration.config.ts`: rhachet's
cache holds trashed suites there), so a clamp for a `repo=.this` skill needs a new test home — the
same structural call outside the wish that F8 declined. to keep these two while F8's peer left
would be the inconsistency the lane named. the repaired copies sit in rmsafe's trash; the dream
that holds `declapract.apply` now carries all three.

## .rework: clean

restore each from rmsafe's trash
(`.agent/.cache/repo=ehmpathy/role=mechanic/skill=rmsafe/trash/.agent/repo=.this/role=any/skills/<name>.sh`)
and land them with the test home in their own pr. no shipped file calls either skill: the one hint
that named `git.repo.test.brain` now names the tier's own run line.

## .confidence: 75%, and why it is low

the live-brain tier loses its one paved entry until the test home lands; an env-prefixed jest call
is not paved for a clone. the wisher may prefer a test home now over a re-pave later.

## .where

`.agent/repo=.this/role=any/skills/{git.restore.deleted,git.repo.test.brain}.sh` (removed),
`src/domain.operations/behavior/init/initBehaviorDir.rootPurposeMotive.brain.integration.test.ts`
(hint), `.dream/2026_11_08.pave-declapract-apply.dream.md` (extended).

## .verdict

(unruled)
