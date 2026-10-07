# domain.term.choice.reason: tree.achievement

## .etymology

**adopted, never coined.** the `achiever` role already exists upstream in the bhrain ecosystem —
`rule.always.fix-forward-under-scouts-honor` files under it, and it carries issues of its own
(#317, #345, #349). so the verb is named from the role that owns goal-driven work, exactly as
`git.tree.behavior` is named from the `behaver` role that owns wish-driven work.

```
behaver  →  a behavior  →  git.tree.behavior --wish
achiever →  an achievement →  git.tree.achievement --goal
```

⇒ the symmetry is the whole argument for the word. a reader who knows one verb can derive the
other, and the noun in each names the artifact the role produces.

the rejected alternatives:

| rejected | why |
|---|---|
| `task` | ⛔ taken — a **radio task** is a gh issue that a `seed` pushes, and it is the exact OPPOSITE act (work that does NOT start). to overload it here would collide the two halves of `define.sprout-vs-seed` |
| `job` / `errand` / `assignment` / `mission` | none names a role this repo declares, so none composes. they would each be an invention where an adopted word was available (`rule.always.reuse-pavement-before-improvise`) |
| `ask` | ⛔ taken — `term=ask` already names a distinct concept in this glossary |

## .the evidence — the behaviorless sprout, 2026-09-07

the human asked for a behaviorless sprout, and it landed: worktree, three ducts, three tabs, a
live shell in every seat. then:

> *"hey how come behaviorless doesnt start the claude with the instruction though?"*

the answer was that no verb existed to carry one. `git.tree.duct` boots ducts and no clone;
`git.tree.behavior` boots a clone and demands a `--size` and a `--wish`. between them sat a real
case with no verb: **work that warrants a clone and does not warrant a route.** the human named
the shape:

> *"yeah, why dont we have a skill like git.tree.behavior which is git.tree.achivement ?"*
> *"which for now, just spawns a claude with a stdin of what we want to accomplish"*
> *"and eventaully, we'll upgrade into an achiever route. so we can do `achievement init`"*

⇒ so the term arrived with its **upgrade path already stated**, which is why the verb is shaped
around a seam rather than around today's behavior.

## .the seam, and why the goal is a FILE

the boot line is deliberately one substitution away from the route:

```sh
# today
claude --name mechanic --permission-mode acceptEdits "$(cat $goal_src)"

# once `achievement init` lands
cat $goal_src | rhx achievement init --goal @stdin && claude --name mechanic ...
```

the goal is shipped to the tree as a file — `~/.rhx/goal/<tree>.goal.md` on a grove — rather than
typed into the mechanic's duct. two reasons, and the second is the durable one:

1. **a duct cannot carry a document.** it is one addressable keyboard, and tmux send-keys lands
   every newline as a submit, so a multi-paragraph goal would arrive as N separate turns
2. **a file is what `achievement init` will want.** a keystroke payload would have to be
   re-captured; a path composes

⇒ one line changes in one caller when the route lands, and the verb's contract does not move.

## ⚠️ .the bound this term must carry, or it becomes a loophole

`rule.require.behaviors-over-adhoc` grades ad-hoc dispatch a **blocker**, and this verb boots a
clone with no route. read carelessly, it is a way around that rule.

it is not, and the difference is stated in the verb's own `--help`:

> reach for this verb when the work does NOT warrant a route, and for `git.tree.behavior` when it
> does. this verb is not a way around that rule, it is the honest name for the case the rule
> exempts.

⇒ the risk is real and it is a **judgment**, which is exactly why the ask that follows is a route
rather than a rule: the lightest structure that still leaves a trail. a route that costs more than
the work it wraps will be routed around, and then the ladder has a hole again.

seeded as `ehmpathy/rhachet-roles-bhrain#461`.

## .disputes

none open.

---

written by human + beaver 🦫
