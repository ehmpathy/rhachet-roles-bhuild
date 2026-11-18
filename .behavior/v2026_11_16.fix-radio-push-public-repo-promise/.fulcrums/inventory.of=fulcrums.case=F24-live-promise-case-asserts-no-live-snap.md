# F24: the live real-github promise case asserts its lines, with no live snap

## .the fork

`skill.radio.task.push.via-gh-issues.acceptance.test.ts` [case10] pushes into the real public demo repo, once
without `--promise` (nudged) and once with it (delivered). the fork:

- **a.** mask the title, date, and exid, then snap both outputs live, as [case7] and [case8] do
- **b.** assert the load-central lines live (the repo read as public, the last line carries `--promise`, exit 0
  on the vouched re-run, the issue created), and leave the nudge's layout to the stub journey's snap

## .taken: b, and why at the time

- **a snap no host here can write.** [case10] needs the robot token. this host lacks it; `as-human` is refused by
  the test-env guard; ci runs `jest --ci`, which fails on an unwritten snap. a snap added now ships as a red ci
  run, with no host able to make it green
- **[case7] / [case8] differ in kind.** both are failure paths (an unset env token, a rejected token). each runs
  with no valid token, so any host writes its snap. [case10] is a success path, so it needs the token
- **the suite's own contract keeps the live happy path out of snaps.** its header (L657–662): *"the live happy
  path (a real push) has non-deterministic output … so it is asserted in the credential-gated cases above, not
  snapshotted."* [case10] follows that extant rule
- **the layout is snapped.** the nudge renders from one transformer whatever the visibility source. the stub
  journey (`skill.radio.task.push.promise.acceptance.test.ts`, J1) snaps that layout for a PUBLIC read. the live
  case proves the one fact a stub cannot: real github reads public and the gate holds the send

## .rework

clean. once a host holds the robot token: wrap [case10]'s two outputs in a mask (title → `<title>`,
exid → `<exid>`), add `toMatchSnapshot()`, and run once with `--resnap`. one file, no contract change.

## .confidence, and why it is low

75%. the rule reads *"non-deterministic outputs are MASKED, then snapped live — never carved out"*, and a
reviewer may hold that the credential wall excuses the absent snap no more than it excuses an absent test. the
counter-weight: a snap that cannot be written is a red ci run, which is worse than a line assertion.

## .where

`blackbox/role=dispatcher/skill.radio.task.push.via-gh-issues.acceptance.test.ts` [case10]

## .verdict

reversed by the driver at 5.3 i003, on evidence the reviewers supplied. the premise *"no host can make it
green"* was false:

- `jest --ci` refuses only to CREATE a snap; a committed snap is compared
- ci holds the robot token (`.github/workflows/.test.yml`: the keyrack firewall hydrates it into the acceptance
  shards), so [case10] runs there and compares the snap

so the masked snaps were authored by hand: [t0]'s bytes from the stub walk (`rhx radio.walk.promise`, path A, with
the `--auth` word dropped, since [case10] uses the default auth), [t1]'s from the same walk's created tree. masks:
title ts, exid, `pushedBy`, `pushedAt`. ⚠️ the first ci run is the proof: a byte the walk could not reproduce
(the default-auth path itself) shows as a snap diff in the ci log, to fix from there.
