# F8 — where records live, given a worktree may be removed

- **the fork:**
  - (a) `$route/.radio/` as the wish names — inside the worktree, gitignored by `.gitignore:23`
  - (b) a tracked name under the route, so records ship with the branch
  - (c) a store outside the worktree — e.g. under `~/git/.radio/`, where os.fileops already
    keeps its tasks — keyed by source repo, so any worktree of that repo drains it
- **taken:** (a). the wish names the route's `.radio/` in so many words, and #319 asks it mirror the
  pull cache. (b) puts every task body into every PR diff
- **rework:** clean — one base path
- **confidence:** 55%. low because (a) leaves a critipath open: a worktree removed while tasks are
  held deletes them (inventory **C21**). these worktrees are disposable (`_worktrees/…`), and the
  one guard today, #379's onStop nudge, is not in this tree. (c) closes C21 but departs from the
  wish's literal words and moves records out of the route's view
- **how found:** self-review has-questioned-assumptions (`git check-ignore -v`), then sharpened by
  the peer lane experience-coverage (nitpick.6), which showed C21's alterpath grade leaned on a
  guard outside this tree
- **where:** yield `.cons`, `.open questions`, `.what is awkward`; inventory C21
- **verdict:** (a) route-local, **loss accepted** — ruled by the wisher, 2026-09-28. held records live
  in `$route/.radio/` as the wish words it; a worktree removed while tasks are held loses them, and
  that loss is accepted on record (inventory C21). the guard before removal stays #379's onStop
  nudge, out of this tree
