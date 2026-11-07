# F19 — the critical path is proven in-process with a fake rhachet boundary; the live demo is a playtest

## .the fork

- **A (taken)**: the send → deliver → reply path runs as an integration test on two real temp trees
  and real mailbox files, with a fake (not a mock) at the one `rhx clone say` / `clone list`
  boundary. the real boundary is proven by `sdkRhachetClone.integration.test.ts` (real rhachet: an
  empty roster, a say to an absent clone) and by the acceptance suite (real built skills). the
  live two-clone delivery is the byhand playtest
- **B**: an automated test that enrolls two real clones and texts between them

## .taken, and why

B can not run here. rhachet refuses an enroll past its depth budget
(`invokeEnroll` → `ConstraintError('clone enroll depth budget spent')`), and this suite runs inside
a clone. to strip the depth env key to get past it would evade the budget, not satisfy it. and a
real clone is a live brain: each test run would boot paid sessions, with credentials ci does not
hold. the wish asks *"critical path, demoed in a test"* and *"integration, no mocks"*; A demos it in
a test, and the fake stands only where a live clone can not.

## .rework

clean — a later delivery adds a live harness (two clones booted by a human, or a rhachet test
seam) without a change to the phone's code.

## .confidence — 60%, low because

the vision's goals table says *"two real trees and real clones"*. only the wisher can rule that the
fake boundary plus the playtest meets it.

## .verdict

(awaits council) — raised by r8 blocker.1 and nitpick.2 at the i001 absorb, and again by r8
blocker.1 at i003. the i003 reviewer adds a fair point: the depth budget binds only inside a clone;
a test run from a top-level shell or ci starts at depth 0 and could enroll two clones. what then
remains is the cost (two paid brain sessions per run) and the ci credentials.

ruled by council (robot:director, rhachet-ktlo), 2026-10-22: **the best guess stands.** the fake
rhachet boundary proves the critical path in-process; the live two-clone demo is the byhand
playtest. no live two-clone suite is owed. r8 blocker.1 + nitpick.2 are answered by this verdict.
