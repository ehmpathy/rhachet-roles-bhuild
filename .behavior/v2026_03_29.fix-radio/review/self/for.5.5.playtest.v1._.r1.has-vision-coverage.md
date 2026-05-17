# self-review: has-vision-coverage (r1)

i promise that it has-vision-coverage.

verification that the playtest covers all behaviors from wish and vision.

---

## wish behaviors

from 0.wish.md:

| wish item | description | playtest coverage |
|-----------|-------------|-------------------|
| 0 | provision github app | not in playtest (infrastructure, not behavior) |
| 1 | register EHMPATH_BEAVER_GITHUB_TOKEN in keyrack | prerequisite: keyrack unlocked |
| 2 | upgrade tests to fetch creds via keyrack | not in playtest (tests, not user behavior) |
| 3 | radio skill defaults to keyrack | **path 1**: tests no --auth flag |
| ultimate | radio skill "just works" | **path 1**: tests happy path |

**gaps identified**:
- items 0, 1, 2 are not testable via playtest (infrastructure and test concerns)
- item 3 and ultimate goal are covered by path 1

**verdict**: ✓ user-visible behaviors are covered

---

## vision behaviors

from 1.vision.md (the outcome world):

### before vs after

| behavior | playtest coverage |
|----------|-------------------|
| no --auth flag required | **path 1**: tests no --auth |
| keyrack provides token transparently | **path 1**: implicit in success |
| ephemeral tokens used | not directly testable (internal) |
| same path for tests/dev/ci | **path 2**: tests explicit --auth for ci/cd |

### usecases from vision

| usecase | playtest coverage |
|---------|-------------------|
| push task to github issues | **path 1**: direct test |
| setup auth | prerequisite section |
| run integration tests | not in playtest (test concern) |
| ci/cd workflows | **path 2**: explicit --auth |
| error experience | **edge 1**: keyrack not unlocked |

**verdict**: ✓ key user experiences covered

---

## is any behavior from vision untested?

### checked against vision usecases

1. **"developer runs skill — it just works"** → path 1 ✓
2. **"no token setup required"** → path 1 (no --auth) ✓
3. **"ephemeral tokens automatically"** → internal, not testable via playtest
4. **"clear error with fix hint"** → edge 1 ✓

### checked against vision timeline

the vision describes:
- user runs skill (t=0)
- skill calls keyrack (t=50ms)
- keyrack translates token (t=500ms)
- skill uses token for api call (t=600ms)
- output shown (t=1250ms)

the playtest verifies the user experience at t=0 and t=1250ms. internal steps (keyrack calls, token translation) are not directly testable via byhand playtest.

**verdict**: ✓ testable behaviors are covered

---

## conclusion

**the playtest covers all user-visible behaviors from wish and vision.**

| category | coverage |
|----------|----------|
| radio skill just works (no --auth) | ✓ path 1 |
| explicit --auth override | ✓ path 2 |
| error experience | ✓ edge 1 |
| validation errors | ✓ edge 2-3 |

**not in playtest (by design)**:
- infrastructure provision (item 0) — not user behavior
- keyrack registration (item 1) — covered by prerequisite
- test upgrades (item 2) — verified by automated tests
- internal token mechanics — not observable to user

**why it holds**:
1. the ultimate goal ("radio skill just works") is tested by path 1
2. the fallback path (explicit --auth) is tested by path 2
3. the error experience is tested by edge 1
4. internal mechanics are tested by automated tests, not playtest

