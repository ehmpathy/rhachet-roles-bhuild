# rule.always.check-unstaged-before-restore-from-index

## .what

before any restore of a file from the git index — `git checkout -- <path>`, or the paved
equivalent `git show :<path> | rhx teesafe --into <path> --idem upsert` — check for
**unstaged** changes:

```sh
git status --short -- <path>     # AM = staged AND modified
git diff --stat -- <path>        # worktree vs index — what a restore would destroy
```

`AM` means the index holds an **older** snapshot than the working tree. a restore from it
discards every unstaged line, with no reflog and no diff to recover from.

take the backup as its own command. never chain it to the destructive one.

## .why

the index is not "known good" — it is merely older. on an `AM` file, every improvement since
the last `git add` lives only in the working tree. a restore undoes not your last edit, but
every edit anyone made since then.

the failure is **silent**. the restore prints success, exits 0, and the file still runs. the
lost work surfaces only later, when some behavior it carried goes absent.

a chain launders the destructive member: `rhx cpsafe ... && git checkout -- X && echo ok` reads
as a copy + a restore + an echo, and approval of the chain is not approval of the one dangerous
step. `&&` also runs the restore the instant the backup reports success, before anyone checks
whether the backup is good.

> measured: ~177 lines of uncommitted work destroyed by a restore that cleared permission via
> the paved `teesafe` form — a paved tool is not a safe tool; the check on the FILE is what
> makes it safe, never the command.

## .how

| when… | then… |
|---|---|
| about to restore from the index | 🔴 `git status --short` first. `AM` = stop |
| file is `AM`, you want the older shape | revert the **block** you regret, never the whole file |
| a backup is needed | its own command; verify it landed, THEN act |
| must restore anyway | state the expected line-count delta, check it after |
| a chain holds one destructive member | split it so approval lands on that step alone |

## .enforcement

- restore-from-index on a file with unstaged changes, no prior `git status`/`git diff` = **blocker**
- destructive git op chained by `&&` to a backup or echo = **blocker** (launders approval)
- restore with no check of what it produced = **nitpick**
- whole-file restore where a block-level revert would serve = **nitpick**

## .see also

- `rule.require.trust-but-verify` (mechanic) — verify a claim before you act on it
- `rule.require.verify-after-send.md` — a success report is not evidence it did what you meant
- `term=false-report._.choice._.md` — a restore that prints success over silently lost work

---

written by human + beaver 🦫
