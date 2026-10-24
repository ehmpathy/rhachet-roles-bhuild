# F12 — the `work.harness` driver-timeout fix rides in this pr

## the fork

the first full integration run at 5.3 failed 4 `ductwork.verbs` [case1] tests; alone the file passed
70/70. the cause sat in `work.harness.ts`, a file this wish never named.

- **A.** fix it here, with a clamp
- **B.** dispatch it to its own pr and leave this suite red until then

## taken: A, and why at the time

the stone forbids a carried failure, and the fix is safe and clean: one test-harness file, no prod
code. a driver the 30s timeout killed came back as `exit 1`; now it throws a `MalfunctionError` with
its streams, and the bound is 60s, under the 90s hook. clamp: `work.harness.integration.test.ts`,
proven red with the old `?? 1` read, green with the fix. the `suitesPorted` census moved 23 → 24.

## rework: clean

the change is local to the harness and its census row; a revert is two files.

## confidence: 85%, and why it is not higher

the 60s bound is sized from one measured run (208s for the file under load), and the flake is not
yet reproduced as a timeout — the old harness hid which it was. the fix makes the next occurrence
name itself.

## where

`src/domain.roles/supervisor/skills/work/work.harness.ts` · `work.harness.integration.test.ts` ·
`suitesPorted.integration.test.ts`

## verdict

(awaits the council)
