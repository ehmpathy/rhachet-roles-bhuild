# F21: the beaver token is a human handoff

## .the fork

- **A — hold 5.1 on it.** treat the 16 radio tests that need `EHMPATH_BEAVER_GITHUB_TOKEN` as an execution defect of this branch
- **B — hand it to the human at 5.3.** the tests predate this branch and touch none of its files; the absent credential is a keyrack fill only a human can make

## .taken, and why

B. the driver holds no lever on a keyrack fill (`rule.always.spend-own-levers-before-escalation`: an `absent` credential is a human lever). the radio suites test the dispatcher role, not the vision; this wish neither adds nor edits them. 5.3 names the handoff with its exact command: `rhx keyrack fill --owner ehmpath`.

## .rework

clean. once the token is filled the suites run unchanged.

## .confidence, and why it is low

85%. the one doubt: a CI host may lack the token too, which would turn a host handoff into a red CI that this pr must still clear.

## .where

`src/access/daos/daoRadioTask/*.integration.test.ts`, `blackbox/role=dispatcher/*`

## .verdict

ruled by the director, 2026-11-08: B is reversed in its handoff, not its scope. a `*_GITHUB_TOKEN`
is never a human ask, and ci is the gate, never a local suite: ci holds its own secret for the
radio tests. the 16 run on the pr's ci; a red there is this branch's to fix, a green clears the
5.3 halt, and `has-all-tests-passed` cites that ci run.
