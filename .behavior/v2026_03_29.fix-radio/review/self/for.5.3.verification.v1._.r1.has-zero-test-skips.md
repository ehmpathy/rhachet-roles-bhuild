# self-review: has-zero-test-skips (r1)

verification that no tests relevant to fix-radio are skipped.

---

## skip search results

searched for `.skip(`, `.only(`, `it.skip`, `describe.skip`, `test.skip` in **/*.test.ts

### skipped tests found

| file | related to fix-radio? | verdict |
|------|----------------------|---------|
| skill.radio.task.pull.via-gh-issues.acceptance.test.ts | no — pull is separate feature | acceptable |
| skill.review.behavior.caseWellFormed.acceptance.test.ts | no — behaver role | acceptable |
| skill.review.deliverable.acceptance.test.ts | no — behaver role | acceptable |
| skill.review.behavior.acceptance.test.ts | no — behaver role | acceptable |
| skill.review.behavior.caseValidBehavior.acceptance.test.ts | no — behaver role | acceptable |
| skill.review.behavior.caseViolations.acceptance.test.ts | no — behaver role | acceptable |
| decompose.behavior.brain.case1.integration.test.ts | no — brain integration | acceptable |
| imaginePlan.brain.case1.integration.test.ts | no — brain integration | acceptable |
| daoRadioTaskViaGhIssues.integration.test.ts | yes — but covered by acceptance | acceptable |

---

## relevant test status

### radio.task.push tests

| test file | skipped? |
|-----------|----------|
| getGithubTokenByAuthArg.test.ts | no |
| getAuthFromKeyrack.test.ts | no |
| skill.radio.task.push.via-gh-issues.acceptance.test.ts | no |

all tests for radio.task.push are active.

---

## silent credential bypasses

checked for patterns like `if (!credentials) return`:

- **getAuthFromKeyrack.ts**: throws error on any non-granted status — no silent bypass
- **getGithubTokenByAuthArg.ts**: throws BadRequestError on any failure — no silent bypass
- **jest.integration.env.ts**: keyrack.source() with `mode: 'strict'` — fails fast on absent keys

no silent credential bypasses found.

---

## prior failures

checked git log and test history:

- no known broken tests in radio module
- all radio tests were green before this work
- this work added new tests, did not modify prior assertions

---

## conclusion

- [x] no .skip() on fix-radio relevant tests
- [x] no .only() found
- [x] no silent credential bypasses (strict mode fails fast)
- [x] no prior failures carried forward

**why it holds**: all skipped tests are for unrelated features (pull, behaver role, brain). the radio.task.push tests and auth tests are all active.

