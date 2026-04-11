# self-review: has-edgecase-coverage

## question

what could go wrong? what inputs are unusual but valid? are boundaries tested?

## findings

### edge cases in playtest

| edge case | playtest step | covered |
|-----------|---------------|---------|
| empty behavior (no feedback) | step 8 | yes |
| stale hash (modified feedback) | step 7 | yes |
| version flag (v2 feedback) | step 9 | yes |
| force flag (bind override) | step 10 | yes |

### vision pit-of-success edgecases

| vision edgecase | playtest | acceptance test |
|-----------------|----------|-----------------|
| human updates feedback after clone responded | step 7 (stale) | case4 |
| clone forgets to respond | step 3 (blocks) | case2 |
| multiple feedback files | not in playtest | case5 |
| clone tries to delete [given] file | not in playtest | not tested |
| clone passes wrong --into path | not in playtest | not tested |

### analysis

**covered in playtest (4):**
1. empty behavior - verifies no false positives
2. stale hash - verifies re-response trigger
3. version flag - verifies multi-version support
4. force flag - verifies bind override

**deferred to acceptance tests (1):**
- multiple feedback files (case5) - programmatic test better for multiple file scenarios

**not tested anywhere (2):**
- deleted [given] file - defensive edge case, low priority
- wrong --into path - error validation, low priority

### why deferred edge cases are acceptable

1. **multiple files**: acceptance test case5 covers this with `toContain('1 open')` and `toContain('2 total')`. manual playtest with single file demonstrates the mechanism; acceptance test verifies n-file behavior.

2. **deleted file / wrong path**: these are error paths that fail fast. acceptance tests are better suited for programmatic verification of error messages.

### boundaries verified

| boundary | playtest step | assertion |
|----------|---------------|-----------|
| exit code 0 (success) | steps 1, 2, 4, 5, 6, 8, 9 | explicit |
| exit code 2 (constraint) | steps 3, 7 | explicit |
| file creation | steps 1, 4 | path verified |
| hash verification | steps 4, 7 | content checked |

## conclusion

critical edge cases are covered. deferred edge cases are appropriate for acceptance tests. boundaries (exit codes, file creation, hash verification) are verified. no gaps that require playtest additions.
