# F10 — the worktree's upgrade diff stays out of this route

## .the fork

the worktree holds an upgrade diff this route did not write: `.husky/check.timestamps.sh`, `.husky/check.timestamps.lock.sh`, `.husky/check.secrets.sh`, `.husky/check.lockfile.sh`, `.husky/check.nvm.sh`, `.husky/pre-commit`, `.gitattributes`, `package.json`, `pnpm-lock.yaml`, and the actor's `settings.of.repo.json`. the review scope is `since-main` on the worktree, so the lanes read it. six concerns land there in round 1: r1.blocker1, r2.nitpick3, r6.blocker5, r6.blocker6, r8.nitpick2, r9.nitpick1. round 2 re-raises two as blockers: r6.blocker1 (the secret scan's lost grep rc) and r6.blocker2 (the lock's unchecked disk-hash read). both are real defects of the practice's files, and both go upstream as `.dream/v2026_11_26.reseed.husky-secret-scan-and-lock-read-failhides.md`.

- A: repair those files in this route
- B: leave them; this route commits only its own files, so none of them ship here

## .taken

B:
- the wish names `git.crew.move` and the bar. the upgrade diff is a declapract hook change that sits in the worktree from before this route was bound
- `check.timestamps.sh` carries its own lock (`check.timestamps.lock.sh`, a pinned blob id): a hand edit here halts every commit, and its header forbids an exemption by design. that diff's owner decides the `.eco/*` question with the rule's author, not this route
- the yield records it: "this route leaves those files out of its commit"

## .rework

clean — the commit stages named paths only; the upgrade diff stays in the worktree untouched.

## .confidence — 90%

the risk: the upgrade diff is never committed by anyone. it stays visible in `git status`, and its owner is the next upgrade run.

## .where

the files above; the commit step of this route

## .verdict

open
