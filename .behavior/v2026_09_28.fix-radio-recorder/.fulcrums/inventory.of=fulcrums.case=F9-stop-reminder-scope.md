# F9 — the stop reminder: scope and shape

- **the fork:** leave the idle backlog to #379's own tree · pull an onStop reminder into this tree
- **ruled:** in this tree — the wisher, 2026-09-29: *"include an onStop hook that reminds to dispatch
  once radio is unblocked … small, token efficient reminder. non blocker … that way the clones remind
  the humans"*
- **shape best-guessed here:**
  - lives in the dispatcher role's empty `onStop: []` slot (`getDispatcherRole.ts:30`)
  - host skill: a `--when hook.onStop` mode on a radio skill, the pattern of
    `feedback.take.get --when hook.onStop`; the name is a blueprint call
  - reads local records + `radio.uses` only; no network
  - one line when held, naught when none; exit 0 always; never sends upstream
- **rework:** clean — one hook entry, one read-only mode
- **confidence:** 85% on shape. the open part: whether a Stop hook's stdout reaches the human in
  claude code without a block. research at blueprint (e.g. a `systemMessage` json reply)
- **where:** yield `.the contract` item 3; inventory stop row S1–S3; case=8
- **verdict:** scope ruled by the wisher; shape open to rework
