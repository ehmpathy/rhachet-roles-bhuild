# F11: the uncommitted `.husky` / `package.json` / lockfile edits are not this route's, and stay out of its pr

## .the fork

- **A, taken:** leave the edits as found — unstaged, uncommitted, untouched; answer reviewer points on them as out of scope; stage only this route's files
- **B:** repair the edits (restore the `.eco/*` exemption, the `fix:` line, the lock's `$0` and `hash-object` guards) as part of this pr

## .why A, at the time

`.husky/check.timestamps.sh`, `.husky/check.timestamps.lock.sh`, `package.json`, and `pnpm-lock.yaml` held a partial declapract upgrade before this route began (the session's opened `git status` lists them; recorded in the execution yield's local environment notes). no stone of this route touched them, and the pr will not carry them. a reviewer bound `since-main` reads the worktree, so it sees them; a fix here would ship another author's half-done upgrade under #675's name, or rewrite work its owner has not finished.

## .rework: clean

the edits are not staged; no file of this pr depends on them. their owner finishes or reverts them apart from #675.

## .confidence: 95%, and why not higher

the edits' owner is not named in the worktree; if the commander means them to ride this pr, that is a one-line instruction and a separate review.

## .where

execution yield, `local environment notes`; peer round i001: repo-rules blocker.1 + nitpick.1, ergo-friction-hazards blocker.3, arch-hazards-behavior nitpick.2, arch-hazards-maintenance nitpick.2.

## .verdict

open.
