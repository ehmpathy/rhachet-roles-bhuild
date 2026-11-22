# F13 — the uncommitted `.husky/` gate edits are left to their owner, not revised or reverted here

- **fork**: the peer lanes read the worktree diff since main, which holds uncommitted `.husky/` edits this route did not make (`check.timestamps.sh` without the `.eco/*` exemption, a new `check.timestamps.lock.sh`, a new `check.secrets.sh`, edits to `check.lockfile.sh`, `check.nvm.sh`, `pre-commit`, and `package.json`). (a) repair the points the lanes raise on them · (b) revert them · (c) leave them, answer each point as out of scope, and flag them to the human
- **taken**: (c). they are another actor's practice upgrade, present before this route began; the wish names the radio `--auth` contract alone. a revert destroys work this route cannot see; a repair changes a contract its owner may still be mid-way through
- **rework**: clean — restore the `.eco/*` arm (and re-stamp the lock), guard `git hash-object`, order `sk-ant-` before `sk-`, and add tests for both new gates; none of it touches radio code
- **confidence**: 85%. the human may prefer this route to carry the fixes since the edits ride the same branch
- **where**: `.husky/check.timestamps.sh`, `.husky/check.timestamps.lock.sh`, `.husky/check.secrets.sh`
- **verdict**: —
