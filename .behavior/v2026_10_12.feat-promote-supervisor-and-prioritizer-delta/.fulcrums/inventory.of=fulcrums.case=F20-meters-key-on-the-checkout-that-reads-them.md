# F20 — the meters key on the checkout that reads them

## .the fork

r010 nitpick.3 asked whether a size grant in the main checkout is invisible to a clone in a linked worktree, since the meters key on `git rev-parse --show-toplevel`.

- **A (taken):** keep the key. the size meter has one reader — the supervisor that sprouts, in its own checkout — and every refusal prints the `rhx` line for the human to run in that same checkout
- **B:** key on the main clone (`git rev-parse --git-common-dir`), so one grant reaches every worktree

## .why A, at the time

a clone in a linked worktree never sprouts, so it never reads the size meter. B would widen one grant to every worktree of the repo — a wider lift than the human typed.

## .rework

clean: one line in the meter path helper, if a second reader appears.

## .confidence — 80%, and why not higher

no `git worktree add` test proves the one-reader claim; it rests on the sprout verbs' read of where the supervisor runs.

## .where

`supervisor/skills/git.tree.size.uses.sh`, `git.tree.init/git.tree.init.behavior.sh`

## .verdict

open — for the council.
