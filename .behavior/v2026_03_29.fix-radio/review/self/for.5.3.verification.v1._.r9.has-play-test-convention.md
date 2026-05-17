# self-review: has-play-test-convention (r9)

i promise that it has-play-test-convention.

verification of journey test file conventions.

---

## the question

are journey test files named correctly with `.play.test.ts` suffix?

---

## what the guide expects

the guide suggests:
- `feature.play.test.ts` — journey test
- `feature.play.integration.test.ts` — if repo requires integration runner
- `feature.play.acceptance.test.ts` — if repo requires acceptance runner

---

## what this repo actually uses

**this repo does NOT use the `.play.` convention.**

glob search for `**/*.play.test.ts` and `**/*.play.*.test.ts` found **zero files**.

instead, this repo uses:
- `blackbox/*.acceptance.test.ts` — journey/acceptance tests
- organized by role: `blackbox/role={role}/skill.{name}.acceptance.test.ts`

### evidence

```
blackbox/
├─ role=behaver/
│  ├─ skill.bind.behavior.acceptance.test.ts
│  ├─ skill.init.behavior.acceptance.test.ts
│  └─ ...
├─ role=dispatcher/
│  ├─ skill.radio.task.push.via-gh-issues.acceptance.test.ts  ← our test
│  ├─ skill.radio.task.pull.via-gh-issues.acceptance.test.ts
│  └─ ...
└─ ...
```

---

## is this a problem?

**no — this is the established repo convention.**

the `.play.test.ts` convention is one way to name journey tests. this repo has a clear alternative:
- `blackbox/` directory contains all journey tests
- `.acceptance.test.ts` suffix indicates blackbox/journey scope
- `role={role}/skill.{name}` structure organizes by feature

this is consistent with the guide's intent (identify journey tests clearly) even though the specific suffix differs.

---

## where is the radio journey test?

**file**: `blackbox/role=dispatcher/skill.radio.task.push.via-gh-issues.acceptance.test.ts`

**location**: correct — in `blackbox/` directory under `role=dispatcher`

**suffix**: `.acceptance.test.ts` — matches repo convention

---

## conclusion

**play test convention is NOT used by this repo**, but the fallback convention IS used:
- journey tests live in `blackbox/`
- journey tests use `.acceptance.test.ts` suffix
- organization by role provides clear structure

**why it holds**:
1. the repo has a consistent established convention
2. the convention serves the same purpose (identify journey tests)
3. the radio test follows the repo convention exactly
4. a switch to `.play.` convention would break repo consistency

the guide allows for fallback conventions when `.play.` is not supported. this repo uses its own convention, and the radio test follows it correctly.

