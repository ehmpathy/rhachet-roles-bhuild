# F11 — the ten prior skips stay skipped in this pr

## the fork

5.3's buttonup mandate says remove every skip and make it pass. the scan finds ten:

| file | why it is skipped (its own comment) |
|---|---|
| `src/access/daos/daoRadioTask/daoRadioTaskViaGhIssues.integration.test.ts` | needs `BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN` from keyrack |
| `blackbox/role=dispatcher/skill.radio.task.pull.via-gh-issues.acceptance.test.ts` | same key |
| `blackbox/role=behaver/skill.review.deliverable.acceptance.test.ts` | shells the real `claude` binary, which ci does not install |
| `blackbox/role=behaver/skill.review.behavior*.acceptance.test.ts` (4) | the same review path |
| `src/domain.operations/behavior/decompose/imaginePlan.brain.case1.integration.test.ts` | a live brain call |
| `src/domain.roles/decomposer/skills/decompose.behavior.brain.case1.integration.test.ts` | a live brain call |
| `src/domain.operations/behavior/init/initBehaviorDir.brain.claude.integration.test.ts` | `given.runIf(RUN_BRAIN_TEST)`, a live `claude` call |

- (a) unskip them here
- (b) leave them, named, and cite the radio paths' coverage that does run

## taken: (b)

- none of the ten files is touched by this branch (`git diff origin/main --stat` on their paths is
  empty), so none hides a behavior this pr adds
- each needs a grant this driver cannot make: `BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN` is not in the
  ehmpath keyrack on this host (`rhx keyrack status --owner ehmpath`: no match), and the `claude`
  binary in ci is a provision decision — `rule.always.raise-a-blocker-a-taken-cannot-close`: not
  *permitted*, so not a fix-forward
- the two radio skips cover gh.issues pull and the raw gh dao; the radio paths this pr changes are
  covered by suites that do run: the stub-gh recorder journey (101+ passed), the case9 drain suite,
  the gh shell-dao suite (`daoRadioTaskViaGhIssues.shell.integration.test.ts`), and the live
  gh.issues push suite on ci (F7)

## rework: clean

an unskip is a one-line change per file once the key or the binary exists.

## confidence: 85%, and why it is not higher

the 5.3 stone reads "fix it anyway" for prior failures; a council may want these dispatched as
seeds rather than left as comments.

## verdict

open — for the fulcrum council.
