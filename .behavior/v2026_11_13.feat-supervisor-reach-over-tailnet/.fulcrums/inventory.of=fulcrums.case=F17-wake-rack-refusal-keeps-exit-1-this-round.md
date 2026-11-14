# F17 — the wake's rack refusal keeps its extant exit 1 this round

## .the fork
a live ec2 wake (5.3, review 6) refused at the rack with `✋ the rack did not hand over …` and
exit 1. an absent credential is the caller's to fix, so `rule.require.exit-code-semantics` owes 2,
and the glyph already says caller.

choices:
- (a) flip the arm to exit 2 with a `✋ ConstraintError:` header, in this pr
- (b) keep exit 1, catch the flip as a dream with a caller audit

## .taken — (b)
- exit 1 is extant on main, and vision case=5 promised to keep it
- the caller audit (review 8) found no caller that branches on the wake's exit — every
  `git.grove.wake` hit in `src/**/*.sh` is a hint or a comment, and no `.ts` outside tests calls it
  — so the flip is clean, and it was written: two lines, and `[case3]` set to expect exit 2
- it could not be proven: every integration run unlocks the test keyrack, whose sso prompt went
  unanswered twice. an unproven flip is not shipped; it was reverted to the pushed, tested head
- dream: `2026_11_14.fix-wake-rack-refusal-exits-1-behind-a-constraint-glyph` (its caller audit
  is now done; the fix is the two lines and the clamp value named there)

## .rework — clean
one exit code, one header, one clamp value, one snapshot; plus the caller audit the dream names.

## .confidence — 85%
the 15%: a reviewer may read the flip as small enough to ride this pr.

## .where
`src/domain.roles/supervisor/skills/git.grove.wake.sh`, the keyrack leg; `wake.tailnet [case3]`.

## .verdict
best-guessed, by the driver, in 5.3.
