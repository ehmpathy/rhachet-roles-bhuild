# self-review: has-play-test-convention (round 10)

## convention check

### preferred convention

guide specifies `.play.test.ts` suffix for journey tests:
- `feature.play.test.ts`
- `feature.play.acceptance.test.ts`

### repo convention

this repo uses `.acceptance.test.ts` for all behaver skill tests:

```
blackbox/role=behaver/
├── skill.bind.behavior.acceptance.test.ts
├── skill.init.behavior.*.acceptance.test.ts
├── skill.review.behavior.*.acceptance.test.ts
├── skill.feedback.take.acceptance.test.ts     ← new
└── skill.give.feedback.acceptance.test.ts     ← new
```

### our test files

| file | convention |
|------|------------|
| `skill.feedback.take.acceptance.test.ts` | matches repo pattern |
| `skill.give.feedback.acceptance.test.ts` | matches repo pattern |

## verdict

no `.play.test.ts` convention in this repo. all skill tests use `.acceptance.test.ts` as the established pattern. our new test files follow the repo's convention.

**status: PASS** (repo convention followed)
