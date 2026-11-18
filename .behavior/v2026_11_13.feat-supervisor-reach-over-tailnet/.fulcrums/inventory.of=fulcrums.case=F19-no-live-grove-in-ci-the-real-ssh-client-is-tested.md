# F19 — no live grove in ci; the real ssh client is tested, the live grove is 5.3

## .the fork
review 3 (mech-external-contracts, blocker 2) asks for an automated test that reaches a real
grove over ssh, since the wake and send suites stub the `ssh` binary.

choices:
- (a) an integration test that dials a live grove from ci
- (b) automate every part of the contract that a hermetic run can reach with the real ssh client,
  and prove the live grove leg in the 5.3 capture

## .taken — (b)
- a ci runner is not a tailnet peer and holds no camper key, so a live dial from ci fails for a
  reason that is not the code under test. to make it pass would put a grove key and a tailnet auth
  key into ci for one test
- the real ssh client runs, unstubbed, in three suites: `saturation.reach [case1]` and
  `[case2][t0]` (real ssh to a loopback port with no listener, so ssh's own `Connection refused`
  drives the verdict), and `git.grove.list [case3]` (real tcp to three listeners: an ssh banner, a
  mute accept, an http banner)
- the aws leg now has its real call: `wake.tailnet [case6][t4]` hands the real aws cli a key the
  real sts refuses, and the wake halts at the account guard before any start
- the live grove leg — wake, send, read, boot over the tailnet, as camper, on the hetzner grove
  and an ec2 grove — is captured verbatim in `appendix/5.3.verification.live.md`. each stubbed
  suite cites it in its `.real` line

## .rework — clean
a live-grove suite gated on a tailnet peer + key would sit beside the stubbed ones; no shipped
file changes.

## .confidence — 80%
the 20%: a reviewer may hold that a manual capture never stands in for a test, whatever ci can
reach.

## .where
`git.grove.wake.tailnet.integration.test.ts`, `git.grove.send.integration.test.ts`.

## .verdict
disputed, council awaited.
