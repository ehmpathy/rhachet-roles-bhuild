# self-review: has-preserved-test-intentions (r4)

i promise that it has-preserved-test-intentions.

deeper skeptical review of test intention preservation.

---

## the hard question

**did I change what the test asserts, or fix why it failed?**

answer: I **changed what the test asserts** because **requirements changed**.

this is the third allowed case from the guide:
> requirements changed — document why, get approval

---

## requirement change documentation

### the old requirement (implicit env fallback)

the old code had this behavior:
```
no --auth provided → check process.env.GITHUB_TOKEN → use if present
```

the old test verified:
```typescript
// old case3: "GITHUB_TOKEN in env"
when('[t0] GITHUB_TOKEN is set and no --auth', () => {
  then('returns token from GITHUB_TOKEN', async () => {
    const result = await getGithubTokenByAuthArg(
      { auth: undefined },
      { env: { GITHUB_TOKEN: 'env-token-456' }, ... },
    );
    expect(result.token).toBe('env-token-456');
    expect(result.role).toBe('env');  // <-- note: role was 'env'
  });
});
```

### the new requirement (keyrack default)

the blueprint explicitly states:
> `--auth` defaults to `as-robot:via-keyrack(ehmpath)` if not specified

the new test verifies:
```typescript
// new case4: "default via-keyrack(ehmpath) when no --auth"
when('[t0] keyrack succeeds', () => {
  then('returns token from keyrack', async () => {
    getAuthFromKeyrack.mockResolvedValue({ token: 'keyrack-token-123' });
    const result = await getGithubTokenByAuthArg(
      { auth: undefined },
      { env: {}, ... },
    );
    expect(result.token).toBe('keyrack-token-123');
    expect(result.role).toBe('as-robot');  // <-- note: role is now 'as-robot'
  });
});
```

### approval

the blueprint (3.3.1.blueprint.product.v1.i1.md) was approved via the behavior route guard:
- stone: 3.3.1.blueprint.product.v1
- guard: approved via human review

the requirement change is authorized.

---

## before/after analysis for each changed test

### unit test: case3

| aspect | before | after |
|--------|--------|-------|
| name | "GITHUB_TOKEN in env" | "as-robot:via-keyrack(owner)" |
| tests what | implicit env var fallback | explicit keyrack mode |
| role returned | `'env'` | `'as-robot'` |

**verdict**: different behavior, authorized by blueprint.

### unit test: case4

| aspect | before | after |
|--------|--------|-------|
| name | "as-human" | "default via-keyrack(ehmpath) when no --auth" |
| tests what | as-human mode | keyrack default |

**verdict**: new test for new behavior. old as-human test moved to case5.

### unit test: old case5 "no auth detected"

| aspect | before | after |
|--------|--------|-------|
| tests what | no --auth + no GITHUB_TOKEN → BadRequestError | (removed) |

**verdict**: this case no longer exists. the new behavior is: no --auth → try keyrack → propagate keyrack error. the error experience is now keyrack's error message, not BadRequestError.

**is this a weakened assertion?** no. the old error said "no auth detected". the new error says "keyrack: vault locked" or "keyrack: credential not found". both are clear error experiences. the new errors are more specific.

### acceptance test: case1 t0 and t1

| aspect | before | after |
|--------|--------|-------|
| auth flag | `--auth as-robot:env(...)` | (none) |
| tests what | explicit env auth | keyrack default |

**verdict**: changed to test the new default behavior. explicit env auth still tested in cases 2-4.

---

## were any assertions weakened?

| old assertion | new assertion | weakened? |
|---------------|---------------|-----------|
| `role: 'env'` | `role: 'as-robot'` | no — different contract |
| `throws BadRequestError` on no auth | `throws keyrack error` on keyrack failure | no — error still thrown, message improved |

**verdict**: no assertions were weakened. the assertions changed to match the new contract.

---

## skeptic's challenge: is the old env fallback path still testable?

**question**: can users still use `process.env.GITHUB_TOKEN` as a fallback?

**answer**: yes, via two paths:
1. keyrack reads from `process.env` if available (via keyrack.source())
2. explicit `--auth as-robot:env(GITHUB_TOKEN)` bypasses keyrack

the explicit path is tested in case1 of the unit tests and cases 2-4 of acceptance tests.

---

## conclusion

test intentions were **changed**, not weakened, because requirements changed.

the requirement change is documented in the blueprint and was approved via the behavior route guard.

**why it holds**:
1. blueprint authorizes the change: `--auth defaults to as-robot:via-keyrack(ehmpath)`
2. old behavior is still accessible via explicit `--auth as-robot:env(VAR)`
3. new tests verify the new contract completely
4. no assertions were weakened — they were replaced with new contract assertions

