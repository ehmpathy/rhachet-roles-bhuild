# F21 — a send that races `phone.daemon del` is deferred to a dream

## .the fork

- **A (taken)**: ship as is. a text sent mid-stop stays QUEUED until the next send, and that
  sender's output reads `LIVE`. caught as the dream `2026_10_22.phone-daemon-stop-race-wakeup`
- **B**: add a STOPPING lock state and a bounded wait to the daemon lifecycle in this delivery

## .taken, and why at the time

r007 graded it a nitpick: a delay, never a loss. B adds a lock state, a wait, and a race test to
the lifecycle, and lands as the director's depth-0 l3 pass is due. an artifact edit now re-opens
every cached lane.

since i006, `phone.text get` ends with `daemon: DOWN — the QUEUED texts wait for it` and its cure
whenever a QUEUED text has no live daemon, so the stall this race leaves is visible to the sender.

## .rework

dirty for this round (a lifecycle state and its race test); clean as its own follow-up.

## .confidence — 75%, low because

the sender's output makes a promise the code does not keep in this window, which is a behavior
claim a council may want fixed before release.

## .where

`src/domain.operations/phone/daemon/{genPhoneDaemon,runPhoneDaemon,delPhoneDaemon}.ts`. raised by r7
nitpick.1 at i005.

## .verdict

(awaits council)
