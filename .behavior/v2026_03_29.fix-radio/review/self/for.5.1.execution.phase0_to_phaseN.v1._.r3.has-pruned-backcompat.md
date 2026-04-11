# self-review: has-pruned-backcompat (r3)

third reflection after closer examination of test changes.

---

## what changed in the tests?

I read through the test diff carefully:

| old case | new case | what changed |
|----------|----------|--------------|
| case3: GITHUB_TOKEN in env | case3: via-keyrack explicit | old GITHUB_TOKEN fallback tests removed |
| case4: as-human | case5: as-human | renumbered |
| case5: no auth detected | case6: unrecognized auth | error message changed |

---

## what was removed

the old case3 tested:
```typescript
// [t0] GITHUB_TOKEN is set and no --auth → returns token from GITHUB_TOKEN
// [t1] both GITHUB_TOKEN and --auth as-robot:env(VAR) set → as-robot takes precedence
```

this test coverage was for the GITHUB_TOKEN fallback behavior that we explicitly removed. the removal of its tests is correct.

---

## what was added

the new case3 and case4 test the via-keyrack behavior:
- case3: explicit `--auth as-robot:via-keyrack(owner)` with custom owner
- case4: default `via-keyrack(ehmpath)` when no --auth

these tests cover the new behavior prescribed in the blueprint.

---

## backcompat assessment

| concern | is it backcompat? | verdict |
|---------|-------------------|---------|
| GITHUB_TOKEN fallback removed | was backcompat | correctly removed |
| old test cases removed | covered old backcompat | correctly removed |
| new test cases added | cover new behavior | correctly added |
| extant auth modes preserved | core functionality | not backcompat |

---

## conclusion

the test changes mirror the implementation changes exactly:
- old backcompat (GITHUB_TOKEN fallback) removed from both code and tests
- new behavior (keyrack default) added to both code and tests
- no orphaned backcompat lurks in the codebase

the review is complete. no unasked-for backcompat detected.
