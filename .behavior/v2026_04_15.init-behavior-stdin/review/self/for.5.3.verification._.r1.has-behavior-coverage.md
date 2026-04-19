# self-review: has-behavior-coverage

## question

does the verification checklist show every behavior from wish/vision has a test?

## review

### behaviors from 0.wish.md

| behavior | test coverage | test file |
|----------|---------------|-----------|
| `--wish @stdin\|words` | yes | skill.init.behavior.wish.acceptance.test.ts |

### behaviors from 1.vision.yield.md

| behavior | test coverage | test file |
|----------|---------------|-----------|
| `--wish "inline words"` | yes, case1 | skill.init.behavior.wish.acceptance.test.ts |
| `--wish @stdin` (piped) | yes, case2 | skill.init.behavior.wish.acceptance.test.ts |
| `--wish @stdin` (heredoc) | yes, via stdin test | skill.init.behavior.wish.acceptance.test.ts |
| `--wish ""` (empty) error | yes, case3 | skill.init.behavior.wish.acceptance.test.ts |
| `--wish` on pre-populated file | yes, case4 | skill.init.behavior.wish.acceptance.test.ts |
| `--wish` idempotent | yes, case5 | skill.init.behavior.wish.acceptance.test.ts |
| `--wish` + `--open` combined | yes, case6 | skill.init.behavior.wish.acceptance.test.ts |

### pit-of-success edgecases from vision

| edgecase | test coverage | test file |
|----------|---------------|-----------|
| `--wish ""` (empty) | yes, case3 checks exit 2 | skill.init.behavior.wish.acceptance.test.ts |
| `--wish` (no arg) | covered by shell arg parser | init.behavior.sh |
| `--wish "..."` + `--open nvim` | yes, case6 with cat | skill.init.behavior.wish.acceptance.test.ts |

## verdict

all behaviors from wish and vision are covered by acceptance tests with snapshots.

- 26 tests in skill.init.behavior.wish.acceptance.test.ts
- all pass (verified via `rhx git.repo.test --what acceptance --scope init.behavior.wish`)
- snapshots exist for all cases

no gaps found.
