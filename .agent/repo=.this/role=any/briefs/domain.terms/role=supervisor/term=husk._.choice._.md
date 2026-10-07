# domain.term: husk

term.chosen   = husk
term.kind     = noun
term.synonyms.forbidden:
- orphan
- orphaned worktree
- stale worktree
- leftover
- litter
- debris
- ghost
- phantom
- zombie

## .what

a **directory under `_worktrees/` that git does not own** — no admin entry, no index, no
branch, no route back through git to a single file inside it.

```
$HOME/git/<repo>/_worktrees/<tree>/     the dir is THERE
git rev-parse --is-inside-work-tree     fatal: not a git repository
```

it has a tree's shape and a tree's name, and it is not a tree.

## .the inversion that defines it: SUBSTANCE with no RECORD

a husk is the exact mirror of a **phantom** (`term=duct`), and the pair is the cleanest way to
hold both:

| | what is there | what is absent |
|---|---|---|
| **phantom** | the record — a registry row | the substance — its tmux session |
| **husk** | the substance — a dir full of files | the record — git's admin entry |

so the two need opposite cures, and to reach for the wrong one is a no-op that reports success:

- a phantom is cleared by a **registry** act (`duct.stop`, `crew.fell`) — `rm -rf` finds naught
- a husk is cleared by a **filesystem** act (`rm -rf`) — `worktree remove` finds naught

## .a husk is NOT an ORPHANED TREE, and the confusion is expensive

git has its own *orphaned worktree*: a dir it **still owns**, whose branch was deleted out from
under it. that is a live worktree that lacks one attribute. a husk is not a worktree at all.

| the dir | git owns it? | holds a branch? | what it is | what clears it |
|---|---|---|---|---|
| populated, registered, on a branch | ✅ | ✅ | a **tree** | `git.tree.del` |
| populated, registered, branch gone | ✅ | ⛔ | an **orphaned tree** | `worktree remove` |
| populated, **not registered** | ⛔ | ⛔ | a **husk** | `rm -rf` only |
| a row with no dir at all | — | — | a **phantom** | `crew.fell` |

both middle rows were hit on 2026-08-25, one after the other, and each was misread once. see
`.reason`.

⚠️ **a THIRD compound is live: `⚠️ WORK ORPHANED`, rendered by `git.crew.poll`.** it sits on a
different axis entirely — every row above asks *what kind of DIR is this*, while `WORK ORPHANED`
asks *does this tree have a CREW*. its tree is healthy, registered, and dirty; only the crew is
absent, so its cure is `rhx git.crew.boot` and never `rm -rf`. that is why it is not a fifth row
here — to add it would merge two axes, the exact collapse this table exists to prevent.
sanctioned as a compound; bare `orphan` stays forbidden. see `.reason`.

## .how a husk is MADE

`git worktree remove --force` drops the admin entry **first**, then deletes the files. any
failure in the second half — a permission wall, a read-only store, an interrupt — leaves the dir
in place with its record already gone.

so a husk is the residue of a **teardown that died halfway**, and the window it is made in is
the ordinary success path of the ordinary command.

## .why `_worktrees/` is what makes a husk safe to remove

`_worktrees/` is a **managed namespace**: every legitimate entry in it is a registered worktree.
an entry that is not registered is litter by construction — there is nowhere else it could have
come from and no branch it could hold.

that is the whole warrant for `rm -rf`, and it is why the path guard is not optional. outside
`_worktrees/`, an unregistered dir is just a directory, and no such inference is available.

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `git.tree.del.sh` — the husk arm: classify, path-guard, `chmod -R u+rwX`, `rm -rf`, verify
- `work/work.surface.remote.integration.test.ts` — `[case7]`, which clamps the arm's shape

## .reason

see `term=husk._.choice.reason.md` — etymology, the two misreads, and the rejected synonyms.

---

written by human + beaver 🦫
