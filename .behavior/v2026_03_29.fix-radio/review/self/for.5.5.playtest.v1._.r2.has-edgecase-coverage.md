# self-review: has-edgecase-coverage (r2)

i promise that it has-edgecase-coverage.

verification of edge case coverage in the playtest.

---

## what could go wrong?

| failure mode | playtest coverage | notes |
|--------------|-------------------|-------|
| keyrack not unlocked | ✓ edge 1 | tests error experience |
| keyrack key absent | not explicit | but similar error path as "not unlocked" |
| invalid --auth format | not covered | automated tests verify |
| network timeout | not covered | hard to reproduce reliably |
| github api rate limit | not covered | hard to reproduce reliably |
| demo repo inaccessible | prerequisite notes this | "beaver app must be installed" |
| invalid --repo format | not covered | automated tests verify |
| empty --title | not covered | edge 3 tests absent title |
| special chars in --title | not covered | could add, but minor |

**assessment**: the playtest covers the *new keyrack-specific* failure modes. other validation errors are tested by automated tests.

---

## what inputs are unusual but valid?

| unusual input | playtest coverage |
|---------------|-------------------|
| very long --title | not covered |
| unicode in --title | not covered |
| multiline --description | not covered |
| --title with quotes | not covered |
| --description with newlines | not covered |

**assessment**: these are input validation edge cases, not keyrack integration edge cases. automated tests should cover these. the playtest focuses on the new behavior (keyrack auth).

---

## are boundaries tested?

| boundary | playtest coverage |
|----------|-------------------|
| keyrack unlocked vs not unlocked | ✓ edge 1 vs path 1 |
| explicit --auth vs default | ✓ path 2 vs path 1 |
| required field present vs absent | ✓ edge 2 (--repo), edge 3 (--title) |

**assessment**: ✓ key boundaries for keyrack integration are tested

---

## edge cases in playtest

| edge | what it tests | why it matters |
|------|---------------|----------------|
| edge 1 | keyrack not unlocked | primary failure mode for new feature |
| edge 2 | absent --repo flag | validation error experience |
| edge 3 | absent --title flag | validation error experience |

---

## gaps identified

| gap | severity | rationale |
|-----|----------|-----------|
| keyrack key absent (vs not unlocked) | low | error path similar to "not unlocked" |
| special chars in --title | low | not keyrack-specific |
| multiline --description | low | not keyrack-specific |
| network/api errors | low | hard to reproduce, not keyrack-specific |

---

## conclusion

**edge case coverage is adequate for the keyrack integration.**

**covered**:
1. keyrack not unlocked → edge 1
2. required field absent → edge 2, edge 3
3. explicit vs default auth → path 1 vs path 2

**not covered (acceptable)**:
1. input validation edge cases — automated tests scope
2. network/api failures — hard to reproduce, not keyrack-specific
3. keyrack key absent vs not unlocked — similar error path

**why it holds**:
1. the playtest focuses on the *new behavior* (keyrack integration)
2. edge 1 tests the primary failure mode (keyrack not available)
3. automated tests provide deeper edge case coverage
4. the playtest is for *byhand verification*, not exhaustive test

