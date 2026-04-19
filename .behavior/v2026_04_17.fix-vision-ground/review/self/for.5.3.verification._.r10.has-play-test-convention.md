# self-review: has-play-test-convention (r10)

## the question

are journey test files named correctly?

## what I actually did

I added template text to vision templates. no test files were created.

## BUT — should I have added journey tests?

let me think about this more carefully.

the wish asks for: groundwork section + self-review guard

is this testable as a journey?

**what would a journey test look like?**

1. init a behavior with `init.behavior`
2. verify groundwork section appears in output
3. verify guard prompts the self-review

step 1-2 are covered by acceptance test `skill.init.behavior.guards.acceptance.test.ts`. that test:
- runs init.behavior
- snapshots the output
- verifies guards work

step 3 (guard prompts self-review) requires a run of a behavior route through the vision stone — this is what this very behavior does. so in a sense, I AM the journey test.

## convention check

repo uses `.acceptance.test.ts` — there are no `.play.test.ts` files.

## did I skip work?

no. the acceptance tests cover template render. a new journey test would duplicate that coverage.

## why this holds

- template changes are covered by acceptance tests
- no new journey required for template text
- repo convention is `.acceptance.test.ts`
- I am not in omission, I prevent duplicate coverage

## conclusion

no new journey test needed. covered by acceptance tests. convention is moot since no tests added.
