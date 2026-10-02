# F25 — the shape of `domain.operations/radio/record/`

- **the fork:** a flat `record/` dir, with `setRadioTaskRecordUpstream` that builds its three
  settle fates inline (as shipped) · split `record/` into clusters (write, drain, fault, gate,
  output) as `task/` did, and extract each settle fate to a pure `asRadioFate*` transformer as
  the two held-fate writes do
- **taken:** flat, inline. the three settle branches each pair one write with one fate and read
  top-down as a narrative; extraction would add three transformers used once (wet-over-dry). the
  flat dir keeps every recorder op findable by one prefix while the feature is young
- **rework:** dirty — a move of ~50 files rewrites every import in the recorder and its tests;
  a large move smuggled into a feature diff hides the feature in review. deferred as a dream
- **confidence:** 70%. `task/` is precedent that a split pays off once the dir settles
- **where:** i006 r011 nitpicks 3 and 5; dream
  `dreams/2026_09_29.cluster-the-radio-record-dir.dream.md`
- **verdict:** —
