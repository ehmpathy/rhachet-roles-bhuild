# F6 — experience-coverage i005: three findings that cite content as absent, which its own prompt held

## .the fork

the experience-coverage lane, on its last budgeted round (3/3), raised blocker.1, blocker.2, and
nitpick.2. all three assert that rows or sections are absent from the target:

- blocker.1: the degenerate table *"contains exactly one row: the seat"*; the author row and the
  product arithmetic *"never landed"*
- blocker.2: `1.vision.experience.case=_.md` and case=4 *"do not appear in the PR diff at all"*
- nitpick.2: rows `a2.b`, `a14.b`, `a20.b` *"are not visible anywhere in the target"*

either concede (and "fix" content that is present), or dispute with evidence. taken: **dispute**.

## .why, at the time

the lane's own logs refute each premise:

- `input.scope.json` of `.log/bhrain/review/2026-10-21T16-35-48-432Z.pid3251056.345cd0ec-…/`
  lists both `1.vision.experience.case=_.md` and
  `1.vision.experience.case=4.linked-render-outgrows-src-budget.md` among its 10 `targetFiles`
- `input.prompt.md` of that same log holds, verbatim:
  - line 1372: `| author | D3 = the act's yield · D4 = both, always · D6 is act a13 · D7 free only for payload-raise pairs | …`
  - line 1373: `| disputer | D3 n/a · D4 = \`linked\` · D5 n/a · D7 n/a | …`
  - line 1451: the `a14.b` row
  - line 1463: the `a20.b` row
  - line 1812: case=4's `when('[t2] a frozen role (supervisor) is set to its src payload exactly'`
- the dimensions file holds the arithmetic table (`| actor | free axes | product | rows |`, total
  62 after this round's a22) and four degenerate rows (seat, author, disputer, commander)

so the reviewer read past content it received. the lane is exhausted, so it cannot re-read to
confirm; a concede would commit to a fix with no defect behind it.

## .rework

clean. if the council sides with the reviewer, the "fix" is to restate content already present —
no design moves.

## .confidence

95% — the evidence is the reviewer's own input log, not an inference. the 5% is a chance that the
review's model saw a different render of the prompt than the logged one.

## .where

- `.reviews/peer/1.vision._.review.i005.15bbfd988e5ac75fc4.r002._.given.by_peer.experience-coverage.report.md`
- the taken: `…i005.15bbfd988e5ac75fc4.r002._.taken.by_self.experience-coverage.md`

## .verdict

open — for the council.
