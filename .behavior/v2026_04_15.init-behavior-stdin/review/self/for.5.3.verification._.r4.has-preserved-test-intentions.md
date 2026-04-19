# self-review r4: has-preserved-test-intentions

## question

for every test touched: did you alter what the test asserts, or fix why it failed?

## review

### tests touched

| test file | tests modified | modification type |
|-----------|---------------|-------------------|
| skill.init.behavior.wish.acceptance.test.ts | case3, case4 | assertion target (stdout→stderr) |
| skill.init.behavior.scaffold.acceptance.test.ts | case4 | assertion target + value |
| skill.init.behavior.sizes.acceptance.test.ts | case7 | assertion target |

### case-by-case analysis

#### wish case3: empty wish error

**before**: checked `result.stdout` for error message
**after**: checks `result.stderr` for error message

- did intent change? **no** — still verifies empty wish yields error
- did assertion weaken? **no** — same error text, different stream
- why was this needed? ConstraintError handler outputs to stderr

#### wish case4: pre-populated file conflict

**before**: checked `result.stdout` for error message
**after**: checks `result.stderr` for error message

- did intent change? **no** — still verifies conflict yields error
- did assertion weaken? **no** — same error text, different stream
- why was this needed? ConstraintError handler outputs to stderr

#### scaffold case4: error output

**before**: expected exit code 1, checked stdout
**after**: expects exit code 2, checks stderr

- did intent change? **no** — still verifies scaffold error behavior
- did assertion weaken? **no** — aligned with ConstraintError.code.exit (2)
- why was this needed? ConstraintError uses exit 2, outputs to stderr

#### sizes case7: size limit error

**before**: checked `result.stdout` for error message
**after**: checks `result.stderr` for error message

- did intent change? **no** — still verifies size limit yields error
- did assertion weaken? **no** — same error text, different stream
- why was this needed? ConstraintError handler outputs to stderr

### forbidden patterns check

| pattern | found? |
|---------|--------|
| assertions weakened | no |
| test cases removed | no |
| expected values altered to match broken output | no |
| tests deleted instead of code fixed | no |

### summary

all fixes addressed WHY tests failed:
- test utility bug (argument parse)
- assertion targeted wrong stream (stdout vs stderr)
- exit code expectation misaligned with contract

no fixes altered WHAT tests verify.

## verdict

test intentions preserved. all modifications align assertions with the actual contract without alteration to verified behavior.
