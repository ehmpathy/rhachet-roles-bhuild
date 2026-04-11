# self-review: has-play-test-convention (r10)

i promise that it has-play-test-convention.

final verification of journey test file conventions with concrete evidence.

---

## the question

are journey test files named correctly?

---

## repo convention analysis

### searched for `.play.` convention

```
glob: **/*.play.test.ts     → 0 files
glob: **/*.play.*.test.ts   → 0 files
```

**this repo does not use the `.play.` convention.**

### identified actual convention

```
blackbox/
├─ role=behaver/
│  ├─ skill.bind.behavior.acceptance.test.ts
│  ├─ skill.init.behavior.acceptance.test.ts
│  └─ (13 more files)
├─ role=decomposer/
│  ├─ skill.decompose.behavior.acceptance.test.ts
│  └─ skill.review.behavior.acceptance.test.ts
├─ role=dispatcher/
│  ├─ skill.radio.task.pull.via-gh-issues.acceptance.test.ts
│  ├─ skill.radio.task.pull.via-os-fileops.acceptance.test.ts
│  ├─ skill.radio.task.push.via-gh-issues.acceptance.test.ts  ← target
│  └─ skill.radio.task.push.via-os-fileops.acceptance.test.ts
└─ init.behavior.at-branch.acceptance.test.ts
```

**repo convention**: `blackbox/role={role}/skill.{name}.acceptance.test.ts`

---

## radio test file compliance

**file**: `blackbox/role=dispatcher/skill.radio.task.push.via-gh-issues.acceptance.test.ts`

| check | expected | actual | pass? |
|-------|----------|--------|-------|
| location | `blackbox/` | yes | ✓ |
| role directory | `role=dispatcher/` | yes | ✓ |
| suffix | `.acceptance.test.ts` | yes | ✓ |
| uses given/when/then | yes | yes (test-fns) | ✓ |
| has .what/.why header | yes | yes | ✓ |

**verified via file header**:
```typescript
/**
 * .what = acceptance tests for radio.task.push via gh.issues channel
 * .why = validates the github issues integration end-to-end
 */
```

---

## why the fallback convention is appropriate

the guide says:
> if not supported, is the fallback convention used?

this repo has 23 acceptance tests, all in `blackbox/` with `.acceptance.test.ts` suffix. the pattern is:
1. blackbox tests in `blackbox/` directory (not scattered)
2. organized by role (clear ownership)
3. named by skill (clear purpose)
4. `.acceptance.test.ts` suffix (clear scope)

the convention serves the same purpose as `.play.`:
- journey tests are identifiable by location and suffix
- distinct from unit tests (`.test.ts`) and integration tests (`.integration.test.ts`)

---

## conclusion

**the radio test follows the repo convention correctly.**

**why it holds**:
1. file is in the right location (`blackbox/role=dispatcher/`)
2. file has the right suffix (`.acceptance.test.ts`)
3. file follows the structure of all 23 other acceptance tests
4. the convention is established and consistent
5. the `.play.` convention is not used by this repo, so fallback applies

**no issues found** — the radio test file convention matches the repo pattern exactly.

