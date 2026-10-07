# F12 · leave the nine inherited `describe.skip` suites in place

## the fork

5.3 says remove every skip. nine suites carry `describe.skip` on `origin/main`, none touched by this
diff: three integration, six acceptance (`rhx grepsafe --pattern 'describe\.skip'`).

| suite | the skip's own stated reason |
|---|---|
| integration `imaginePlan.brain.case1.integration.test.ts` | `deprecated: anthropic api key disabled, pending xai brain integration` |
| integration `decompose.behavior.brain.case1.integration.test.ts` | same |
| integration `daoRadioTaskViaGhIssues.integration.test.ts` | `unskip once keyrack provides BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN` |
| acceptance `skill.review.behavior{,.caseValidBehavior,.caseWellFormed,.caseViolations}.acceptance.test.ts` (4) | `deprecated: anthropic api key disabled, queued for xai brain integration` |
| acceptance `skill.review.deliverable.acceptance.test.ts` | same |
| acceptance `skill.radio.task.pull.via-gh-issues.acceptance.test.ts` | `unskip once keyrack provides BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN` |

| option | cost |
|---|---|
| A · unskip all nine now | the seven brain suites reverse a declared owner decision (deprecated, queued for an xai port) and shell to whatever bare `claude` is on PATH; the two gh-issues suites fail at once on an absent token |
| B · leave them, surface them (taken) | 19 skipped tests remain in the full integration run, 33 in the full acceptance run |

## taken, and why at the time

B. each skip names its own lift condition, and neither condition is met nor mine to meet: an xai
brain port of the decomposer and reviewer skills is a feature, and the demo-repo token is a keyrack
grant only a human can make. none of the nine is in this wish's scope. the token ask rides the 5.3
handoff.

## rework

clean: delete the `.skip` once its condition holds.

## confidence, and why it is not higher (80%)

- 5.3 reads "remove the skip and make it pass NOW" with no carve-out
- `ANTHROPIC_API_KEY` works today (F10's test uses it), so the decomposer skip's premise may be stale;
  the wisher may prefer an unskip on claude over the planned xai port

## where

- `src/domain.operations/behavior/decompose/imaginePlan.brain.case1.integration.test.ts:41`
- `src/domain.roles/decomposer/skills/decompose.behavior.brain.case1.integration.test.ts:12`
- `src/access/daos/daoRadioTask/daoRadioTaskViaGhIssues.integration.test.ts:47`
- `blackbox/role=behaver/skill.review.behavior{,.caseValidBehavior,.caseWellFormed,.caseViolations}.acceptance.test.ts:14`
- `blackbox/role=behaver/skill.review.deliverable.acceptance.test.ts:57`
- `blackbox/role=dispatcher/skill.radio.task.pull.via-gh-issues.acceptance.test.ts:132`

## verdict

awaits the wisher.
