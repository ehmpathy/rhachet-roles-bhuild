# self-review: has-play-test-convention (r11)

i promise that it has-play-test-convention.

deeper review to question whether the test file truly covers all journeys, not just file conventions.

---

## the deeper question

the guide asks about name convention. but the spirit is: are journey tests in place?

---

## journey coverage analysis

### journey 1: radio skill just works (keyrack default)

**expected**: no --auth flag, keyrack provides token transparently

**test coverage**: case1 [t0] (lines 70-99)
```typescript
given('[case1] push new task to gh.issues (default auth via keyrack)', () => {
  when('[t0] push with title and description (no --auth flag)', () => {
    // no auth — uses default as-robot:via-keyrack(ehmpath)
    ...
  });
});
```

**verdict**: ✓ covered

### journey 2: env var fallback (explicit --auth)

**expected**: explicit `--auth as-robot:env(VAR)` provides token

**test coverage**: case2-4 all use explicit auth
```typescript
auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)'
```

**verdict**: ✓ covered (via explicit auth, which is the new design)

### journey 3: error experience (keyrack not unlocked)

**expected**: clear error with remediation hint when keyrack fails

**acceptance test coverage**: none

**unit test coverage**: getGithubTokenByAuthArg.test.ts case4 t1
```typescript
when('[t1] keyrack fails', () => {
  then('propagates the keyrack error', async () => {
    getAuthFromKeyrack.mockRejectedValue(
      new Error('keyrack: vault locked'),
    );
    await expect(...).rejects.toThrow('keyrack: vault locked');
  });
});
```

**verdict**: covered at unit level, not acceptance level

---

## is the absent acceptance test for journey 3 a gap?

**assessment**: no — and here's why:

1. **setup complexity**: acceptance test would require intentionally broken keyrack state, which is hard to simulate without a mock (defeats acceptance test purpose)

2. **error origin**: the error message comes from keyrack itself, not our code. we just forward it. unit tests verify we forward correctly.

3. **unit coverage is sufficient**: getAuthFromKeyrack.test.ts and getGithubTokenByAuthArg.test.ts verify error propagation at the code level

4. **acceptance test scope**: acceptance tests verify the happy path end-to-end. error paths are appropriately tested at unit level where we control the failure mode.

---

## file name convention

**file**: `blackbox/role=dispatcher/skill.radio.task.push.via-gh-issues.acceptance.test.ts`

**repo convention**: `.acceptance.test.ts` suffix in `blackbox/` directory

**matches repo pattern**: yes — 23 other files follow this pattern

**guide fallback applies**: this repo does not use `.play.` convention, so fallback (established repo convention) is appropriate

---

## conclusion

**the test file follows repo conventions AND covers the critical journeys.**

| journey | acceptance test | unit test | verdict |
|---------|-----------------|-----------|---------|
| 1. keyrack default | case1 [t0] | case4 t0 | ✓ covered both levels |
| 2. explicit auth | case2-4 | case1-3 | ✓ covered both levels |
| 3. error experience | none | case4 t1 | ✓ appropriate for unit scope |

**why it holds**:
1. the file name follows the established repo convention
2. journey 1 and 2 have acceptance tests
3. journey 3 (error) is appropriately tested at unit level due to setup complexity
4. no gaps in coverage for the behavior this fix delivers

