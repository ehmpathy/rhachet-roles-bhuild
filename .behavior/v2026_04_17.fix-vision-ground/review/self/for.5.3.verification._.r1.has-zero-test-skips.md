# self-review: has-zero-test-skips

## what was reviewed

scanned test files for `.skip()` and `.only()` patterns.

## findings

### new skips introduced by this PR

none. this PR adds template text only — no test file changes.

### prior skips found

three integration tests have `.skip()`:
1. `decompose.behavior.brain.case1.integration.test.ts` — requires LLM brain API
2. `imaginePlan.brain.case1.integration.test.ts` — requires LLM brain API
3. `daoRadioTaskViaGhIssues.integration.test.ts` — requires GitHub issues API

### why these skips remain

these are integration tests that require external credentials not available in CI:
- brain API tests need LLM credentials
- gh issues tests need GitHub token with repo access

these skips predate this PR. to remove them would require credentials I do not possess — a foreman-only blocker outside this PR's scope.

### silent credential bypasses

none found. no `if (!credentials) return` patterns detected.

### prior failures carried forward

none. all runnable tests pass (29/29 unit tests).

## conclusion

no new skips introduced. prior skips are credential-gated integration tests outside this PR's scope. zero issues for this PR.
