# F19: the shared cli parser keeps an empty value as an empty string

## .the fork

- **A, taken:** `getCliArgs` reads `--flag ''` and `-f ''` as `''`. every contract gets the fix
- **B:** revert the parser; read the empty body inside the push contract alone

## .why A, at the time

on `origin/main` the check `next && …` read an empty value as absent, so `--flag ''` became `true`. that defect sits in the shared parser, and B would patch around it in one contract (`rule.forbid.workarounds`).

what the 13 calls in `src/contract/cli/` see:

- a string flag: `''` was `true`, which zod rejects with a type error that does not name the empty value. now it is `''`, and each contract's own check reads it
- a boolean flag: no caller passes `''` to a boolean. `--flag` with no value, or one before another flag, still reads as `true`; `getCliArgs.test.ts` pins both

the push contract depends on it: `asPushTaskFromArgs` refuses a blank create body and a blank `--exid` update body (#32). B would let `--description ''` reach the record as the boolean `true`.

## .rework: clean

a two-line revert, plus a check in one contract.

## .confidence: 85%

## .where

`src/infra/cli/getCliArgs.ts`; peer round i004: enroll-impl-arch-defects blocker.1.

## .verdict

open.
