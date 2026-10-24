# F29 — `phone.daemon set` exit 1 on an unconfirmed start is proven below the cli, not at it

## .the fork

`phone.daemon set` exits 1 when a spawned daemon shows no live lock within the start wait. the
acceptance journey can only reach that exit if the real daemon fails to start.

- **A (taken)**: prove the outcome where the spawn is injected (`genPhoneDaemon.integration.test.ts`
  case2: a spawn that exits at once → `UNCONFIRMED`, no lock, the start logged), prove the render in
  `asPhoneDaemonOutput.test.ts` case5, and leave the one-line map `UNCONFIRMED → exitCode 1` in
  `phoneDaemon.ts` without a cli test
- **B**: add a production knob (an env var that names the daemon program) so a journey can force
  a start failure through the cli

## .taken, and why at the time

B puts a lever in the shipped skill whose only job is to break delivery. a stray env on a grove
would then stop every text in a tree, quietly — a safety cost for one asserted exit code. the
logic that decides UNCONFIRMED lives in `genPhoneDaemon`, and that is now tested with a real spawn.
what A leaves unproven is one `if` that maps an outcome to an exit code.

## .rework

clean. the knob, if the council wants it, is one env read in `getPhoneDaemonProgram` plus one
journey step; no caller hardens against its absence.

## .confidence — 75%, low because

the strictness brief wants every variant a caller can hit proven at the contract, and an exit code
is only observable there.

## .where

`src/contract/cli/phoneDaemon.ts` (`if (outcome === 'UNCONFIRMED') process.exitCode = 1`), raised by
r10 n3 at 5.3 i004.

## .verdict

(open — for the council)
