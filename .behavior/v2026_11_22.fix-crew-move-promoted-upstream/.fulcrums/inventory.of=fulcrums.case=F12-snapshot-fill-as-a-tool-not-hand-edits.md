# F12 — fill the move suite's snapshots with a tool, not by hand

## .the fork

r9 (round 2) asks a snapshot for each of ~130 `when` blocks of the move suite.

- A: ~130 Edit calls by hand, now
- B: pave a fill tool (typescript AST, one masked `then` per unsnapped `when`), and halt on its exec bit
- C: dispute the point as cosmetic

## .taken

B. the fill is one fixed shape repeated: a tool does it in one call, a rerun is a no-op, and the next exhaustiveness review reuses it. C is refused: the rule is a `require`, and the point is correct.

## .rework

clean — if the human prefers A, the hand edits land the same `then` the tool would write; the tool stays as pavement.

## .confidence — 80%

the cost: one more human ask (a mode bit), on a stone that already halted once for a mode bit.

## .where

`.agent/repo=.this/role=any/skills/test.snapshot.fill.sh` · `src/domain.roles/supervisor/skills/git.crew.move.integration.test.ts`

## .verdict

ruled by the director: B. the director set the exec bit; the tool inserted 91 snapshot `then`s in one call, and two runs (resnap, then plain) hold 281 green.
