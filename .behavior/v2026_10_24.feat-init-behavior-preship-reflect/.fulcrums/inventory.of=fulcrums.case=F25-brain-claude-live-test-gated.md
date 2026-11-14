# F25 · the brain.claude live test stays gated by #605 (5.1 peer, ergo-friction-hazards i003 blocker.3)

## .the fork

- (a) un-skip the brain.claude live test in this pr
- (b) keep the gate on #605; the test un-skips when its cause is cleared

## .taken

(b), disputed.

## .why, at the time

- the cause is a credential, not code: the ehmpath/test key's account cannot serve the brain ids
  the test names (diagnosed on this branch in `8a67962`, with `rhx brain.claude.probe`). the
  probe prints the verdict per brain and never the key.
- a credential is a human-only lever: the keyrack owner fixes the account; a driver cannot. the
  rule's "get them, or fail the gate" is honored by #605, which names the fix and its owner, and
  the gate re-enables the test the moment the account serves the ids.
- un-skipped now, the suite is red on a cause this pr cannot change, which hides every other red.
- the tail's own brain prescriptions are clamped without the api: `initBehaviorDir.brain`
  (each stone's brain, by bhrain's own walk) and `templates.tail` (each tail guard's `brain:`).

## .rework

clean — remove the gate once #605 closes.

## .confidence

85% — a council may rule a credential gap blocks this pr outright; the human who holds the key
decides.

## .where

`src/domain.operations/behavior/init/initBehaviorDir.brain.claude.integration.test.ts`; #605.

## .verdict

open — for the council.
