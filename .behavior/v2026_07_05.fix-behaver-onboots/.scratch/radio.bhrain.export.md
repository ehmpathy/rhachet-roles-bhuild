## what

expose the stone-artifact precedence operations through the public `./sdk/route` export so other role repos can reuse them instead of a hand-mirrored copy:

- `asArtifactByPriority({ artifacts })` — canonical priority: `.yield.md` → `.yield.*` → `.yield` → `.v1.i1.md` → `.i1.md` → first `.md` fallback
- `getAllStoneArtifacts({ stone, route })` — globs `${stone}.yield*` + `${stone}*.md`

both live at `dist/domain.operations/route/stones/` but are absent from the `exports` map. today only `.`, `./sdk/route`, `./cli/*`, `./registry` are public; `./sdk/route` re-exports bind/step/getAllStones/setStoneAs* but not these two.

## why

`rhachet-roles-bhuild`'s `boot.behavior.ts` (the behaver sessionstart boot hook) needs this exact precedence to find `.yield.md` route artifacts with legacy `.md` / `.i1.md` fallback. after the `.yield.md` rename migration, the boot hook went partially blind to vision/criteria/blueprint context.

bhuild has re-derived the same precedence table by hand — duplicated domain knowledge that should live in one place: bhrain, the producer of these artifacts.

## acceptance

- [ ] `asArtifactByPriority` re-exported from `./sdk/route`
- [ ] `getAllStoneArtifacts` re-exported from `./sdk/route`
- [ ] their input/output types exported alongside
- [ ] published to npm; note the version in this issue

## consumer

`ehmpathy/rhachet-roles-bhuild` — once published, bhuild swaps its local mirror for this import (tracked by a partner radio task in that repo).
