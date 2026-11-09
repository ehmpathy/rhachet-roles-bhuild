# F19 — a fence marker after `-->` on the same line opens no fence

## .the fork

`arch-hazards-behavior` (5.1 i002, nitpick.2): after a comment closes, `asMarkdownLinesRendered`
keeps the rest of the line but never checks it for a fence opener. given `--> ```` above three
`- why:` lines, the reviewer reads the whys as fenced code, and the parser's flat-layer blocker as
false.

options: **open a fence on the rest of a comment-close line**, or **keep the line as is** (taken).

## .taken, and why at the time

keep it. per CommonMark (§4.6, html block start condition 2), a block that opens with `<!--`
ends at the line that holds `-->`, and that whole line is part of the html block. a fence opens
only at a line start (up to 3 spaces of indent), so a ```` ``` ```` after `-->` on the same line
opens no fence. on the rendered page the three whys are flat list items — depth 1 — which is
the verdict the parser gives. the change asked for would make the parser diverge from the page.

## .rework: clean

one branch in `asMarkdownLinesRendered.ts`, plus a caselist row in its unit test.

## .confidence: 85%, and why it is low

renderers that are not CommonMark-strict may treat the tail differently; the repo reads yields as
github renders them, which follows CommonMark (GFM) here.

## .where

`src/domain.operations/behavior/vision/asMarkdownLinesRendered.ts` (the comment branch);
`asMarkdownLinesRendered.test.ts` ("text after a comment close on the same line is kept").

## .verdict

(unruled)
