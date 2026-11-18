# F29 · the robot-token tests run in ci and are gated off a fleet host (5.3, the director's verdict; 5.3 peer l3 enroll-verif-test-intent i004 blocker.1)

## .the fork

- (a) the cases authenticate `--auth as-human`, so they run on a fleet host
- (b) the cases fail loud with a `ConstraintError` where the robot token is absent
- (c) a named gate, `RUN_GITHUB_ROBOT_TEST`: on in ci (which holds the token), off on a fleet host

## .taken

(c), disputed.

## .why, at the time

- the director's verdict (2026-11-17), verbatim: "no github token key is owed by the fleet; a
  github write goes through --auth as-human, so a keyrack set of EHMPATH_BEAVER_GITHUB_TOKEN will
  not come. outcome owed: 5.3 passes with each red that keys on a provisioned github token cured
  in this tree (the test reads auth the way the skill does at runtime, or it is gated off the
  default run)". (c) is the second option it names.
- (a) writes real issues from a test under a human's github identity, every run, and ci has no
  human login to write with. F19 already ruled out a public write under a human's name.
- (b) turns every fleet-host run red on a key the director said will never come, so a red there
  could no longer mean aught.
- ci holds the token (`.agent/keyrack.yml` `env.test`, via the keyrack firewall) and sets
  `GITHUB_ROBOT_LIVE: 'true'` on both shard jobs, so the real writes still run on every pr.
  `RUN_GITHUB_ROBOT_TEST.integration` clamps that flag (red when one job drops it, proven). if the
  token were absent in ci, the gated cases there would go red, so ci itself proves it reads.

## .rework

clean — swap the gate for (a) or (b) in four files.

## .confidence

85% — a council may hold that a skip on any host breaks `rule.forbid.failhide`.

## .where

`src/.test/utils/RUN_GITHUB_ROBOT_TEST.ts`, `blackbox/.test/infra/constants.ts`,
`.github/workflows/.test.yml`, and the three gated test files.

## .verdict

open — for the council.
