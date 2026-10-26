# F10 — the clamp's test shape: one file, and two inert-list checks kept apart

## .the fork

the arch lane (i006) asks to (1) move the clamp's transformers into a second test file with
collocated sources, and (2) drop one of the two inert-list assertions, `[case3]` or `[case5]`.

## .taken — keep both as they stand, and why at the time

- one file: each transformer has one caller, in this file. `rule.prefer.wet-over-dry` (rule of
  three) — a split adds an import seam with no second reader. every transformer now has its own
  case in `[case6]`, which was the harm the lane named (untested branches).
- two checks, two subjects: `[case3]` reads boot.yml files **on disk** that no role declares — a
  curation file written and never wired. `[case5][t0]` reads role dirs with **no declared boot**,
  boot.yml or not — a new role that boots whole. the two sets match today; a new role with no
  boot.yml fails only `[case5]`, an undeclared boot.yml with a declared peer fails only `[case3]`.

## .rework — clean

a file move, or one deleted `then`.

## .confidence — 80%, and why it is not higher

both are taste calls on test structure; a council may prefer the split.

## .where

`src/domain.roles/roleArtifacts.integration.test.ts`

## .verdict

(open — for the council)

## .the deferred work

the split per role, a real yaml parse, and a generated supervisor catalog (i007 r011 b3, n5, n6)
are caught as a dream: `dreams/v2026_10_21.refactor.recompose-the-boot-budget-clamp.md`.