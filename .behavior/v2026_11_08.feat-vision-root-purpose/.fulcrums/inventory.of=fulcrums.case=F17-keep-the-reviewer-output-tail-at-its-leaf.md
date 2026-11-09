# F17 — keep `asReviewerOutputLines` as its own transformer, on one caller

## .the fork

`arch-opport-decomposition` (5.1, rewound i001, nitpick.2): `asReviewerOutputLines` renders the
lane-agnostic tail (each concern with its fix, then both numeric counts) and has one caller,
`asVisionRootPurposeReport`. the rule's wet-over-dry clause waits for 3+ uses before an extract.

options: **inline the tail back into the vision report**, or **keep it as its own transformer at
its leaf** (taken).

## .taken, and why at the time

keep it. the tail holds the `contract.reviewer-output` invariants (both counts always present, the
two-axis labels), and `asReviewerOutputLines.test.ts` pins them apart from any vision fixture — a
5.1 i005 ask, that each decider and the tail be tested at its own grain. wet-over-dry governs a
generalization of similar code; this is a decomposition of one render, placed at its leaf in
`behavior/vision/` and not lifted (`rule.prefer.most-common-denominator`).

## .rework: clean

inline the array into `asVisionRootPurposeReport` and fold its unit cases into the report's test;
one file, no caller beyond it.

## .confidence: 80%, and why it is low

a strict read of wet-over-dry counts callers only, and this has one; a reviewer may hold that a
test seam alone does not earn a file.

## .where

`src/domain.operations/behavior/vision/asReviewerOutputLines.ts` (+ `.test.ts`).

## .verdict

(unruled)
