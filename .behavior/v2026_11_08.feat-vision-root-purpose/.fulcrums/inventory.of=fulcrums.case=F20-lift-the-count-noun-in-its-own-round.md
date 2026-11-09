# F20: lift the count noun in its own round

## .the fork

- **A — lift now.** move a named-arg `asCountNoun` to the common ancestor of `vision/` and `reflect.on.review.self/`, and migrate `asCount`'s positional callers in the reflect module to it
- **B — keep both, catch a dream.** `vision/asCountNoun` stays on its three vision callers; the lift and the reflect migration ride their own change

## .taken, and why

B. the lift fails CLEAN: it rewrites another module's extant export, its callers, and its tests, none of which this wish touches. `rule.prefer.most-common-denominator` asks for the lift; `rule.always.fix-forward-under-scouts-honor` says a rippled change is a dream, not a smuggle.

## .rework

clean. the two transformers share no state. a later lift replaces one import line per caller.

## .confidence, and why it is low

80%. the duplicate is four lines, and a reviewer could fairly weigh the lift as small enough to pull in.

## .where

`src/domain.operations/behavior/vision/asCountNoun.ts` · `src/domain.operations/reflect.on.review.self/asReflectionCorpusSummary.ts:37`

## .dream

`.dream/2026_11_08.lift-count-noun-to-domain-operations.dream.md`
