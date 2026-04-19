# self-review: role-standards-adherance (r7)

## question

does the code adhere to mechanic role standards?

## review

### briefs directories checked

| directory | category | relevant? |
|-----------|----------|-----------|
| practices/code.prod/evolvable.procedures/ | procedure patterns | yes |
| practices/code.prod/evolvable.domain.operations/ | operation patterns | yes |
| practices/code.prod/pitofsuccess.errors/ | error patterns | yes |
| practices/code.prod/readable.narrative/ | narrative flow | yes |
| practices/code.test/ | test patterns | yes |

### standards check

| standard | requirement | code | verdict |
|----------|-------------|------|---------|
| rule.require.input-context-pattern | (input, context?) | getWishContent uses (input) | ok |
| rule.require.arrow-only | no function keyword | all use const = () => | ok |
| rule.forbid.else-branches | no else | no else branches | ok |
| rule.require.failfast | early exit on error | process.exit(2) on constraint | ok |
| rule.require.exit-code-semantics | exit 2 for constraint | findsertWishFromInput uses exit(2) | ok |
| rule.require.what-why-headers | jsdoc .what .why | getWishContent.ts lines 3-5 | ok |
| rule.require.given-when-then | bdd test style | acceptance tests use given/when/then | ok |

### why this holds

1. **procedure patterns**: operations use (input) pattern, context not needed for pure operations.

2. **error patterns**: constraint errors (empty wish, modified file) exit with code 2 per exit-code-semantics.

3. **narrative flow**: no else branches, early returns for error cases.

4. **test patterns**: acceptance tests use given/when/then from test-fns, useThen for shared results.

5. **domain separation**: operations extracted to domain.operations/, not collocated in contract/.

## conclusion

code adheres to mechanic standards. no violations detected.

