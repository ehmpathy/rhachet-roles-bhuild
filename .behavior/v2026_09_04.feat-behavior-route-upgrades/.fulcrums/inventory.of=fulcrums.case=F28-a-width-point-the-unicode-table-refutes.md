# F28 — a width point the unicode table refutes: dispute it, or swap the glyph anyway

- rework: **clean** — a swap of `⛵` for another Wide glyph across six briefs. no caller hardens on it
- status: open — best-guessed, drive on
- confidence: **92%**
- raised: 2026-10-21, `5.1.execution.from_vision` round i002

## .the fork, stated fairly

`prose-of-briefs` blocker.1 reads `⛵` (`U+26F5`) as `East_Asian_Width=A` and asks for a swap.

| option | for it | against it |
|---|---|---|
| dispute | UAX #11 marks `U+26F5` **W**. bhrain's own checker lists it Wide: `review.for.width-ambiguous-glyphs.js:66`, `[0x26f5, 0x26f5]` in the `WIDE` table | the lane is the reader the rule trusts; a dispute asks the council to side against it |
| swap anyway | quiets the lane in one edit | swaps a correct glyph on a false premise, and teaches the next reader that `⛵` is Ambiguous |

## .taken, and why

dispute. the rule's own test is *"what is the glyph's `East_Asian_Width` class?"*, and the table the
rule's checker ships answers **W**. a swap would record a fix for a defect that is absent.

## .rework, and why it is clean

if the council prefers the swap, `⛵` appears in six brief lines; one `rhx sedreplace` covers them.

## .confidence, and why it is not higher

the checker's table is bhrain's transcription of UAX #11, not the UCD file itself. one read of
`EastAsianWidth.txt` at `26F5` settles it.

## .where

`$route/.reviews/peer/5.1.execution.from_vision._.review.i002.*.r002._.taken.by_self.prose-of-briefs.md`
