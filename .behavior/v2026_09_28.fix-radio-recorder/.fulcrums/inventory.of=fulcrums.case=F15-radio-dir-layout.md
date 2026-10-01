# F15 — the radio domain names `.behavior/<route>/.radio`

- **the fork:** the radio domain walks `.behavior/*/.radio` itself · a behavior-domain export
  yields the route dirs
- **taken:** the radio domain walks it. `$route/.radio/` is the recorder's own store, named
  verbatim by the wish ("transcribed first into the route's `.radio/`") and ruled by the wisher (F8).
  the walk reads only `.radio` dirs the recorder itself writes; it reads no behavior-owned file.
  the one behavior-owned fact — which route is bound — enters through the contract layer
  (`radioTaskPush.ts` → `getBranchBehaviorBind`), since the r5 blocker.1 fix
- **rework:** clean — swap the `readdirSync` for a behavior export in `getAllRadioTaskRecordDirs`
- **confidence:** 75%
- **where:** `getAllRadioTaskRecordDirs.ts`; peer r5 nitpick.1
- **verdict:** —
