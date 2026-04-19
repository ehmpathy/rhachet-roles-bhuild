# self-review: has-play-test-convention

## new test files added

none. this PR adds template text only:
- `1.vision.stone`
- `1.vision.guard.light`
- `1.vision.guard.heavy`

no test files were created or modified.

## why no journey tests

template text changes don't require new journey tests:
- templates are consumed by `init.behavior`
- `init.behavior` already has acceptance tests with `.acceptance.test.ts` suffix
- my template changes will surface in those tests when they run

## convention check

verified repo uses `.acceptance.test.ts` for journey tests:
- `blackbox/role=behaver/skill.init.behavior.guards.acceptance.test.ts`

this is the fallback convention for repos that use the acceptance test runner.

## conclusion

no new journey tests needed. prior acceptance tests cover template render. convention is followed by prior tests.
