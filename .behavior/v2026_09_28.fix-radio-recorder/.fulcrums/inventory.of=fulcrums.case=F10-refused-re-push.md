# F10 — an explicit re-push of a refused record

## .the fork

a record closed as REFUSED (U3) is never retried by the drain. but a human may re-run the same
push on purpose — same repo, same exid, same status. what does that re-run do?

- **A. re-queue it** — the record returns to QUEUED, reason cleared, and meets the gate afresh
- **B. keep it closed** — the record stays REFUSED; the re-run reports the refusal again

## .taken, and why at the time

**A.** the drain never retries on its own, so U3 holds. but a human re-run is a deliberate act,
and under B the dispatch falls through to `landed`, which prints "already delivered" — false.
A is the minimum that keeps a deliberate re-run coherent.

## .rework

clean — one branch in `setRadioTaskRecordFromPush` (`isRequeue`), plus its output path.

## .confidence — 85%, and why it is low

the wisher ruled "never retried" for the drain; a deliberate human re-run was not asked about.

## .where

`src/domain.operations/radio/record/setRadioTaskRecordFromPush.ts` — `isRequeue`

## .verdict

open
