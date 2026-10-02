# F4 — which backlog a push drains

- **the fork:** only the bound route's `.radio/` · every `.radio/` under `.behavior/` in this worktree
- **taken:** every route in the worktree. a route that finished with held tasks gets no more pushes of
  its own, so a bound-only drain would orphan them — the exact loss the wish targets
- **rework:** clean — the glob the drain sweeps
- **confidence:** 70%. low because a push in route B that delivers route A's tasks crosses a boundary
  the wisher may want kept; per-route output lines keep the provenance visible
- **where:** yield `.cons`, `.open questions`
- **verdict:** broad drain — ruled by the wisher, 2026-09-28: a push that gets through delivers every
  held record whose own gate is open, not only records for its own target. the question put to the
  wisher named targets, not routes; the sweep across every route's `.radio/` in the worktree is the
  same broad sense, kept as taken
