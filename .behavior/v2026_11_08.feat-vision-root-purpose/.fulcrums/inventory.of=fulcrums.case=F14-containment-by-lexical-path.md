# F14 — the depth lane places `--vision` against cwd by lexical path, not realpath

## .the fork

the `enroll-impl-behavior-intent` lane (5.1, i006, nitpick 4) notes `asVisionPath` compares
`cwd` to `--vision` by string; a symlinked absolute path to a file inside the repo would read as
outside and refuse.

options: **lexical containment** (as now, a pure transformer), or **realpath both sides** (i/o in
the placement, plus a symlink test).

## .taken, and why at the time

**lexical.** `cwd` is `process.cwd()`, which node returns already resolved; the guard passes
`$route` relative (`'$route/1.vision.yield.md'`), so `join(cwd, rel)` lands inside by
construction. the vision journey runs the lane under bhrain in a temp repo and the lane reaches a
depth verdict, never `outside cwd`. the only path that trips it is a hand-typed absolute path
through a symlink, and that refuses loudly with the fix printed — a false refusal, never a false
pass.

## .rework: clean

realpath the vision path's nearest extant ancestor and cwd in `getOneVisionFile`, before
`asVisionPath`; add a symlinked-worktree integration case. one file, no caller change.

## .confidence: 80%, and why it is low

a future guard that passes `$route` absolute, or a repo that lives behind a symlinked mount, would
turn the false refusal into a lane that blocks every stone. not observed; not proven absent.

## .where

`src/domain.operations/behavior/vision/asVisionPath.ts`;
`src/domain.operations/behavior/vision/getOneVisionFile.ts`.

## .verdict

repaired in the same round: `getOneVisionPathReal` resolves both sides through their symlinks,
clamped by verdict integration [case1][t2] (red under the lexical placement, green with the fix).

🟡 the `enroll-impl-behavior-intent` i006 stance that cites this entry is on `nitpick.4` (the
extant-route remedy, item 5) — declared under a mis-mapped ordinal. that item is repaired too
(a plan-mode `route.guard.upgrade`); neither concern is in dispute.

the director noted the repair, 2026-11-08, and ruled the mis-recorded stance be voided by
`--as rewound`; 5.1 was rewound to do so, and its record was rebuilt from that point.
