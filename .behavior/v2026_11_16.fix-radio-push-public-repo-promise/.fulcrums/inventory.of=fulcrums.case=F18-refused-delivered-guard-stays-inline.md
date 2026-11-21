# F18: the refused and delivered branches keep their re-push guard inline

## .the fork

- **A, taken:** this route folds the two held branches into `setRadioTaskRecordHeld`; the refused and delivered branches keep the guard they had on `origin/main`
- **B:** one settle-fate leaf that all three compose, each with its own fate shape

## .why A, at the time

both inline guards predate this branch (`git show origin/main:…/setRadioTaskRecordUpstream.ts`: four inline copies, now two). the fold reaches the delivered path every send shares, outside #675's behavior list, and the three fate shapes differ. a dream holds the shape of B: `.dream/2026_11_17.radio-settle-fate-leaf-for-refused-and-delivered.dream.md`.

## .rework: dirty

the delivered branch is the path every send shares.

## .confidence: 80%

## .where

`src/domain.operations/radio/record/setRadioTaskRecordUpstream.ts`; peer round i003: arch-opport-decomposition nitpick.2.

## .verdict

open.
