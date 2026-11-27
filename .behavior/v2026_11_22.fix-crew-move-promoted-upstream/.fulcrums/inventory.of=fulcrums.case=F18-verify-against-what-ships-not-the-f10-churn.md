# F18 — verify against what ships, not the F10 churn

## .the fork

five red cells in 5.3 trace to worktree churn this route does not ship (F10):
`.husky/*`, `package.json` + `pnpm-lock.yaml` (rhachet 1.51.0 → 1.54.1), and the
repo `.claude` settings. two ways to answer them:

- A. absorb the churn: rewrite the tests to fit the upgrade
- B. prove each cell green against HEAD's copy of the churned file, and hand each
  merge hazard to the human

## .taken — B

the churn is not this route's, and F10 already keeps it out of the commit. CI
installs HEAD's lock and runs HEAD's hooks, so B grades what ships.

| red cell | churn that drives it | proof against what ships |
|---|---|---|
| ecowork.commit case46 [t1] | `pre-commit` wires `check.timestamps.lock.sh` and the hook drops `.eco/*` | swap both to HEAD, run, restore: 32/32 pass |
| cliOfRepoSettingsHooks case1 | the settings now route every hook through `hooks.dispatch.manifest` | HEAD's settings hold 2 bhuild cli hook calls (read, no write) |
| radio.task.recorder t2.1, case2 | rhachet 1.54.1 `roles init` writes the manifest, not `settings.hooks.Stop` | CI on HEAD's lock (1.51.0); cannot downgrade here, the session hooks run from it |
| behaver role.init case1, case2 | same as above | same as above |

## .merge hazards owed to the human

whoever merges the F10 upgrade breaks:
1. the prioritizer store commit path — the upgraded hook forbids the `.eco/*` exemption
2. the cli hook check and both `roles init` acceptance suites — hooks move into the manifest

## .rework — clean

B changes no code. a reversal (A) is a test edit in another route.

## .confidence — 85%

the swap proof covers case46 directly. the recorder and role.init cells rest on the
mechanism plus CI, not a local run.

## .where

`.husky/`, `package.json`, `blackbox/role=dispatcher/skill.radio.task.recorder.acceptance.test.ts`,
`blackbox/role=behaver/role.init.acceptance.test.ts`, `src/contract/cli/cliOfRepoSettingsHooks.integration.test.ts`
