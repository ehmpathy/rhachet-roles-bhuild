# F5 — 11 fixtures the source never tests get their tests written here

## .the fork

of 40 new pane fixtures, 11 are named by no source test — cited only by a brief as evidence. the
wish assumed every fixture is test corpus, and says a fixture that moves without its test does not
count.

- **A.** promote all 11, and write the missing test case for each in the package (the cure is in the
  ported code; the fixture captures the pane; only the test is absent)
- **B.** leave the 11 in nheuron; promote 29
- **C.** promote all 11 untested (violates the wish and case 8's clamp)

## .taken — A, and why

each of the 11 is a real production misread whose cure ships in the ported shell code. B ships the
cure with no clamp; A ships the cure *and* the clamp nheuron lacks. the source gap is reported in
the yield with evidence (the wish forbids an edit to nheuron from this tree).

## .rework — clean

per fixture: one test case; or, if a cure cannot be located in the code, that one fixture falls back
to B with a reason.

## .confidence — 80%, and why it is low

i have not yet confirmed that each of the 11 cures exists in code (vs a fixture captured ahead of a
fix that never landed). execution checks each; a fixture with no cure in code stays in nheuron.

## .the 11

`pane.auth.login-expired-under-an-approval-gate` · `pane.box.typed-human-text-classified-unknown` ·
`pane.cap.login-success-after-picker-read-as-limited` · `pane.cap.session-limit-banner-read-as-turn-ended-with-box` ·
`pane.cap.weekly-limit-picker-omitted-from-healable` · `pane.frozen.live-streaming-turn-read-as-frozen` ·
`pane.husk.false-positive-under-width-mismatch-smear` · `pane.park.interrupted-turn-classified-on-the-cap-axis` ·
`pane.park.nudged-clone-on-a-finished-route-reparks` · `pane.park.reviewer-malfunction-read-as-limited-with-no-cap-in-pane` ·
`render.poll.healable-absent-seat-suppresses-the-husk-cure`

## .verdict

**upheld by the wisher, 2026-10-12: A.** write the 11 tests here. a fixture whose cure is not in
code stays in nheuron, with the reason in the yield.
