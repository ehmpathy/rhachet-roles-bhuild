# rule.require.one-pr-per-worktree

## .what

worktree ↔ branch ↔ pr is strictly 1:1:1. each worktree produces exactly one pr. work that
splits into multiple prs splits into multiple worktrees.

the middle of a five-link chain: `crew ↔ tree ↔ branch ↔ pr ↔ goal`, 1:1:1:1:1. `term=crew`
carries the crew link; `rule.require.one-goal-per-tree` carries the goal link and states the
whole chain.

## .why

one pr per worktree keeps each pr on a single deliverable, so review, merge, and revert are
independent, and one stuck deliverable blocks no other. it also keeps the crew lifecycle clean
(sprout → work → release → tree del → stop).

batched deliverables couple unrelated review cycles, make revert all-or-none, obscure which
commit served which goal, and **violate the closure gate** — a half-released batch cannot
`git tree del`.

## .pattern

| work | worktrees |
|------|-----------|
| 7 peer fixes (e.g. issues #20-#26) | 7 worktrees, 7 prs |
| one fix that touches 5 files | 1 worktree, 1 pr |
| feature + its docs | 1 worktree, 1 pr (same deliverable) |

the unit is the **deliverable** (one pr), never the file count.

⚠️ **shared files are not a reason to batch.** peer tasks often touch the same files; handle the
collision by dependency order + rebase — dispatch in order, and when tree A's pr merges, rebase
tree B onto main.

## .antipattern

> *"these 7 issues touch the same extract logic, i'll do them all in one worktree with staged
> commits"*

that couples 7 review cycles into one pr — a reviewer cannot approve task 1 without task 5, and
a defect in task 3 holds up the whole batch.

## .enforcement

a second pr from one worktree = **blocker**

⇒ `rule.require.single-purpose-worktrees` says one *purpose* per worktree; this sharpens it to
the operational 1:1:1 invariant.

---

written by human + seaturtle 🐢
