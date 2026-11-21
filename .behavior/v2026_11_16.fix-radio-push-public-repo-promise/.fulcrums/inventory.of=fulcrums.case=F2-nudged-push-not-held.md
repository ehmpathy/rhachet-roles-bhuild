# F2: a nudged push's own record is dropped; a drained one is held

- **the fork:** (a) halt before the record · (b) record, hold it QUEUED · (c) record, then drop it
- **taken:** (c) for the push's own record; held for a record met by a drain.
  - (b) fails when the caller scrubs the title: the create key is `create\nrepo\ntitle`, so the
    re-run makes a new record and the nudged one lingers, set aside again by every drain
  - (a) breaks the "records every push first" guarantee and needs a second gate site in the cli
  - (c) keeps one gate site; a same-title re-run re-queues the dropped record
    (`isRadioTaskRecordRequeuedByPush.ts` L29–31), a new-title re-run leaves no stale one
  - a drained record's pusher is absent, so it waits for `drain --promise`, held
- **rework:** clean — one status in the push's post-drain step
- **confidence: 85%** — the drop is provisional by design (`queue del` says so), so a lost task is
  not possible: the nudge names the re-run, and a re-run re-queues
- **where:** the push cli, after `getOneRadioPushDrainWithBacklog`; the gate in `setRadioTaskRecordUpstream`
- **verdict:** ruled as best-guessed, by the director at 1.vision approval
