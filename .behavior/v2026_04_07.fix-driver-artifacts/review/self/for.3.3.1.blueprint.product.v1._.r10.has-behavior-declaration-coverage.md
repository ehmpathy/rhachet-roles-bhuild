# self-review: has-behavior-declaration-coverage

## vision requirements

from `1.vision.md`:

| requirement | blueprint coverage | location |
|-------------|-------------------|----------|
| rename `v1.i1.md` → `v1.yield.md` | ✅ covered | phase 1: sedreplace |
| rename `{stone}.md` → `{stone}.yield.md` | ✅ covered | phase 2: manual edits |
| better alpha-sort | ✅ inherent | `.yield.md` sorts after `.stone` |
| update emit targets | ✅ covered | phases 1-2 |
| update cross-references | ✅ covered | phase 1: sedreplace |

## criteria requirements

from `2.1.criteria.blackbox.md`:

| usecase | criterion | blueprint coverage |
|---------|-----------|-------------------|
| usecase.1 | emit target uses `{stone-prefix}.yield.md` | ✅ phase 1-2 |
| usecase.1 | references use `*.yield.md` pattern | ✅ phase 1 |
| usecase.2 | stone followed by yield in alpha-sort | ✅ inherent |
| usecase.2 | all outputs found via `*.yield.md` | ✅ consistent pattern |
| usecase.3 | new behaviors follow updated pattern | ✅ templates updated |

## gap analysis

searched blueprint for omissions:

| check | result |
|-------|--------|
| vision requirements absent? | no |
| criteria requirements absent? | no |
| boundary conditions unhandled? | no — versioned and non-versioned both covered |
| error cases unhandled? | n/a — template-only change |

## summary

**verdict**: all requirements from vision and criteria are addressed in the blueprint. no gaps.
