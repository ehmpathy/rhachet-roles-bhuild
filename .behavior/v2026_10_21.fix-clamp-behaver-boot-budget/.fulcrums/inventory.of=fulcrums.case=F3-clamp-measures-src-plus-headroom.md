# F3 — how the clamp covers the linked render

## .the fork

- (a) boot each `src/domain.roles/<role>/boot.yml` and assert `src payload + margin ≤ budget`, with one constant `margin` for the src→linked path delta
- (b) build `dist/`, link it, and boot the linked spec
- (c) copy each role into a temp dir at the linked layout (`.agent/repo=bhuild/role=<role>/`) and boot it there — the linked render, measured exactly, no build, no constant

## .taken — (c), and why at the time

(a) was the first pick, and logic broke it: the delta is per **path occurrence**, not per role.
every `<brief.say path="…">` carries the full path, and each `base=` block carries one more.
behaver has ~6 occurrences and +30 tokens (2,571 → 2,601, measured) — ~5 per occurrence.
supervisor says ~25 briefs and a skill, so its delta is several times larger. one constant sized
on behaver under-covers supervisor; one sized on supervisor wastes behaver's budget.

(b) needs a full build inside a test, and of this repo's six roles only behaver is linked here.

(c) measures what a consumer seat pays, for every role, with one copy per role. the linked layout
is a path rhachet already sweeps and costs: `roles cost --all` reports
`.agent/repo=bhuild/role=behaver/boot.yml` at 2,601.

### amended — the copy carries only what the build ships

the i006 behavior lane measured that a raw `src` copy also carries the tests, `.log` fixtures and
snapshots the build's rsync never ships (supervisor src 33,989 vs dist 32,482). so both seat copies
now pass through `isRoleFileShipped`, which mirrors the rsync filter; `[case6][t4]` snapshots the
build command it mirrors, so a change to one shows beside the other. budgets were re-derived from
the shipped render. the decomposer, prioritizer and supervisor boots also `not:` their tests and
fixtures, so `roles cost` on the src spec now reads the same figure as dist — the measure each
boot.yml names stays runnable with no build.

## .rework — clean

the test is one `given` case; the mechanism lives only in it.

## .confidence — 75%, and why it is low

not probed end to end: a copy of a role into a temp linked layout, then `roles boot --what` on it.
the behaver roster entry shows rhachet costs that layout; that a temp copy outside the repo's own
`.agent/` resolves the same is assumed. if it does not, fall back to (a) with a per-role margin
measured once per role.

## .where

`src/domain.roles/roleArtifacts.integration.test.ts`

## .verdict

(open — for the council)

## .the deferred work

one filter file read by both rsync and the tests, which retires `isRoleFileShipped` and the
`orgNamesAbsent` copy (i007 r011 b2, r010 n10), is caught as a dream:
`dreams/v2026_10_21.refactor.one-ship-filter-for-build-and-tests.md`. the dead-looking `not:`
entries (r011 n8) are this fulcrum at work: they make the src row read what a seat is handed.