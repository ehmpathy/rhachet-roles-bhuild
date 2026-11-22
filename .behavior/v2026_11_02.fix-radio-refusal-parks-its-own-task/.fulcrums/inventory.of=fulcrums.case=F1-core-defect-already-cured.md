# F1 — the core defect is already cured on main; build only the gap

- **the fork**: (a) rebuild or re-clamp the park-and-deliver-past behavior the wish describes ·
  (b) cite #605 as the cure, prove it green, and build only what main still lacks · (c) halt and
  ask the wisher whether the wish is moot
- **taken**: (b). `isRadioUpstreamReasonHalt` halts only on `upstream:rate-limit` and
  `upstream:transient`; `asRadioUpstreamReason` reads `Resource not accessible by integration
  (updateIssue)` as `upstream:access`; a set-aside record lets the line move. every measured
  wedge (#511 10-20 and 10-29, #551 10-22, #591 10-23) predates #605's merge (2026-10-31,
  v0.24.0). `setRadioTaskRecordsDrainedByPush.case9.integration.test.ts` [case1] holds that exact
  stderr on `issue edit`: run 2026-11-02, 39 passed
- **rework**: clean — if the wisher wants a new clamp of the cured path anyway, it is one more
  `given` in case9
- **confidence**: 70% — two doubts. (1) the wish says "**today** a held edit of rhachet#673
  fails each push" and "9 later dispatches"; no issue text traces those figures (#551 says ten
  into six repos; #511 names #673 on 10-29), so the measurement may be fresh, from a tree on
  v0.24.0+. (2) the clamp that holds the cure (case9 [case1]) differs from the wish's shape: its
  records carry an auth, where #511 says the #673 record holds `auth: null`
- **the check that settles it**: execution's first act is a reproduction of the wish's exact
  shape on main — a null-auth upsert of an extant issue, refused `updateIssue`, at the head; nine
  records behind it across repos; then a carrier push. green → F1 holds, and the reproduction
  joins the clamps. red → F1 flips: the vision's case=1 becomes the fix, and the real cause is
  diagnosed before any code moves
- **where**: `src/domain.operations/radio/record/isRadioUpstreamReasonHalt.ts:8`,
  `asRadioUpstreamReason.ts:64`, `setRadioTaskRecordUpstream.ts:176-201`
- **the check, as run**: case9 [case8] — an upsert edit at the head refused `updateIssue`, nine
  records behind it across five repos, then a carrier push. green on main (4 passed); red (3
  failed) with `upstream:access` added to the halt rule; green again once restored. the derive
  is pinned to an env token: a `null`-auth record derives the keyrack default, and a failed
  derive is set aside with `halt: false`, so neither auth path halts
- **verdict**: settled by measure — F1 holds (95%); the doubt left is whether the wisher's tree
  ran v0.24.0+, which only the wisher holds
