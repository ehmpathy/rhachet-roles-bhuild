# self-review: has-edgecase-coverage (r3)

## question

what could go wrong? what inputs are unusual but valid? are boundaries tested?

## findings

### issue found and fixed

**gap: multiple feedback files not verified in playtest**

after step 7 modifies v1 [given] (stale), and step 9 creates v2, the state is:
- v1 [given] modified in step 7 (stale)
- v1 [taken] with old hash (needs re-response)
- v2 [given] created in step 9 (new, unresponded)

before the fix, we never verified that hook.onStop blocks with multiple issues!

the vision explicitly lists this edge case:
> "multiple feedback files | all must be responded before stop passes"

**fix: add verification to step 9**

step 9 now includes hook.onStop check after v2 creation:
```bash
# verify hook.onStop blocks (v1 is stale + v2 is unresponded)
rhx feedback.take.get --when hook.onStop --behavior "$BEHAVIOR"
# expected: exit 2
```

this verifies both:
1. stale feedback still blocks (v1)
2. new feedback blocks (v2)
3. "all must be responded" behavior

### state trace through playtest

| step | v1 [given] | v1 [taken] | v2 [given] | hook.onStop |
|------|------------|------------|------------|-------------|
| 1 | created | - | - | would block |
| 4 | exists | created | - | passes |
| 6 | exists | exists | - | passes (verified) |
| 7 | modified | stale | - | blocks (verified) |
| 9 | modified | stale | created | blocks (NOW verified) |

### verified edge cases (after fix)

| edge case | playtest step | verified |
|-----------|---------------|----------|
| empty behavior | step 8 | yes |
| stale hash | step 7 | yes |
| version flag | step 9 | yes |
| force flag | step 10 | yes |
| multiple files (mixed status) | step 9 (added check) | yes |

### deeper edge case analysis

**what could go wrong in manual playtest?**
- foreman runs commands out of order → playtest is sequential, each step depends on prior
- foreman uses wrong paths → variables defined in sandbox setup, copy-pasteable
- foreman skips a step → expected outputs specify prior state

**what inputs are unusual but valid?**
| input | covered | notes |
|-------|---------|-------|
| empty behavior | step 8 | no feedback files |
| multiple files | step 9 | stale v1 + new v2 |
| behavior bind conflict | step 10 | --force flag |
| versioned feedback | step 9 | v2 creation |
| special characters in content | not tested | deferred - acceptance covers |
| very long feedback | not tested | deferred - not critical |

**what about re-response to stale feedback?**

after step 7, v1 [taken] is stale. if foreman wants to update response:
1. run feedback.take.set again with new --response
2. new hash computed, [taken] updated
3. hook passes

this is implicitly tested - feedback.take.set is idempotent. the mechanism is:
- step 4: initial response
- step 7: feedback modified (stale)
- step 9: hook blocks (shows stale detection works)

the re-response path isn't explicitly tested in playtest because:
1. stale detection is verified (step 7, 9)
2. response creation is verified (step 4)
3. combining these = re-response would work

### deferred cases

| edge case | why deferred |
|-----------|--------------|
| deleted [given] file | error path, tested in acceptance |
| wrong --into path | error path, acceptance coverage sufficient |
| special characters | content handling, not behavior-critical |
| very long feedback | performance, not behavior-critical |

these are error paths or non-critical variations. acceptance tests are better suited for programmatic verification.

### additional verification: step 9 comment alignment

**found inconsistency**: step 9 action comment said "v2 is unresponded even though v1 is responded"

**fix**: updated comment to "v1 is stale from step 7 + v2 is unresponded" to match the expected output and state trace.

## conclusion

found gap: multiple files edge case absent. fixed by added hook.onStop check to step 9. the state trace shows step 9 verifies both stale v1 and new v2 feedback. also fixed misleading comment in step 9. all critical edge cases now covered.
