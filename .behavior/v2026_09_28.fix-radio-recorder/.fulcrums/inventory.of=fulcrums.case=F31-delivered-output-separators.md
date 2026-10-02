# F31 — a delivered push keeps the extant `key: value` render

- **the fork:**
  - (a) the delivered push keeps `asTaskDetailOutput` (`exid: 414`, `via: gh.issues`), which the
    recorder's held / landed / refused trees (`task    = …`) sit beside
  - (b) move the delivered render to the recorder's `=` tree
  - (c) move the recorder's trees to `:`
- **taken:** (a). `asTaskDetailOutput` is extant on `main` and shared with `radio.task.pull`; the
  recorder adds one `recorded:` line to it and no more. (b) splits push from pull and re-snaps both;
  (c) re-snaps every held output. the two renders answer two questions — "what did upstream
  hold?" (the extant detail) vs "where is my task now?" (the recorder's tree)
- **rework:** clean — one transformer's separators, plus snaps
- **confidence:** 75%. the reviewer's point is fair: one command, two separators
- **how found:** peer r006 (ergo-snapshot-visual-blemishes) nitpick.2
- **where:** `src/domain.operations/radio/cli/asTaskDetailOutput.ts`, `src/domain.operations/radio/record/asRadioPushOutput.ts`
- **verdict:** awaits the wisher
