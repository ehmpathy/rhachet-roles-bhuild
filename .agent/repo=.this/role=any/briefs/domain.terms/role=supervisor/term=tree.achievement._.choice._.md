# domain.term: tree.achievement

term.chosen   = achievement
term.kind     = noun
term.boundary = tree
term.synonyms.forbidden:
- task
- job
- errand
- assignment
- mission
- ask

## .what

a tree booted with a **clone on a stated goal, and no route beneath it**. the middle rung of the
three-verb tree ladder:

| verb | what it boots |
|---|---|
| `git.tree.duct` | worktree + one duct per crew role + tabs — no clone at all |
| **`git.tree.achievement`** | **+ a clone in the mechanic, driven by a `--goal`** |
| `git.tree.behavior` | + a bound behavior — stones, guards, review ladders, a yield |

```
rhx git.tree.achievement --into $org/$repo --name beav/… --goal '…'
rhx git.tree.achievement --into $org/$repo --name beav/… --goal @stdin
```

## .goal vs wish — the pair the word rests on

| | a **wish** | a **goal** |
|---|---|---|
| what it is | a document that bounds a deliverable | one statement of an outcome |
| what it earns | stones, guards, review ladders, a yield | a clone, and a close |
| the reader | a reviewer, later | the human who asked, now |
| the verb | `git.tree.behavior --wish` | `git.tree.achievement --goal` |

## .the two properties the word carries

| property | what it means |
|---|---|
| **the clone lands in the MECHANIC alone** | every other role comes up as a bare shell on the same worktree — a seat a human or supervisor takes without a second conversation to keep alive |
| **the goal rides as a FILE, never as keystrokes** | a duct is one addressable keyboard, and tmux send-keys submits on every newline. a multi-paragraph goal cannot ride a duct at all |

## .an achievement is NOT

- **an escape from `rule.require.behaviors-over-adhoc`** — that rule forbids ad-hoc dispatch of
  work that warrants a route. this verb is the honest name for the case the rule exempts, never a
  way around the case it governs
- **a behavior with fewer stones** — it has no stones. the `achiever` route that will give it some
  is seeded as `ehmpathy/rhachet-roles-bhrain#461`

## .refs

- `.agent/repo=.this/role=any/skills/git.tree.achievement.sh` — the verb
- `.agent/repo=.this/role=any/skills/git.tree.behavior.sh` — its heavier twin
- `ehmpathy/rhachet-roles-bhrain#461` — the `achievement init` route it is shaped to accept

## .reason

see `term=tree.achievement._.choice.reason.md` — the behaviorless sprout that produced it, the
`achiever` role it is named from, and the seam left cut for the route.

---

written by human + beaver 🦫
