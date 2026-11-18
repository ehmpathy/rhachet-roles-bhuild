# F18 — the repo-local probe skills sit outside the behavior's contract

## .the fork
review 2 (ergo-contract-snapshots, blocker 1) asks for exhaustive snapshots of
`grove.reach.probe.sh` and `shell.syntax.check.sh`, two skills this pr adds under
`.agent/repo=.this/role=any/skills/`.

choices:
- (a) give each its own integration suite, every variant snapped, in this pr
- (b) hold them outside the contract this behavior ships, and catch their suites as a dream

## .taken — (b)
- the wish's contract is the supervisor role: `src/domain.roles/supervisor/skills/**`. these two
  live under `.agent/repo=.this/`, which the package never ships (`files` in `package.json` names
  `dist`), so no consumer of the role ever runs them
- they are the tools this route used to measure itself: `grove.reach.probe` took the 5.1 facts
  (`appendix/5.1.execution.probe.tailnet-reach.md`), `shell.syntax.check` parse-checks an edit.
  their output reaches a clone at this repo's keyboard, never a supervisor in the field
- a suite for each is real work beyond the wish (a tailnet stub for the probe; a corpus of
  unparseable files for the check), so it rides the dream, not this pr

## .rework — clean
two new suites beside the two skills; no shipped file changes.

## .confidence — 80%
the 20%: a reviewer may hold that any skill in the diff owes snapshots, shipped or not.

## .where
`.agent/repo=.this/role=any/skills/grove.reach.probe.sh`, `shell.syntax.check.sh`.

## .verdict
disputed, council awaited.
