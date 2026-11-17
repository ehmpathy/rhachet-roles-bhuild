# F14 — three refactors left wet, and the real-gh suite asserts without a snapshot

raised by peers in 5.1 round 3: enroll-impl-arch-defects nitpicks 4, 6, 9c; ergo-friction-hazards
nitpick.2.

## .the fork

- **A** leave each as is in this pr
- **B** do each here: one shared transcribe op for comment + push (r11.4); fold
  `RadioTaskRecordSent` into the delivered fate and drop `asRadioFateDelivered` (r11.6); collapse
  `runGh` into direct `runGhUnderSendLimit` calls (r11.9c); snap the live gh output (r9.n2)

## .taken — A, and why at the time

- r11.4: the transcribe steps repeat across exactly two callers. `rule.prefer.wet-over-dry` waits
  for a third; the director's F4 verdict also bounds this pr to "no change to radio.task.push
  beyond a shared helper", and a shared transcribe op rewrites the push's own record path
- r11.6: a type redesign of `RadioTaskRecordFate`, read by every drain, queue, and output module on
  main — a ripple well past this feature's diff (dirty under scouts honor)
- r11.9c: `runGh` and its call sites are main's code, not this route's; the collapse touches each
  task-dao call site for no behavior change
- r9.n2: a live snapshot cannot be minted here: the robot token is absent on this host, and jest in
  ci (`--ci`) refuses to write a new snapshot, so the first ci run would fail on an absent snap.
  the live suite asserts the url shape by regex and the kept path by content; the stub suite snaps
  every render

## .5.3 update — the live snapshot is now owed and landed

the 5.3 snapshot peers (r2, r4) ruled the live suite must snap, masked. so r9.n2 moved from A to B:
the live suite masks the run-minted issue number and comment id, and snaps the posted, kept, and
refused outputs. the snap file is written by hand, byte for byte from the stub suite's renders of
the same three outcomes, since this host holds no robot token and ci writes no new snap. if a byte
is off, the first ci run names the diff, and the fix is a one-line snap edit. the three refactors
stay A.

## .rework — clean

each is a self-contained follow-up; none changes the comment contract.

## .confidence — 80%

## .where

`src/domain.operations/radio/record/setRadioTaskRecordFrom{Comment,Push}.ts`,
`src/domain.operations/radio/record/RadioTaskRecordFate.ts`,
`src/access/daos/daoRadioTask/daoRadioTaskViaGhIssues.ts`,
`blackbox/role=dispatcher/skill.radio.task.comment.via-gh-issues.acceptance.test.ts`

## .verdict

open
