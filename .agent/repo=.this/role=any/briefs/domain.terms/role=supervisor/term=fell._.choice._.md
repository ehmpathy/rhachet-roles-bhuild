# domain.term: fell

term.chosen   = fell
term.kind     = verb
term.synonyms.forbidden:
- del
- delete
- remove
- destroy
- teardown
- kill
- clean up
- retire

## .what

to **end a tree for good** — its worktree, its branch, and every record that depended on it.

```
sprout  →  a tree breaks ground, work STARTS
fell    →  the tree comes down, and it does not come back
```

it is the terminal verb of the tree's life. a felled tree has no re-boot; that is what parts it
from every other off-verb in the fleet.

## .the two layers it names

one word, two skills, and the boundary between them is the point:

| skill | what it fells | owns |
|---|---|---|
| `git.tree.del` | the **tree** — worktree, branch, ducts, tabs | the safety gate, the `--stash` hatch and its `--why` toll |
| `git.crew.fell` | the **crew** — the tree, plus its ledger row | one act on top: the record. it delegates the rest |

a crew is felled **through** its tree, never beside it. so `git.tree.del` runs alone on a crewless
tree, and `git.crew.fell` cannot run without it.

## .the ORDER carries the safety property

**tree first, record last.** where the gate refuses — unmerged, unstaged, or untracked work — the
ledger row **stays**, because a crew whose tree still stands is still a crew. a row dropped early
makes a live crew invisible to every sweep, which is the precise blindness the ledger exists to
close (see `term=ledger`).

## .fell is NOT

- **`stop`** — `crew.stop` ends the work and leaves the crew on the books; a stopped crew can be
  re-booted onto the same tree, so it is a **pause**. fell is what has no re-boot
- **`hide`** — free and reversible, and it touches neither work nor tree
- **`del`** — reserved for the mechanical row-removal one layer down (`__crew_ledger_del`). fell is
  the domain act; del is the file operation beneath it

the three off-verbs act on three different lifetimes at three different costs:

| verb | the axis | the cost |
|---|---|---|
| `hide` | the view | free, reversible with `crew.show` |
| `stop` | the work | ends a claude conversation for good |
| `fell` | the crew | ends the tree, the branch, the record |

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `git.crew.fell.sh` — the crew-layer verb
- `git.tree.del.sh` — the tree-layer gate it delegates to
- `work/crewwork.sh` — `crew.fell`, and `__crew_ledger_del` beneath it
- `git.crew.poll.sh` · `git.release.poll.sh` — every merged verdict reads **"fell it"**

## .reason

see `term=fell._.choice.reason.md` — etymology, the rejected `del`, and the evidence.

---

written by human + beaver 🦫
