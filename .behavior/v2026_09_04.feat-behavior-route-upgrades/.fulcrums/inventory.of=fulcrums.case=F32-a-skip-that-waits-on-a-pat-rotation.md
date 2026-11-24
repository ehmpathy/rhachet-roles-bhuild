# F32 — nine suites skipped on main, held on a PAT rotation, `claude` in ci, and a brain seam

- rework: **clean** — delete one `.skip` per suite once its wall falls
- status: open — best-guessed, drive on
- confidence: **80%**
- raised: 2026-10-21, `5.3.verification`

## .the fork, stated fairly

the 5.3 stone says a found skip is removed and made to pass. a scan of `src/` and `blackbox/` for
`describe|it|test|given|when|then .skip|.only`, `.skipIf`, `.runIf` finds nine `describe.skip`s. all
nine are on main, and `git diff origin/main` over each is empty — this route touched none.

| suite | the wall, as its own note states it |
|---|---|
| `daoRadioTaskViaGhIssues.integration` | the demo-repo PAT `BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN` is a classic `ghp_*`, which the keyrack firewall rejects by design (`.agent/keyrack.yml`) |
| `skill.radio.task.pull.via-gh-issues.acceptance` | the same PAT |
| `skill.review.behavior.acceptance` and its three `case*` parts | ci does not install the `claude` binary |
| `skill.review.deliverable.acceptance` | ci does not install the `claude` binary |
| `imaginePlan.brain.case1.integration` | `invokeBrainRepl` shells `claude` with the repo root as cwd, so the child boots every hook here and exits non-zero |
| `decompose.behavior.brain.case1.integration` | the same seam |

| option | for it | against it |
|---|---|---|
| leave the skips, flagged | extant on main, untouched here; each unskip needs a rotation, a ci install, or an infra redesign this route never opened | nine suites stay unrun |
| unskip now | the stone's letter | each fails on its wall — an absent key, an absent binary, or a deterministic 7-minute brain failure — so the unskip ships a red suite, not a proof |

## .taken, and why

leave them, flagged in the 5.3 yield and the pr. the dao's 401 path (`github auth failure nudge`) is
not skipped and passes, so its failure contract stays covered. the brain seam already has a dream:
`.dream/v2026_09_28.fix-invokebrainrepl-shells-claude-inside-a-hook-laden-repo.md`.

## .rework, and why it is clean

rotate the PAT to a github-app token and add it to `env.test` in `.agent/keyrack.yml` → delete two
`.skip`s. provision `claude` in ci → delete five. isolate the `invokeBrainRepl` child → delete two.
one line of test code per suite.

## .confidence, and why it is not higher

`philosophy.verification-strictness` names a skip a lie; the council may rule this pr should not
pass with a known skip, even one it did not add.

## .where

`$route/5.3.verification.yield.md` `## blockers`
