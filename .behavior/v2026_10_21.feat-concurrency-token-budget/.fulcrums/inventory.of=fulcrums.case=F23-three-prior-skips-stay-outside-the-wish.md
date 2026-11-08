# F23 · nine skips that predate this branch stay, each with its cause on record

## .the fork

5.3 forbids every skip, prior ones too. the full runs find nine `describe.skip`, none in a file
this branch touched:

| suite | grain | cause on record |
|---|---|---|
| `src/domain.operations/behavior/decompose/imaginePlan.brain.case1.integration.test.ts` | integration | the `invokeBrainRepl` seam |
| `src/domain.roles/decomposer/skills/decompose.behavior.brain.case1.integration.test.ts` | integration | the `invokeBrainRepl` seam |
| `src/access/daos/daoRadioTask/daoRadioTaskViaGhIssues.integration.test.ts` | integration | `BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN` absent |
| `blackbox/role=behaver/skill.review.behavior.acceptance.test.ts` | acceptance | shells the real `claude`, which ci does not install |
| `blackbox/role=behaver/skill.review.behavior.caseValidBehavior.acceptance.test.ts` | acceptance | same |
| `blackbox/role=behaver/skill.review.behavior.caseWellFormed.acceptance.test.ts` | acceptance | same |
| `blackbox/role=behaver/skill.review.behavior.caseViolations.acceptance.test.ts` | acceptance | same |
| `blackbox/role=behaver/skill.review.deliverable.acceptance.test.ts` | acceptance | same |
| `blackbox/role=dispatcher/skill.radio.task.pull.via-gh-issues.acceptance.test.ts` | acceptance | `BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN` absent |

and one tier gate, not a skip: `initBehaviorDir.brain.claude.integration.test.ts` runs its live
case only under `given.runIf(RUN_BRAIN_TEST)`, `BRAIN_LIVE=true`. repo policy keeps a billed
live-brain call off every ci push (`src/.test/utils/RUN_BRAIN_TEST.ts`). this branch edited that
file: its one-word ask now runs with an empty `CLAUDE_CONFIG_DIR`, so it no longer loads the
actor's boot briefs. the edit is unproven by a live run here, because the env prefix it needs is
not paved. the proof is `BRAIN_LIVE=true npx jest -c ./jest.integration.config.ts
src/domain.operations/behavior/init/initBehaviorDir.brain.claude.integration.test.ts`, a run the
council may ask for

- **(a)** lift all nine in this round
- **(b)** leave them, each cause named, and hand the credentials to the foreman
- **(c)** delete the suites

## .taken, and why

(b).
- the brain and `claude` suites need a brain call from inside this hook-laden repo. measured
  2026-09-28: `invokeBrainRepl` shells `claude --print` here, a 432s run that still fails. the cure
  is a redesign of that seam (a clean cwd, hooks off, or an SDK brain), already caught as
  `.dream/v2026_09_28.fix-invokebrainrepl-shells-claude-inside-a-hook-laden-repo.md`. a lift
  without it is a deterministic red in ci, where `claude` is not even installed
- the two gh.issues suites need `BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN`. `rhx keyrack status
  --owner ehmpath` holds no such key (2026-11-07). only the foreman can fill it:
  `5.3.verification.handoff.v1.to_foreman.md`

(c) deletes coverage that a fill or a seam fix would restore.

## .rework

clean: none of the nine touches the capacity or token verbs.

## .confidence, and why it is low

60%. the stone's letter forbids every skip and names no scope bound; this call reads the wish's
scope as the bound.

## .verdict

open — the council's.
