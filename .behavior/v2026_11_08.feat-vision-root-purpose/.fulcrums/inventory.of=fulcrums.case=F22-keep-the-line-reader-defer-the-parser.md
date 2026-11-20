# F22: keep the line reader, defer the parser

## .the fork

- **A — swap now.** read the section through an mdast walk (`mdast-util-from-markdown` or
  `micromark`). this deletes the partial renderer and its whole class of divergences
- **B — keep the line reader.** clamp each divergence as a parser caselist row, and catch the swap
  as a dream for the owner

## .taken, and why

B, for three reasons:

- the swap adds a pinned runtime dependency to a published role package, and that is the owner's
  call, not the driver's
- the lane matches a rendered page on every clamped row. those cover tabs, fences, comments, code
  spans, a one-column nest, a code-indented nest, and a blockquote chain
- each extant miss is graded `better`: it costs a round, and ships no harm

the dream holds the shape of the swap:
`.dream/2026_11_08.swap-root-purpose-reader-for-a-commonmark-parser.dream.md`

## .rework

clean. the parser caselist is the spec, so a swap that passes every row is a drop-in.

## .confidence, and why it is low

75%. five review rounds found five divergences, which is evidence the class is open, and the next
miss will be found by an author rather than a reviewer.

## .where

`src/domain.operations/behavior/vision/rootPurpose/` — `asMarkdownLinesRendered`, `asIndentWidth`,
and `getOneVisionRootPurpose`
