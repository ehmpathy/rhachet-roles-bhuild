# F18 — the stamp in review.behavior's output filename is left to a dream

## .the fork

5.3 peer review i001, lane `repo-rules`, nitpick.2: `review.behavior.sh` names its feedback file
`….by_robot.v${TIMESTAMP}.md` in the tracked behavior dir, with a time of day in the stamp
(`rule.forbid.timestamps-in-tracked-files`).

- (a) give the output file a stable name in this pr
- (b) leave it, and catch a dream

## .taken — (b), and why

- the stamp predates this pr. the pr touched the skill's rule filter and its halt, not its output name
- a stable name changes a contract: a second review of one artifact would overwrite the first, so
  the fix owes a choice (overwrite, or a seq like the radio's `heldSeq`) that no line of #715 asks
- the new suite masks the stamp, so its snapshots stay stable; the rename is real work for its own pr

## .rework — clean

the dream's shape; no file in this pr leans on the stamp.

## .confidence — 85%

## .where

`src/domain.roles/behaver/skills/review.behavior.sh` ·
`.dream/v2026_11_23.fix.review-behavior-output-name-holds-no-time-of-day.md`

## .verdict

open — flagged for the pr
