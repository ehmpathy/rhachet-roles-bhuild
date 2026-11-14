# F12 — the local `.husky` / `.gitignore` / `.gitattributes` drift stays out of this pr

raised by the repo-rules peer, 5.1 round 2, blocker.1.

## .the fork

- **A** leave the drift unstaged; commit only this route's paths by name
- **B** fold the drift into this pr and restore the `.eco/*` arm the drift dropped
- **C** revert the drift on disk

## .taken — A, and why at the time

- the drift is a declapract template change to repo hooks that this route did not author; to land
  it here smuggles an unrelated, rule-sensitive change into a feature pr (scouts honor bounds a
  ride-along fix to SAFE and CLEAN; a hook rewrite is neither)
- C discards changes this route does not own and cannot vouch for
- A keeps main's `.husky/check.timestamps.sh`, with its `.eco/*` exemption, on this branch

## .5.3 update — `.husky` set back to HEAD on disk

the 5.3 repo-rules peer read the drift as part of the diff (its scope is the work tree since main).
so the four `.husky` files now hold HEAD's bytes, and the two new drift files are gone from
`.husky/`. a byte copy of all six sits at `.temp/husky-drift/` for whoever owns the declapract bump.
`.gitignore` and `.gitattributes` stay unstaged, as before. the review then reads the branch as it
will land: main's gate, with its `.eco/*` exemption.

## .rework — clean

the commit names its paths; none of the drift files are among them. to restore the drift, copy the
six files back from `.temp/husky-drift/`.

## .confidence — 90%

## .where

`.husky/check.timestamps.sh`, `.husky/check.lockfile.sh`, `.husky/check.nvm.sh`, `.husky/pre-commit`,
`.gitignore`, `.gitattributes` (all unstaged).

## .verdict

open
