# F13 — self-reviews restate the four how kinds; the template clamp reads text

## .the fork

round i003 asked for two consolidations:

- the three `has-restated-the-wisher-how` self-reviews say "list each how, per the rule" and drop the four kinds they list (poc, parity target, named mechanism, tool-phrased done-when)
- the template clamp in `initBehaviorDir.integration.test.ts` reads lanes through bhrain's `getAllStones` + `parseReviewArgs`, as `laneScope` does, rather than by regex over template text

## .taken — keep both, and why

- **the kinds are a cue, not a claim.** a self-review prompt is read at the moment of the act, often without the rule open. the kinds are the detector a writer scans the wish with. two copies of a detector cannot disagree: if one grows a kind, the other simply misses it (`rule.require.a-cue-is-not-a-claim`). the strike test and the inverse check are pinned in all three blocks, and light/heavy byte-equality holds the vision pair.
- **the template clamp reads the file a human edits.** it pins the text of the guard template, apart from how bhrain parses it today. a bhrain parse change then cannot hide a template drift. `laneScope` already proves the parsed form; the two answer different questions.

## .rework — clean

either consolidation is a local edit in one test file or three template blocks, with no caller.

## .confidence — 80%, and why it is short of 93%

a kind added to the rule must also be added to three blocks by hand; no test turns red if it is not.

## .where

`src/domain.operations/behavior/init/templates/{1.vision.guard.*,2.1.criteria.blackbox.guard.heavy}` · `src/domain.operations/behavior/init/initBehaviorDir.integration.test.ts`

## .verdict

open — flagged for the pr
