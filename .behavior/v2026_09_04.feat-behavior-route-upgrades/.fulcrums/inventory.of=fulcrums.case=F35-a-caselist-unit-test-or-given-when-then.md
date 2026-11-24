# F35 — a caselist unit test, or given/when/then

rework = clean · status = open · confidence = 85% · risk = rework only, no harm

## the fork

r007 nitpick.1 asks five new transformer unit tests to trade their `TEST_CASES.map(… test(…))`
table for `given` / `when` / `then` blocks.

- **A — dispute: keep the caselist** (taken)
- **B — wrap each row in `given` / `then`**

## taken, and why at the time

A. two mechanic rules speak, and they agree here. `rule.prefer.data-driven` asks for this exact
shape — its example is `describe` + `TEST_CASES.map(… test(…))` — and names transformer unit tests
as its home. `rule.require.given-when-then` marks unit tests `recommended`, never required. all
five files test pure transformers (`asLaneSlugList`, `isPeerReviewReportInScope`, `getColumnWidth`,
`getGuardSlugsAbsent`, `getEmptyCorpusHint`).

## rework, and why clean

a mechanical wrap of five files; no assertion changes.

## confidence, and why it is not higher

the rest of the suite reads given/when/then, so a reader meets two shapes in one repo.

## where

`src/domain.operations/tally.reviews.peer/*.test.ts` · `src/domain.operations/behavior/init/getGuardSlugsAbsent.test.ts`

## verdict

open — rides to the pr.
