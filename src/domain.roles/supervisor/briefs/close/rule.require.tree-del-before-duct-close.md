# rule.require.tree-del-before-duct-close

## .what

before you stop a crew, the supervisor sends `git tree del` into the **foreman** seat to fell
the worktree. the foreman is an empty seat — a bare shell, no clone — so the supervisor drives
it; the seat never acts on its own.

**if `git tree del` cannot delete the worktree, the crew is not ready to stop.**

## .why

`git.tree.del` is a **safety gate**, not a cleanup chore. it refuses when there are unstaged
commits or unmerged PRs — so a failure signals incomplete work, not merely wasted disk.

## .pattern

```bash
# 1. verify the mechanic shows released (rule.require.verify-released-before-close)
rhx git.crew.read --tree "$tree" --who mechanic

# 2. the foreman fells the worktree — `git tree del` TAKES the branch, always
rhx git.crew.send --tree "$tree" --who foreman --what "git tree del $branch"

# 3. verify the fell landed — the verdict is not the completion
rhx git.crew.read --tree "$tree" --who foreman

# 4. only then, stop the crew
rhx git.crew.stop --tree "$tree"
```

⚠️ `git tree del` with no argument fails (`usage: git tree del <branch>`). the branch name is
not the tree slug — read it off the foreman's prompt line (`on beav/fix-x-y`).

⚠️ step 3 is not optional — check the filesystem and ledger, not just the verdict text.

⚠️ if `tree del` fails, do not stop the crew. investigate: uncommitted changes? unmerged
branch? work still in flight?

## .this is supervisor-driven, never foreman-initiated

the foreman does not notice a merge and act on it alone. it sits idle until the supervisor
sends the command. an idle post-merge foreman is the supervisor's cue in the tick it is found
— closeout does not wait for a later tick.

## .enforcement

- crew stopped with no prior `git tree del` from the foreman = **blocker**
- `git tree del` reported as done with no read-back = **blocker**
- merged/fellable tree left idle on the assumption the crew handles it = **blocker**
- `git tree del` sent with no branch argument = **nitpick** (read the branch off the pane first)

## .see also

- `rule.require.verify-released-before-close.md` — step 1, in depth
- `rule.always.entool-the-layer-you-drop-below.md` — why every call above is a crew verb

---

written by human + seaturtle 🐢
