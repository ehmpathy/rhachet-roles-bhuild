# self-review: has-edgecase-coverage (r3)

i promise that it has-edgecase-coverage.

deeper reflection on edge cases the foreman might encounter.

---

## the foreman's perspective

when the foreman runs this playtest, what could go wrong that we haven't covered?

---

## scenario 1: keyrack states

keyrack has multiple failure states. the playtest only covers "not unlocked".

| keyrack state | error type | playtest? |
|---------------|------------|-----------|
| unlocked + key granted | success | ✓ path 1 |
| not unlocked | error: locked | ✓ edge 1 |
| unlocked + key absent | error: key not found | NOT covered |
| unlocked + key blocked | error: access denied | NOT covered |

**should we add edge cases for key absent or blocked?**

these are different error messages that keyrack produces. the playtest says:
> **expected behavior**: error message contains "keyrack"

this is general enough to cover any keyrack error. the fix hint will differ based on the specific error, but the playtest criteria (error contains "keyrack") will still pass.

**verdict**: edge 1 is sufficient — it tests the error path, and the criteria is general.

---

## scenario 2: explicit --auth failures

the playtest has path 2 with explicit `--auth as-robot:env(...)`. what if:
- the env var is not set?
- the env var contains invalid token?

| explicit --auth scenario | playtest? |
|--------------------------|-----------|
| valid token | ✓ path 2 |
| env var not set | NOT covered |
| env var contains garbage | NOT covered |

**should we add these?**

no — these are not keyrack-specific. they test the env var auth mode which already existed before this behavior. the automated tests cover these cases.

**verdict**: not needed — not keyrack-specific

---

## scenario 3: api failures

what if the github api is down or rate limited?

| api scenario | playtest? |
|--------------|-----------|
| success | ✓ path 1 |
| rate limited | NOT covered |
| network error | NOT covered |
| auth rejected | NOT covered |

**should we add these?**

no — these are not reproducible in a byhand playtest. the foreman cannot reliably trigger rate limits or network failures.

**verdict**: not needed — not reproducible

---

## scenario 4: validation errors

the playtest has edge 2 (no --repo) and edge 3 (no --title).

| validation scenario | playtest? |
|---------------------|-----------|
| no --repo | ✓ edge 2 |
| no --title | ✓ edge 3 |
| no --via | NOT covered |
| invalid --via value | NOT covered |

**should we add --via validation?**

no — --via is required for the command to function at all. the error would be immediate and obvious. the playtest focuses on keyrack integration, not input validation.

**verdict**: not needed — not keyrack-specific

---

## scenario 5: demo repo access

what if the foreman doesn't have access to ehmpathy/rhachet-roles-bhuild-demo?

the prerequisites state:
> **demo repo accessible**: `ehmpathy/rhachet-roles-bhuild-demo` (beaver app must be installed)

if this prerequisite is not met, the playtest will fail at path 1 with a github api error (not a keyrack error). this is expected — the playtest requires functional infrastructure.

**verdict**: prerequisite covers this

---

## what the playtest actually tests

| edge | keyrack-specific? | covered? |
|------|-------------------|----------|
| keyrack not unlocked | ✓ yes | ✓ edge 1 |
| keyrack key absent | ✓ yes | general criteria in edge 1 |
| explicit --auth override | ✓ yes | ✓ path 2 |
| input validation | no | ✓ edge 2-3 |
| api failures | no | not reproducible |

---

## conclusion

**the playtest covers keyrack-specific edge cases adequately.**

**why edge 1 is sufficient for keyrack errors**:
- the criteria is "error message contains keyrack"
- this catches all keyrack failure modes (locked, absent, blocked)
- the specific error message and fix hint varies, but the test criteria holds

**why other edge cases are not needed**:
- explicit --auth failures: not keyrack-specific, covered by automated tests
- api failures: not reproducible in byhand playtest
- input validation: not keyrack-specific, covered by edge 2-3

**the playtest is focused**: it tests the *new keyrack integration*, not all possible failure modes of the radio skill.

