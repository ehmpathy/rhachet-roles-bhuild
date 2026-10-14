# F13 — the gate exempts `.eco/*`, the prioritizer's data store

## .the fork

once `check.timestamps.sh` ran in this repo's pre-commit, `ecowork.commit.integration.test.ts`
[case46] went red: the eco store writes `createdAt` / `updatedAt` as iso datetimes into
`.eco/priority.csv`, a plaintext file the prioritizer means to commit. the gate refuses it.

- **A — exempt `.eco/*` in the gate** (one `case` arm), and name the store a sanctioned home in
  the brief. the test's own failure message prescribes exactly this arm.
- **B — the eco store writes datestamps**, or drops its stamps. a data-contract change in another
  role, with a migration of stores already in consumer repos.
- **C — leave the copy byte for byte** and leave [case46] red.

## .taken — A, and why at the time

- the prioritizer authored [case46] for this exact gate and wrote the fix into its message: a
  store row's `createdAt` is a fact of the data, not churn from a rerun
- B ripples into a published role's store contract and every consumer store — dirty, and out of
  this wish's bounded scope
- C ships a red suite

## .rework

clean. drop one `case` arm and one brief row, or lift the arm into declapract upstream so the
copy returns to byte for byte.

## .confidence — 75%, and why it is low

- the wish says "never write a timestamp into a tracked file"; the store is a tracked file. a
  wisher may read the eco store as a violation to fix (B), not a home to exempt (A)
- the copy is no longer byte for byte with declapract main (F11); the arm carries a note that
  names the deviation

## .where

- `.husky/check.timestamps.sh` — the `.eco/*) continue ;;` arm
- `.agent/repo=.this/role=any/briefs/rule.forbid.timestamps-in-tracked-files.md` — the sanctioned
  homes table

## .verdict

(awaits the wisher)
