# self-review: has-questioned-questions

triage of all open questions in the vision.

## question 1: where should groundwork section go?

**status**: [answered]

**can this be answered via logic?** yes — placement after "open questions" and before "what is awkward" makes narrative sense: you ask questions → you cite research that answers them → you reflect on what's still awkward.

**verdict**: already answered correctly. no change needed.

## question 2: should the guard verify file paths exist, or prompt self-review?

**status**: [research] — but can be answered now

**can this be answered via logic?** yes — the wisher explicitly said "self review to double down and verify." this directly answers the question: self-review (semantic), not automated checks (mechanical).

**fix**: upgrade from [research] to [answered]. the wisher already answered this.

## question 3: is "groundwork" the right term?

**status**: [wisher]

**can this be answered via logic?** no — terminology is a preference. "groundwork" appears in the wish, so the wisher chose it, but confirmation is reasonable.

**verdict**: keep as [wisher]. the wisher should confirm or suggest alternatives.

## question 4: is external/internal split right?

**status**: [wisher]

**can this be answered via logic?** no — structure is a preference. the wisher said "external websearch research or internal codepaths research" which implies a binary, but didn't mandate the format.

**verdict**: keep as [wisher].

## question 5: where does detailed research happen?

**status**: [wisher]

**can this be answered via extant docs/code?** let me check the behavior templates for other phases...

**from context**: the wish says "further detailed research can be done later, with the research questions section specifically for that." this implies a later phase exists where research questions get answered. but the exact phase isn't specified.

**verdict**: keep as [wisher] — need wisher to clarify which phase handles detailed research.

## question 6: what defines contract-level vs detailed research?

**status**: [wisher]

**can this be answered via logic?** partially. I can propose a definition:
- **contract-level**: does this exist? what's its interface? what are its constraints? (shape, not behavior)
- **detailed**: how does it handle edge case X? what's the performance? how do we handle errors? (behavior, not shape)

**verdict**: upgrade to [answered] with proposed definition. if wisher disagrees, they can override.

## fixes applied

1. question 2: [research] → [answered] — wisher already said "self review"
2. question 6: [wisher] → [answered] with definition:
   - contract-level = shape (exists, interface, constraints)
   - detailed = behavior (edge cases, performance, errors)

## summary

| question | before | after | rationale |
|----------|--------|-------|-----------|
| section placement | [answered] | [answered] | no change |
| verify vs self-review | [research] | [answered] | wisher said "self review" |
| term "groundwork" | [wisher] | [wisher] | preference |
| external/internal split | [wisher] | [wisher] | preference |
| where detailed research | [wisher] | [wisher] | phase unclear |
| contract vs detailed | [wisher] | [answered] | definable via logic |
