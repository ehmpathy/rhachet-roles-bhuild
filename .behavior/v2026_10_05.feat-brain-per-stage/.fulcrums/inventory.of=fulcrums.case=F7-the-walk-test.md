# F7 · the test computes each stone's brain by a walk in route order

## .the fork

- **a.** walk each size × variant's stones in route order; each stone lands on its own `brain:`,
  else the prior stone's. assert phase → brain. also assert every guard template declares a brain
- **b.** grep each guard template for the right `brain:` line, with no walk
- **c.** snapshot the full init output and let the reviewer read the brains off it

## .taken — a, and why

the wish asks the tests to "prove the brain each stone … resolves to". (b) proves only the guards;
it is blind to an unguarded stone that inherits the wrong brain — the exact gap F2 closes. (c) shows
the brains but asserts no rule. (a) asserts the rule the wish states, across every size.

## .rework

clean. a test-only change.

## .confidence — 80%, and why not higher

the walk re-implements bhrain's inheritance in a test. bhrain does not export its guard parser
(`dist/index.d.ts`), so the test reads `^brain:` lines itself — a narrow local read of one key,
which can drift from bhrain's own parse of edge forms (quotes, the exploded block).

## .where

an `.integration.test.ts` — the walk reads guard templates from disk, a filesystem boundary that a
unit test may not cross (`rule.forbid.unit.remote-boundaries`). candidates: a new
`getAllTemplatesBySize.brain.integration.test.ts`, or a new case in
`initBehaviorDir.integration.test.ts` (which already inits real routes into a temp dir).
