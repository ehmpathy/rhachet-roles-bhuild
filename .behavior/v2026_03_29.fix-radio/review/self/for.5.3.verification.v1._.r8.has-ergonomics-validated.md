# self-review: has-ergonomics-validated (r8)

i promise that it has-ergonomics-validated.

comparison of repros sketches vs actual implementation.

---

## journey 1: radio skill just works

### repros sketch (lines 44-52)

```
input:
  rhx radio.task.push --via gh.issues --title "test task" --description "automated test"

output:
  🎙️ created: test task
     ├─ exid: 42
     ├─ status: QUEUED
     ├─ repo: ehmpathy/rhachet-roles-bhuild-demo
     └─ via: gh.issues
```

### actual implementation (acceptance test lines 74-81)

```typescript
runRadioTaskPush({
  repoDir: sharedRepo.repoDir,
  via: 'gh.issues',
  // no auth — uses default as-robot:via-keyrack(ehmpath)
  repo: GITHUB_DEMO_REPO,
  title: `test task ${Date.now()}`,
  description: 'automated acceptance test task',
})
```

### comparison

| aspect | repros | actual | match? |
|--------|--------|--------|--------|
| no --auth flag | ✓ | ✓ | ✓ yes |
| --via gh.issues | ✓ | ✓ | ✓ yes |
| --title | ✓ | ✓ | ✓ yes |
| --description | ✓ | ✓ | ✓ yes |
| output: created | ✓ | verified via assertion | ✓ yes |
| output: exid | ✓ | verified via assertion | ✓ yes |
| output: repo | ✓ | verified via assertion | ✓ yes |

**verdict**: ergonomics match exactly.

---

## journey 2: env var fallback

### repros sketch (lines 68-72)

```
input:
  rhx radio.task.push --via gh.issues --title "ci task"
  (with GITHUB_TOKEN set in env)

output:
  created: ci task
```

### actual implementation (case2-4 use explicit auth)

```typescript
auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)'
```

### comparison

| aspect | repros | actual | match? |
|--------|--------|--------|--------|
| env var fallback | implicit | **explicit** via --auth | **changed** |

### was this change intentional?

**yes** — per blueprint:
> `--auth` defaults to `as-robot:via-keyrack(ehmpath)` if not specified

the implicit env var fallback was **removed by design**. ci/cd now uses explicit `--auth as-robot:env(VAR)`.

**verdict**: ergonomics changed intentionally. repros needs update for accuracy.

---

## journey 3: error experience

### repros sketch (lines 86-93)

```
input:
  rhx radio.task.push --via gh.issues --title "test"

output:
  ⚠️ keyrack not unlocked for env=prep

  hint: run `rhx keyrack fill --owner ehmpath --env prep`
```

### actual implementation (getAuthFromKeyrack.ts)

```typescript
if (attempt.status !== 'granted') {
  const message = 'message' in attempt ? attempt.message : attempt.reasons?.join(', ');
  const fix = 'fix' in attempt ? attempt.fix : null;
  throw new Error(`keyrack: ${message}${fix ? `\n  fix: ${fix}` : ''}`);
}
```

### comparison

| aspect | repros | actual | match? |
|--------|--------|--------|--------|
| error includes keyrack message | ✓ | ✓ | ✓ yes |
| error includes fix hint | ✓ | ✓ (when present) | ✓ yes |
| error format | `⚠️` emoji | `keyrack:` prefix | **drift** |

### drift assessment

the repros sketched an emoji prefix (`⚠️`), but actual uses text prefix (`keyrack:`).

**is this acceptable?** yes — the text prefix is clearer and more machine-parseable. the fix hint is present.

**verdict**: minor format drift, ergonomics preserved.

---

## summary

| journey | input match | output match | ergonomics |
|---------|-------------|--------------|------------|
| 1. just works | ✓ | ✓ | ✓ preserved |
| 2. env fallback | **changed** | ✓ | explicit is better |
| 3. error | ✓ | minor drift | ✓ preserved |

---

## conclusion

**ergonomics are validated**:
1. journey 1: matches exactly
2. journey 2: changed intentionally per blueprint
3. journey 3: minor format drift, core ergonomics preserved

**why it holds**:
1. the primary use case (no --auth) works as sketched
2. explicit env auth is clearer than implicit fallback
3. error messages include actionable fix hints

**repros update needed**: journey 2 should be updated to reflect explicit auth, not implicit fallback.

