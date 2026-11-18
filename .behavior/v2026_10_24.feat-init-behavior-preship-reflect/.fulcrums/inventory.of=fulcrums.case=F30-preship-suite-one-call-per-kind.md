# F30 · preship runs the suite one call per kind, and a suite cut-off counts as a try (5.1 peer i008 r010 blocker.2; ratification asked at 5.3 peer l3 enroll-verif-test-intent i004 blocker.2)

## .the fork

- (a) keep two suite calls (`--what types,format`, then `--what all`) and three free re-runs of a
  cut-off suite, as the blueprint wrote
- (b) one call per kind (types+format, lint, unit, integration, acceptance), no `--what all`; a
  suite killed by the tool counts as a try, and a suite moved to the background is awaited. only
  the watch re-runs a cut-off free

## .taken

(b), disputed: the criteria in `templates.tail` case1 changed with it, so the council ratifies.

## .why, at the time

- measured at 5.1 (peer i008 r010 blocker.2): one serial `--what all` run took 1190s, past the
  tool's 600s cap, so under (a) a driver could never see the suite finish in one call.
- a killed suite restarts from zero, so a "free" re-run of it bought naught but the same kill;
  the watch alone resumes remote state, so only its re-run is free.
- the change is to the template's prose and the test that pins it, in one move; no assertion was
  dropped without a stricter one beside it (`not.toContain('--what all')`, the kill and the
  background arms asserted by text).
- the stale vision line that still said `--what all` (`1.vision.yield.md`) is fixed at 5.3.

## .rework

clean — the template text and its case1 pins.

## .confidence

90% — a council may prefer the blueprint's two calls with a longer tool cap.

## .where

`src/domain.operations/behavior/init/templates/6.preship.stone`;
`src/domain.operations/behavior/init/templates.tail.integration.test.ts` case1.

## .verdict

open — for the council.
