# F11 · fix the radio concurrent-drain race in this branch

## the fork

5.3 says fix every failure, this diff's or not. the full integration suite surfaced one real defect
outside the wish: two concurrent radio drains double-sent a held task (`[case9]` in
`setRadioTaskRecordsDrainedByPush.integration.test.ts`: 5 upstream where 4 are owed; 57/57 alone,
red only under the full suite's load). root: each drain read the same held backlog, and the
upstream findsert (X2) is check-then-write, so two racers both missed and both wrote.

| option | cost |
|---|---|
| A · fix in this branch: a per-worktree drain lock (taken) | radio concurrency code lands in a brain-per-stage pr |
| B · defer to a dedicated fix | the double-send (a duplicate github issue under concurrent pushes) stays live |

## taken, and why at the time

A. first best-guessed B; reversed on the stone's explicit mandate ("if a test fails for reasons
unrelated to your changes — fix it anyway") and because the harm is behavioral. the fix stayed
contained in the drain:

- `withRadioDrainLock` — `with-simple-mutex` over a `simple-on-disk-cache` at
  `.behavior/.radio/.locks` (per-machine, so it spans push processes); key `radio.drain`, lease
  5 min (a crashed holder's lock expires), acquire bound 2 min (`SimpleMutexAcquireTimeoutError`)
- `setRadioTaskRecordsDrained` — wrapped, so the held line is read under the lock
- `setRadioPushSettledAfterDrain` — a push held when it began, whose record the drain ahead of it
  delivered, confirms upstream via the extant findsert (now sequential, so it finds, never doubles)
  and reads as delivered; a push landed when it began still reads as landed (C3, C6)

proof: `withRadioDrainLock.integration.test.ts` (9 pass: in-process race, cross-process race, release
on throw; clamp proven — bypass the mutex → both overlap tests go red); case9 green in the radio
integration suites; os.fileops push/pull + recorder acceptance green.

## rework

clean: the lock is one wrapper and one helper; revert both and case9 returns to its race.

## confidence (85%)

- the lease (5 min) and acquire bound (2 min) are best guesses; the radio owner may tune them
- a holder that crashes mid-drain holds the lock until its lease lapses, so a push in that window
  waits out the 2 min bound and fails loud; the next push after 5 min proceeds

## where

- `src/domain.operations/radio/record/withRadioDrainLock.ts`
- `src/domain.operations/radio/record/setRadioTaskRecordsDrained.ts`
- `src/domain.operations/radio/record/setRadioPushSettledAfterDrain.ts`
- `src/domain.operations/radio/record/setRadioTaskRecordsDrainedByPush.ts`

## verdict

awaits the wisher.
