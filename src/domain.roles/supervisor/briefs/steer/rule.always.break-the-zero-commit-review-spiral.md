# rule.always.break-the-zero-commit-review-spiral

## .what

when a tree's branch carries **zero commits** and its review lanes will not settle —
whether they overflow and review naught, or run clean and blame it for the corpus's
debt — the tree is stuck and cannot escape by its own effort. relay the **commit
gate** to the human at once; do not reach for the budget lever instead.

both halves of the trigger matter: the zero-commit branch is the cause, the unsettled
lanes are the symptom, and the symptom takes two shapes with no resemblance to each
other.

```
zero commits  ->  merge-base == the fork point == all the tree has ever written
              ->  --diffs since-main unions the WHOLE staged + untracked set
              ->  the reviewer's prompt overflows its window
              ->  the lane returns terminal, and it reviewed naught
              ->  the drive writes more artifacts to clear the lane
              ->  the diff GROWS
```

a feedback loop pointed the wrong way: every artifact the drive produces to satisfy a
reviewer enlarges the diff that blinded it. the harder the tree works, the more of its
lanes overflow.

## .two failure modes — the quiet one is worse

scope has two orthogonal axes, and a zero-commit branch breaks both:

| axis | flag | settles |
|---|---|---|
| breadth | `--paths-with` / `--paths-wout` | **what** to grade |
| provenance | `--diffs since-main` | **whose work** to grade |

| | **overflow** — the breadth end | **misattribution** — the provenance end |
|---|---|---|
| the lane | dies, reviews naught | runs, returns a long, well-argued review |
| the items | there are none | true — but of the whole corpus, not this branch |
| what's wrong | verdict is absent | the **attribution** |
| how it renders | terminal, unlocks next level | terminal, and looks healthy |
| does output say so? | count is suspiciously round | no |

**misattribution is the dangerous one.** an over-wide scope does not error — it
returns a longer, well-argued, true review. every item is a real statement about the
corpus; only the attribution is wrong, and no output says so. a drive that accepts
such findings burns its budget to repair debt it never incurred, and every repair it
writes enlarges the diff further. a lane that returns MANY well-argued blockers on a
zero-commit branch is not evidence the work is bad — check the commit count before
routing a clone to fix any of them.

## .why the tree cannot fix it

the one move that collapses the loop is a commit, resetting the diff to the fork
point — a human-only gate (`rule.forbid.self-grant-human-gates`). `rhx
git.commit.uses` is neither the driver's lever nor yours.

so this is the rare case where the tree is genuinely blocked on a human, while every
instrument reports it as blocked on a defect or in review.

the wrong lever is the one nearest to hand: `route.guard.budget --add N` is the
correct cure for an exhausted reviewer almost every other time. here it buys more
rounds of a review that cannot run, spending the clone's turns to enlarge the diff
further.

| the lane returned no verdict because… | the lever |
|---|---|
| it spent its round to RAISE a blocker, none left to CONFIRM a fix | **budget** — the driver's |
| a bad glob, an absent supply file, a malformed rubric path | **repair** — the driver's |
| the prompt overflowed a window the zero-commit diff filled | **a commit** — the human's |

## .the tell — three reads, all cheap

1. **the tree is DEEP in its route** — a `5.x` stone or past the blueprint. read this
   first; it parts the spiral from the ordinary case
2. **the branch has no PR** — `gh pr list --repo <org>/<repo> --state all`;
   `git.commit.push` findserts a PR, so no PR means no push means zero commits
3. **lanes will not settle, in a cluster** — several reviewers terminal at once with
   no blocker text naming a real artifact (overflow), or a lane returning many
   well-argued blockers whose subject is the corpus rather than this branch
   (misattribution). a high iteration count with no convergence is the shared tell

### read the stage first — read 2 alone false-positives

a tree at `1.vision` has zero commits because it has produced almost naught yet —
normal for every young tree, and read 2 fires on all of them. read 1 narrows the
field to the trees that matter, and costs only a glance at the stone the poll already
prints:

| stage | zero commits means |
|---|---|
| `1.vision` · `2.criteria` · `3.blueprint` | normal — a doc or two, naught to blind anyone |
| `5.x` execution / verification | the spiral — code, tests, reviews, takens, terms, dreams, all in the diff |

the quantity is what turns the state pathological; the stage is the cheap proxy for
it. one overflowed lane alone is not this — that is the ordinary malfunction
`rule.always.diagnose-reviewer-malfunctions` covers, and its scoped re-run is right.
the tell here is many lanes at once, deep in a route, on a branch with zero commits.

## .what this does not overturn

`rule.always.diagnose-reviewer-malfunctions` says the inherited `--diffs since-main`
scope is already correctly derived — true, and it stays true. what it leaves unsaid
is what merge-base yields on a branch with zero commits: the fork point is HEAD, so
the changed-files set is the entire uncommitted tree. a correct range over an
uncommitted tree is not a narrow scope. the scoped re-run stays right for a single
overflowed lane; it just doesn't touch the cause, which returns on every subsequent
lane.

## .how to relay it

name the tree, the lever, and the reason in one line, then stop — do not re-surface
every tick (`rule.require.pause-babysit-cron-after-idle-streak`).

> `<tree>` — N review lanes overflowed. cause is structural: zero commits, so
> `since-main` scopes to the whole uncommitted tree. the lever is `! rhx
> git.commit.uses set --quant 1 --push allow`, which resets the diff to the fork point.

## .enforcement

- unsettled lanes on a zero-commit branch met with `route.guard.budget --add N`
  instead of a relayed commit gate = **blocker**
- a clone routed to fix blockers a lane raised, on a zero-commit branch, with no prior
  commit-count check = **blocker** (items may be true of the corpus, not this branch)
- the spiral diagnosed and not relayed upward = **blocker**
- the spiral relayed on every tick rather than once per state change = **nitpick**
- a single overflowed lane treated as this spiral = **false positive** — scoped
  re-run is correct for that case

## .see also

- `rule.always.diagnose-reviewer-malfunctions` (bhrain/driver) — the single-lane case
  and its scoped re-run, left intact by this rule
- `rule.forbid.self-grant-human-gates` — why the commit gate is not yours, nor the driver's
- `rule.always.spend-own-levers-before-escalation` (bhrain/driver) — the mirror
  caution, for the case that reads driver-owned and is not
- `rule.require.ask-why-the-reviewer-wont-agree` — run before you conclude a lane is
  overflowed for this reason rather than a real blocker

---

written by human + beaver 🦫
