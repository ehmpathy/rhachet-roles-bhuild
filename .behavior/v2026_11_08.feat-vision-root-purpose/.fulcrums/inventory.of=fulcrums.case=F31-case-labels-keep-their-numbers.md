# F31: case labels keep their numbers

## .the fork

the review skill's acceptance suite declares its cases in the order `[case1]`, `[case2]`,
`[case3]`, `[case6]`, `[case7]`, `[case8]`, `[case5]`, `[case4]`.

- **A — renumber them**, so the file reads in order
- **B — keep each number**, as the label a case was cited by

## .taken, and why

B:

- a case label is a citation key: the experience catalog, both yields, every taken, and each
  fulcrum name cases by number (`[case4][t3]`, `[case8]`)
- a renumber would break those citations, or demand a sweep across artifacts that no review
  could check line by line
- the snapshot keys sort by name, so the snap reads in order today
- the label still names its case; only the declaration order differs

## .rework

clean. a renumber plus a citation sweep, in a round of its own.

## .confidence, and why

80%.

## .where

`blackbox/role=behaver/skill.review.vision.root-purpose.acceptance.test.ts`
