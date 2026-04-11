# self-review: has-critical-paths-frictionless (round 8)

## critical paths from repros artifact

| critical path | description | why critical |
|---------------|-------------|--------------|
| human gives feedback | human runs `rhx feedback.give --against $artifact` | entry point for all feedback |
| clone blocked on stop | clone hits stop hook with unresponded feedback | the core guarantee |
| clone records response | clone runs `feedback.take.set` | completes the feedback loop |
| hash invalidation | edited [given] re-triggers unresponded state | feedback updates must be re-addressed |

## manual verification via acceptance tests

ran full acceptance test suite to verify all paths work smoothly:

```
npm run test:acceptance -- blackbox/role=behaver/skill.feedback.take.acceptance.test.ts
npm run test:acceptance -- blackbox/role=behaver/skill.give.feedback.acceptance.test.ts
```

### path 1: human gives feedback

**test coverage:** `skill.give.feedback.acceptance.test.ts` case1-case5

| scenario | test | result |
|----------|------|--------|
| success path | case1 [t0] | exit 0, file created with placeholders replaced |
| findsert (idempotent) | case2 [t0] | exit 0, same file returned |
| version flag | case3 [t0] | v2 feedback file created |
| artifact not found | case4 [t0] | clear error: "no artifact found" |
| template not found | case5 [t0] | clear error: "template not found" |

**friction check:** no unexpected errors. clear messages on failure paths.

### path 2: clone blocked on stop

**test coverage:** `skill.feedback.take.acceptance.test.ts` case2[t1], case4[t1], case5[t1]

| scenario | test | exit code | message |
|----------|------|-----------|---------|
| unresponded feedback | case2 [t1] | 2 | "bummer dude... respond to all feedback" |
| stale feedback | case4 [t1] | 2 | "bummer dude..." (hash mismatch) |
| mixed status | case5 [t1] | 2 | "bummer dude..." (has unresponded) |
| no feedback | case1 [t1] | 0 | "righteous!" |
| all responded | case3 [t2] | 0 | "righteous!" |

**friction check:** exit code semantics correct (2 = constraint, 0 = success). messages are clear and actionable.

### path 3: clone records response

**test coverage:** `skill.feedback.take.acceptance.test.ts` case3[t0]

| aspect | verified |
|--------|----------|
| exit code | 0 |
| [taken] file created | yes |
| hash recorded | yes, matches [given] content |
| response content | preserved in [taken] file |
| subsequent get | shows "responded" status |

**friction check:** single command completes the loop. no extra steps required.

### path 4: hash invalidation

**test coverage:** `skill.feedback.take.acceptance.test.ts` case4

| step | verified |
|------|----------|
| [taken] created with original hash | yes (setup) |
| [given] content updated | yes (setup) |
| feedback.take.get shows "stale" | yes, case4[t0] |
| hook.onStop blocks | yes, case4[t1] exit 2 |

**friction check:** system detects hash mismatch automatically. no manual intervention needed.

---

## friction issues found and fixed

### issue: snapshot instability from temp directory timestamps

**symptom:** snapshots failed due to timestamp variations in `.temp/` directory names

**fix:** added mask pattern to `asSnapshotStable`:
```typescript
.replace(/\.temp\/\d{4}-\d{2}-\d{2}T[\d-]+\.\d+Z\.[a-z0-9-]+\.[a-f0-9]+/gi, '.temp/{TIMESTAMP}')
```

**result:** all 15 snapshots now stable across test runs

---

## verdict

all 4 critical paths verified frictionless:
- commands work as expected
- error messages are clear and actionable
- exit codes follow semantic convention (0 = success, 2 = constraint)
- no unexpected friction or unclear behavior

**status: PASS**
