# F24 — a root runner fails the real permission case loud, never skips it

## .the fork

5.3 i001 `ergo-contract-snapshots` nitpick.7: the acceptance [case4][t4] (and now the integration
[case6] and `getOneVisionFile` [case2][t4]) throws a `ConstraintError` when the runner is root,
since chmod cannot bar root. the reviewer asks for a `skipIf` gate, or a spy.

options:

- **A — fail loud on root** (taken): the case throws, with the fix, on a root runner
- **B — `skipIf(root)`**: the case passes silently where it proved naught
- **C — a spy on the read**: portable, but `mech-test-scope-purity` blocker.1 of the same round
  forbids a spy in an integration suite where a real path exists

## .taken, and why

A. `rule.require.failfast` (test) forbids a silent skip on an absent resource, and a non-root
runner is that resource. C trades one lane's nitpick for another lane's blocker, and gives up the
real permission path. ci runs as the non-root `runner` user, so A is green there; only a root
container meets the throw, and the throw names the fix.

## .rework: clean

B or C is a one-line swap per case.

## .confidence: 80%

## .where

`blackbox/role=behaver/skill.review.vision.root-purpose.acceptance.test.ts` [case4][t4];
`src/domain.operations/behavior/vision/getOneVisionRootPurposeVerdict.integration.test.ts` [case6];
`src/domain.operations/behavior/vision/yield/getOneVisionFile.integration.test.ts` [case2][t4].

## .verdict

(unruled)
