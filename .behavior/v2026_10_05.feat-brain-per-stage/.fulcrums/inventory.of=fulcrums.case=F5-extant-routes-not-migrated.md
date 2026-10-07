# F5 · extant routes are not migrated

## .the fork

- **a.** change only the templates; fresh routes carry the brains, extant routes keep their guards
- **b.** also add a migration that writes `brain:` into extant routes' guards

## .taken — a, and why

the wish scopes to "a freshly `init.behavior`'d route". re-init has findsert semantics: it keeps
extant guards on purpose (`define.guard-variants-heavy-light`). a guard instance carries a
provenance uri for `rhx route.guard.upgrade`, so a human who wants the new guard on an extant route
already has a path. a migration in bhuild would duplicate it.

## .rework

clean. a migration can be added later with no change to the templates.

## .confidence — 85%, and why not higher

checked: `route.guard.upgrade` re-applies the whole source template by provenance uri
(`getStoneGuardUpgradePlan.js`), so a `brain:` line does reach an extant guard. it cannot create the
new `4.1.roadmap.guard` on a route that never had one, so an upgraded mini+ route keeps its roadmap
on opus.

## .where

no file changes.
