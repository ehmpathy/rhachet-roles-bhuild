# F11 — the heldSeq mint skips an unreadable record without a notice; left as is

raised by the mech-failhides peer, 5.1 round 1, nitpick.1.

## .the fork

- **A** leave `getAllReadable` as main has it: a MalfunctionError on one record file skips that
  file at the mint; every other error rethrows
- **B** add a notice at the mint that names the skipped file

## .taken — A, and why at the time

- out of this pr's diff: `getAllReadable` (`src/access/daos/daoRadioTaskRecord/index.ts`) is main's
  code; this branch changes one line of that file, the `kind` enum, to admit `comment`
- not a failhide by design: the skip is allowlisted by class, every other error rethrows, and the
  doc beside it names why — the drain re-reads each record strictly and fails loud on that very
  file, named, with its fix (the dispatcher readme: "a record file that cannot be read fails loud,
  named, with its fix, and is never skipped"). the peer grants it meets the letter of the rule
- B prints from a mint that every push and comment runs, so one bad file would echo on every call
  while the drain already halts on it with the fix

## .rework — clean

one line in `getAllReadable`, no contract change.

## .confidence — 85%

## .where

`src/access/daos/daoRadioTaskRecord/index.ts`, `getAllReadable`.

## .verdict

open
