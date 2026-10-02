# F14 — `asRadioTreeLines` shared at two uses

- **the fork:** inline the tree render in each of the two outputs (wet) · one transformer
- **taken:** one transformer. it is a pure, named shape transform (branches → `├─ │ └─` lines)
  with no switch and no optional params — the smells `rule.prefer.wet-over-dry` names are absent.
  it has five call sites across two files (four in `asRadioPushOutput`, one in `asRadioHeldOutput`)
  — past the rule of three — and every one must render one tree shape; inline copies would drift
  on the glyphs a human scans
- **rework:** clean — inline it into the two callers
- **confidence:** 80%
- **where:** `asRadioTreeLines.ts`, `asRadioPushOutput.ts`, `asRadioHeldOutput`; peer r4 nitpick.1
- **verdict:** —
