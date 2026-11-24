# F8 — the blueprint lane slug has no role prefix

## .the fork

the blueprint guards' level-1 lanes carry a role prefix: `mech-*`, `arch-*`, `ergo-*`. the new behaver lane there is `wisher-how`.

- (a) keep `wisher-how`, the same slug as the vision lane
- (b) prefix it on the blueprint alone, e.g. `behaver-wisher-how`, to match its neighbours there

## .taken — (a), and why

the vision guards set the behaver's own lane convention, and their lanes carry no prefix (`dimensional-decomposition`, `experience-coverage`). one rule grades both lanes, so one slug lets a reader find both with one grep. the behaver has no settled prefix to align with anyway: its execution lane is `behavior-intent-coverage`.

## .rework — clean

two templates, one `toContain` assert, two snapshots. no caller reads the slug.

## .confidence — 85%, and why it is low

the blueprint guard is where a reader meets the lane next to prefixed peers, and there a bare slug stands out. a commander who reads guards per file rather than per rule would pick (b).

## .where

`src/domain.operations/behavior/init/templates/3.3.1.blueprint.product.guard.{light,heavy}`; found in self-review `has-consistent-conventions` of 5.1.

## .verdict

open — flagged for the pr
