# self-review: has-acceptance-test-citations (r3)

## question

cite the acceptance test for each playtest step. zero unproven steps.

## review

### happy path citations

| playtest step | test file | test case |
|---------------|-----------|-----------|
| 1. inline wish | `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts` | `given('[case1] --wish with inline content')` |
| 2. stdin piped | `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts` | `given('[case2] --wish @stdin with piped content')` |
| 3. combined --open | `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts` | `given('[case6] --wish combined with --open')` |
| 4. idempotent | `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts` | `given('[case5] --wish idempotent with same content')` |

each happy path maps to a specific acceptance test case with:
- exit code assertions
- file content assertions
- stdout/stderr snapshot coverage

### edgey path citations

| playtest step | test file | test case |
|---------------|-----------|-----------|
| 1. empty inline | `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts` | `given('[case3b] --wish with empty inline content')` |
| 2. whitespace stdin | `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts` | `given('[case3] --wish @stdin with empty stdin')` |
| 3. conflict | `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts` | `given('[case4] --wish on pre-populated wish file')` |
| 4. protected branch | `blackbox/init.behavior.at-branch.acceptance.test.ts` | `given('[case3] on main branch')` |

each edgey path maps to a specific acceptance test case with:
- non-zero exit code assertions
- error message content assertions
- stdout/stderr snapshot coverage

### gaps found?

**none.** all 8 playtest steps (4 happy, 4 edgey) have direct acceptance test citations:
- 7 in `skill.init.behavior.wish.acceptance.test.ts`
- 1 in `init.behavior.at-branch.acceptance.test.ts`

## verdict

every playtest step traces to an acceptance test. zero unproven steps.
