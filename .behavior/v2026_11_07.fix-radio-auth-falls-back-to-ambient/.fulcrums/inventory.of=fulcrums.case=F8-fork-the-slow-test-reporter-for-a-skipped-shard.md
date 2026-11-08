# F8 — fork the slow-test reporter so a fully skipped shard passes

## the fork

ci on #658 is red on two `explicit` acceptance shards (`skill.review.deliverable`, `skill.review.behavior.caseValidBehavior`). each holds one file, all `describe.skip` (the skill shells `claude`, absent in ci). the practice's `.github/workflows/report-slow-tests.sh` reads that zero wall-clock span as jest schema drift and exits 1 (handoff item 2).

- (a) fork the reporter in this tree: a shard where no test passed or failed is stated and exits 0; the drift check still binds every shard where a test ran
- (b) provision `claude` in ci, so the suites run
- (c) wait for upstream `ehmpathy/declapract-typescript-ehmpathy#788`, which names this exact defect

## taken: (a), and why

- the director chose (a) for the twin defect from the same practice upgrade and the same upstream issue (F5, seed S2), and set the outcome as #658 green
- (b) is a credential and infra call; (c) leaves #658 red
- the fork is one guard plus a header note, clamped by `.github/workflows/report-slow-tests.integration.test.ts` (4 cases, 13 thens): red on the practice's reporter (3 failed), green on the fork (13 passed)

## rework

clean: delete the guard and the header note, or take #788's apply, which rewrites the file.

## confidence

85%. lowest on whether the director wants a second practice file forked under S2, or wants it held as a red for #788.

## where

- `.github/workflows/report-slow-tests.sh`
- `.github/workflows/report-slow-tests.integration.test.ts`

## verdict

open — best-guessed under S2; flagged for the director.
