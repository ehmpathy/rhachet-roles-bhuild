# self-review: role-standards-coverage (r8)

## question

are all relevant mechanic standards applied to this code?

## review

### briefs directories checked

| directory | category | relevant? |
|-----------|----------|-----------|
| practices/code.prod/evolvable.procedures/ | procedure patterns | yes |
| practices/code.prod/evolvable.domain.operations/ | operation patterns | yes |
| practices/code.prod/pitofsuccess.errors/ | error patterns | yes |
| practices/code.prod/readable.narrative/ | narrative flow | yes |
| practices/code.test/ | test patterns | yes |

### standards coverage

| standard | should apply? | present? | verdict |
|----------|---------------|----------|---------|
| rule.require.what-why-headers | yes - new operations | yes - both files have .what .why | covered |
| rule.require.input-context-pattern | yes - new operations | yes - (input) pattern | covered |
| rule.require.arrow-only | yes - all functions | yes - no function keyword | covered |
| rule.require.failfast | yes - error paths | yes - early process.exit | covered |
| rule.require.exit-code-semantics | yes - constraint errors | yes - exit(2) | covered |
| rule.require.given-when-then | yes - tests | yes - 6 test cases | covered |
| rule.require.useThen-for-shared-results | yes - acceptance tests | yes - useThen in tests | covered |
| rule.forbid.mocks | yes - no mock in tests | yes - no mocks | covered |
| rule.require.snapshots | yes - acceptance tests | yes - toMatchSnapshot | covered |

### why this holds

1. **headers present**: getWishContent.ts and findsertWishFromInput.ts both have .what and .why jsdoc.

2. **test coverage complete**: 6 acceptance test cases cover all user journeys + unit tests for operations.

3. **error patterns present**: constraint errors exit with code 2, messages include actionable hints.

4. **no mocks**: tests use real behavior, not mocked dependencies.

5. **snapshots present**: acceptance tests capture stdout for regression detection.

## conclusion

all relevant standards covered. no gaps detected.

