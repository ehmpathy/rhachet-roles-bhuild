# F13 · the tail journey stubs the self-review roster, never a live verdict

- **the fork**: (a) the tail journey stubs each guard's `self:` roster to one slug and drives the
  route through the bhrain driver, as the extant journeys do; (b) run the live review and mask the
  sampled verdict before the snapshot.
- **taken**: (a).
- **why**:
  - this repo's own rule `rule.forbid.live-review-rosters-in-acceptance-journeys` mandates (a):
    "an acceptance journey that promises a guard's full self-review roster live = blocker". it was
    written after one live journey made ~90 driver calls and ran 300s+ per stone suite.
  - a self-review has no "verdict" to mask: the driver promises it; bhrain checks the promise,
    the articulation path, and freshness. the stub drives that exact path once per stone — what
    is under test is the gate, and the gate is live.
  - the tail guards have `peer: []` and no judges (F5), so there is no model verdict anywhere on
    the tail to sample. option (b) has naught to mask.
  - the full rosters are read in isolation by the guards roster suite, as the rule requires.
- **rework**: clean — the journey's setup line.
- **confidence**: 95%.
- **risk if wrong**: low — a roster defect still fails the roster suite.
- **where**: `3.3.1.blueprint.product.yield.md` § the tail journey.
- **raised by**: peer `ergo-acceptance-journey-coverage` nitpick.2 (round i001), disputed to this row.
- **verdict**: disputed; the council rules.
