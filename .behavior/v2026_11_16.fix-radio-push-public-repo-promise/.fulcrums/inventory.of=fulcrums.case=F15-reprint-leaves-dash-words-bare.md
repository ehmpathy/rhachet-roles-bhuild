# F15: the reprinted command leaves a word that opens with `-` unquoted

## .the fork

- **A, taken:** `asShellWord` quotes only a value outside `[A-Za-z0-9@%_+=:,./-]`; a bare `-v` or `-` prints as is
- **B:** force quotes on any value that opens with `-`

## .why A, at the time

the shell strips quotes before the skill sees them, so `'--flag'` and `--flag` reach `getCliArgs` as the same argv entry; B changes the printed text and not one parse. the parse is what decides: `getCliArgs` reads a value that opens with `--` as the next flag, so no push can carry a title or body of `--flag` in the first place, and no nudge can be asked to reprint it. a value that opens with a single `-` (`-v`) is read as a value after a long flag, and reprints as the same argv. the round-trip test ([case13]) runs the printed command through bash, as typed.

## .rework: clean

## .confidence: 90%

## .where

`src/domain.operations/radio/cli/asRadioPushCommandWithPromise.ts`; peer round i001: ergo-friction-hazards nitpick.1.

## .verdict

open.
