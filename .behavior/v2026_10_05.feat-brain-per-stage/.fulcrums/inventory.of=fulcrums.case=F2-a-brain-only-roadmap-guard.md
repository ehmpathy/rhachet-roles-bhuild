# F2 · a brain-only `4.1.roadmap.guard` marks the mini+ boundary

## .the fork

- **a.** add `4.1.roadmap.guard` with only `brain: claude-sonnet-5-5[1m]`
- **b.** leave the roadmap guardless; it inherits opus from the blueprint, and sonnet starts at `5.1`
- **c.** give the roadmap a full guard (reviews + judges)

## .taken — a, and why

the wish puts the roadmap after the blueprint, on sonnet. a brain lives on a guard, so a guardless
roadmap cannot switch (b breaks the wish). bhrain passes a guard with no reviews and no judges at
once, as "artifacts only" (`setStoneAsPassed.js:281-310`), so (a) adds no gate. (c) would add a
review gate the wish never asked for.

## .rework

clean. one new template file, one entry in `BEHAVIOR_SIZE_CONFIG.mini.adds`.

## .confidence — 85%, and why not higher

the visible pass note changes from `unguarded` to `artifacts only`. the wisher may prefer (b) and
accept one opus stone after the blueprint.

## .where

`src/domain.operations/behavior/init/templates/4.1.roadmap.guard` (new),
`src/domain.operations/behavior/init/getAllTemplatesBySize.ts` (mini adds).
