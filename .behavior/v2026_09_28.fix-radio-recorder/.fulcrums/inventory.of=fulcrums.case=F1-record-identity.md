# F1 — record identity before an exid exists

- **the fork:** key a held record by `(target repo, title)` · or by a local uuid · or by a content hash
- **taken:** `(target repo, title)` — `RadioTask.unique` already declares it, and upstream findsert
  already matches on it. one identity, both sides, so X2 needs no new key
- **rework:** clean — the key is internal to the record file name
- **confidence:** 90%. low part: two distinct tasks with one title collapse into one. the upstream
  already collapses them the same way, so the recorder adds no new loss
- **where:** 1.vision.yield.md `.the contract`; inventory C5, C11
- **verdict:** —
