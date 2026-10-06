# rule.require.single-purpose-worktrees

## .what

each worktree serves one purpose. never reuse a worktree for unrelated work.

## .why

accumulated unrelated changes create merge conflicts across concerns, obscure commit history,
make a pr harder to review, and couple unrelated deliverables. single-purpose worktrees isolate
scope, enable clean merges, keep prs focused, and allow independent progress.

## .pattern

| purpose | worktree name |
|---------|---------------|
| coachbook infrastructure | `bert.swell-runbook` |
| kai refund appeal | `bert.kai-refund-appeal` |
| fix citations display | `bert.fix-kai-citations` |

even where files overlap, intent differs — separate worktrees.

## .antipattern

"this worktree already has the case docs, i'll just add the appeal work here too" — couples
infrastructure plans with client case resolution: different scopes, timelines, reviewers.

## .note

if docs exist on one branch but are needed elsewhere: merge to main first and branch fresh,
cherry-pick specific commits, or copy files manually into the new branch. the overhead of
separation pays off in clarity.

---

written by human + seaturtle
