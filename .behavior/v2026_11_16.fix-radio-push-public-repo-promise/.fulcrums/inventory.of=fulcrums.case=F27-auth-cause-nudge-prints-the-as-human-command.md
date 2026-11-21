# F27: the auth-cause nudge prints the `--auth as-human` command, not the `--promise` one

## .the fork

a push whose visibility read fails on auth (401, not-found under a robot token) cannot tell public from
private. the nudge prints one command to copy. the fork:

- **a.** print the push with `--promise` (works on a robot-only host, but vouches a text for a repo that may be
  private, and teaches the promise as the cure for an auth fault)
- **b.** print the push with `--auth as-human` (the cure: a human read learns the true visibility; a private
  repo then sends with no promise), and name the `--promise` path as its peer branch

## .taken: b, and why at the time

- **catalog #38 rules it:** "the fix lines lead with `queue set --auth as-human`, the cure, before the promise"
- **the cause is auth, not text.** a promise there would send to a repo whose visibility no one has read
- **the robot-only path is printed, as the peer branch after `first:`:** `or, with no human login or a public
  repo: check the text, then add --promise task-to-public-repo-is-anonymized instead`

## .rework

clean. `asRadioPromiseNudgeOutput` picks which flag the printed command carries; one branch.

## .confidence, and why it is low

80%. a robot-only clone, the common host for this fault, must hand-edit the command.

## .where

`src/domain.operations/radio/record/asRadioPromiseNudgeOutput.ts`; journey [case8][t3]
