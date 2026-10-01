# F5 — are `--exid --status` updates recorded too

- **the fork:** record creates only · record creates and status updates (claim, deliver)
- **taken:** creates only. every piece of evidence — #319's 401, #379's six stalled tasks, #308's
  caught dream — is a **new** task that died. a blocked update loses no task: the task already lives
  upstream, and the actor re-runs the claim once the gate opens. to record updates adds a replay
  hazard (a transition someone else made meanwhile; `setPartRadioTask` refuses any move out of
  DELIVERED) that no one asked for
- **rework:** clean — updates become a second record kind later, additive; creates stand alone
- **confidence:** 70%. low because the wish reads "every push attempt is transcribed first", and a
  claim is a push attempt. the wisher may mean it literally
- **where:** dimensions D4, D6; inventory U1–U5; case=7; yield `.the contract`
- **verdict:** overruled by the wisher, 2026-09-28 — *"yeah, even status changes"*. both kinds are
  recorded and held. an update record keys on `(target repo, exid, status)` and replays in the same
  oldest-first line. the replay hazard is met by extant code: `setPartRadioTask` refuses a claim onto
  another branch's claim and any move out of DELIVERED; the recorder closes such a record as
  **refused**, loud, never retried (case=7)
