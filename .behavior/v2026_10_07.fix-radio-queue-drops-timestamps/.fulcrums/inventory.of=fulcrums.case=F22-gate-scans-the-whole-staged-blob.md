# F22 — the gate scans the whole staged blob, not only the added lines

- **the fork** — peer enroll-impl-arch-defects (i007 blocker.3): the gate halts any staged file that
  holds a timestamp anywhere, so an edit to a tracked file that already holds one (a supervisor
  evidence brief, a decompose test asset, this route's wish) halts too. (a) scan only added lines
  (`git diff --cached -U0`); (b) keep the whole-blob scan, as declapract ships it.
- **taken** — (b), plus the two writers in this repo fixed at the source: `applyPlan` writes
  `- generated on: <datestamp>` and `imaginePlan` mints `generatedAt` as a datestamp, each with a
  test. the gate is the declapract practice (F11); an added-lines scan is a redesign of it, and
  would let a stamp ride into a tracked file on any line a commit does not touch. a file that holds
  a stamp today is the debt the rule names, not a false positive: the fix is to mask it on contact.
- **rework** — clean. the scan is one pipeline in `check.timestamps.sh`; an added-lines variant is a
  rewrite of that pipeline plus its tests, upstream first.
- **confidence** — 70%. low part: the reviewer is right that a wick-up on contact of a supervisor
  brief now halts until its stamps are masked, and the wisher asked only for the gate, not a sweep
  of tracked files.
- **where** — `.husky/check.timestamps.sh`; `src/domain.operations/behavior/decompose/applyPlan.ts`;
  `src/domain.operations/behavior/decompose/imaginePlan.ts`; the sweep of extant stamps is the
  declapract reseed dream `.dream/2026_10_09.reseed-declapract-check-timestamps-qualified-headers.dream.md`.
- **verdict** — unruled.
