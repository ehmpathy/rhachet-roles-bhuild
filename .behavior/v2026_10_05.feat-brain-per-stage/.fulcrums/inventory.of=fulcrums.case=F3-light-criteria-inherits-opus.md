# F3 · light `2.1.criteria` gains no guard; it inherits opus

## .the fork

- **a.** leave light mode with no criteria guard; the stone inherits opus from `1.vision`
- **b.** add a brain-only `2.1.criteria.blackbox.guard.light`

## .taken — a, and why

the stone sits between two opus guards (vision and blueprint), so inheritance lands it on opus.
(b) would break an extant test, `initBehaviorDir.integration.test.ts` "criteria has no guard in
light mode" — a deliberate light-mode guarantee (`define.guard-variants-heavy-light`). to change a
test that locks prior behavior needs a reason this wish does not give.

## .rework

clean. one new template file if the wisher wants it.

## .confidence — 85%, and why not higher

it follows F1's inheritance bet: a session that resumes at light criteria on sonnet stays on sonnet
until the blueprint.

## .where

no file changes; the walk test (F7) proves it lands on opus.
