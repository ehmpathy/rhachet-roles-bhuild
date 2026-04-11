# self-review: has-behavior-coverage (round 1)

## artifact references

- 0.wish.md
- 1.vision.yield.md
- 5.3.verification.yield.md

## behavior-to-test map

### from wish (line by line)

| wish behavior | test file | covered? |
|--------------|-----------|----------|
| `rhx feedback.give` (renamed from give.feedback) | skill.give.feedback.acceptance.test.ts | yes |
| `rhx feedback.take.get` (list feedback status) | skill.feedback.take.acceptance.test.ts | yes |
| `rhx feedback.take.get --when hook.onStop` (exit 2 if unresponded) | skill.feedback.take.acceptance.test.ts (case3, case4) | yes |
| `rhx feedback.take.set --from ... --into ...` | skill.feedback.take.acceptance.test.ts (case2) | yes |
| hash validation for stale detection | skill.feedback.take.acceptance.test.ts (case4) | yes |
| feedback path in `$behavior/feedback/` | skill.feedback.take.acceptance.test.ts (case1) | yes |
| backwards compat for give.feedback | skill.give.feedback.acceptance.test.ts | yes |

### from vision (usecases table)

| usecase | test? |
|---------|-------|
| human: `rhx feedback.give --against execution` | yes (acceptance) |
| clone: `rhx feedback.take.get` | yes (case1) |
| clone: `rhx feedback.take.get --when hook.onStop` | yes (case3, case4) |
| clone: `rhx feedback.take.set --from ... --into ...` | yes (case2) |

### from vision (pit-of-success edgecases)

| edgecase | test? |
|----------|-------|
| human updates feedback after clone responded → hash mismatch | yes (case4 "stale hash") |
| clone forgets to respond → stop hook blocks | yes (case3 "unresponded exits 2") |
| multiple feedback files → all must respond | yes (case3 tests multiple) |
| clone passes wrong `--into` path → fail fast | yes (feedbackTakeSet.integration.test case4) |
| clone runs set before response file exists → fail fast | yes (feedbackTakeSet.integration.test case3) |

## verification

- [x] every behavior in 0.wish.md is covered by a test
- [x] every usecase in 1.vision.yield.md is covered
- [x] every pit-of-success edgecase is tested
- [x] can point to specific test file for each behavior

## verdict

all behaviors have test coverage. no gaps found.

