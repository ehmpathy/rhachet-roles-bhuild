# F15 — the whole-suite failures this worktree's state causes are proven green by ci, not here

## .the fork

the 5.3 gate says an unrelated failure is no excuse. in this worktree, 25 tests fail outside this pr's files:

- 1 integration (`cliOfRepoSettingsHooks`) and 21 acceptance (`role.init`, `radio.task.recorder`): they read the foreign rhachet upgrade, which rewrote `.agent/.actors/…/settings.of.repo.json` and `node_modules` to a manifest hook dispatch
- 3 acceptance (`radio.task.push.via-gh-issues`): no `EHMPATH_BEAVER_GITHUB_TOKEN` in this host's keyrack

the options:

- **a.** revert the foreign upgrade in place, reinstall, and rerun here
- **b.** prove them in ci, which installs from the committed lock and holds the token

## .taken — b, and why

- the foreign upgrade is not this route's to undo: the human asked that it stay in place, uncommitted (F9). a revert and reinstall rewrites `node_modules` and the settings it left
- ci is the clean tree at the pins: the committed lock, the committed settings, and the token. a green ci run is that same proof, made where the state is right
- the pr waits on ci green; a red there is repaired in the pr

## .rework — clean

a rerun in a clean worktree at the pr head would replace ci as the proof; no code changes.

## .confidence — 80%, and why it is short of 93%

it acts against the gate's stated bound, and the token suite proves itself only where the token lives.

## .where

`.behavior/v2026_11_23.feat-behaver-forbid-trust-of-wisher-how/5.3.verification.yield.md` — the tests-executed table

## .verdict

open — flagged for the pr
