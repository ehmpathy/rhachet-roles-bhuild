# F13 — a delivered comment re-runs on a repeat; the thread findsert decides kept or posted

raised by the enroll-impl-arch-defects peer, 5.1 round 3 nitpick.3; round 4 blocker.2 showed the
round-3 choice rested on a cure that does not exist.

## .the fork

- **A** a DELIVERED comment record is final: a repeat of the same body reads `already delivered`,
  with zero gh calls
- **B** a DELIVERED comment re-runs: each repeat reads the thread, then ends `kept` (or posts
  again, where the comment was deleted upstream)

## .taken — B, and why at the time

- round 3 took A and named `radio.task.queue del` as the cure for a comment deleted upstream. round
  4 proved that false: `del` acts on held records only, and refuses a DELIVERED one
  (`getOneRadioTaskRecordHeldByKey`). under A, that comment had no cure but a changed body
- the send is a findsert on the thread (F3, exact body), so a re-run is idempotent: it posts naught
  where the body is already there. `rule.require.fewer-paths-via-idempotency` asks for this
  collapse
- round 2's blocker (a trailed-newline repeat re-sent) cannot recur: the key and the thread match
  both use `asCommentBodyCompared` (F9), so a re-run with a trailed newline lands on the same record
  and reads `kept`
- cost: one thread read per repeat, under the global send limit
- cost: under a shut gate, a repeat of a delivered comment reads `held` (the re-queue happens at
  transcribe time, before the gate), and `queue get` lists it until a drain reads the thread and
  ends it `kept`. no double post can follow; the held row is the price of a cure for a deleted
  comment (raised 5.1 round 6)

## .rework — clean

one line in `isRadioTaskRecordRequeuedByPush` (`if (input.before.kind === 'comment') return true;`).
clamps: `isRadioTaskRecordRequeuedByPush.test.ts`, `setRadioTaskRecordFromComment.integration.test.ts`
case3, acceptance case1 [t6b] (`kept`, one `issue view`) and [t6c] (deleted upstream → posted again).

## .confidence — 85%

## .where

`src/domain.operations/radio/record/isRadioTaskRecordRequeuedByPush.ts`

## .verdict

open
