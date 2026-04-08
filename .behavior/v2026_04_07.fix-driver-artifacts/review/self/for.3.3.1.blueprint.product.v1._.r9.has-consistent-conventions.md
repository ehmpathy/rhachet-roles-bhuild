# self-review: has-consistent-conventions

## convention change summary

the blueprint introduces a new artifact convention:
- **old**: `{stone}.v1.i1.md` or `{stone}.md`
- **new**: `{stone}.yield.md` or `{stone}.v1.yield.md`

this is **intentional** — the wish explicitly asks for this convention change.

## convention consistency within the blueprint

### pattern 1: versioned stones

all versioned stones will use `.v1.yield.md`:
- `3.3.1.blueprint.product.v1.yield.md`
- `3.1.3.research.internal.product.code.prod._.v1.yield.md`
- etc.

**consistent**: same suffix pattern for all versioned stones.

### pattern 2: non-versioned stones

all non-versioned stones will use `.yield.md`:
- `1.vision.yield.md`
- `2.1.criteria.blackbox.yield.md`
- etc.

**consistent**: same suffix pattern for all non-versioned stones.

### pattern 3: references

all cross-stone references use the same pattern:
- `$BEHAVIOR_DIR_REL/3.2.distill.domain.*.v1.yield.md`
- `$BEHAVIOR_DIR_REL/1.vision.yield.md`

**consistent**: references mirror emit targets.

## extant codebase conventions

| concern | extant convention | blueprint | aligned? |
|---------|-------------------|-----------|----------|
| artifact suffix | `.v1.i1.md` | `.v1.yield.md` | intentional change |
| wildcard references | `*.v1.i1.md` | `*.v1.yield.md` | aligned |
| emit directive | `emit into $BEHAVIOR_DIR_REL/...` | same format | aligned |
| stone file extension | `.stone` | unchanged | aligned |
| guard file extension | `.guard` | unchanged | aligned |

## new terms introduced

| term | purpose | aligned with vision? |
|------|---------|---------------------|
| `yield` | the output of a stone | yes — vision explicitly chose this term |

the term "yield" is new but intentional. the wisher chose it for:
- clarity: "yield" conveys output/result
- better alpha-sort: `.yield.md` sorts after `.stone`
- semantic fit: stones "yield" artifacts

## summary

| check | result |
|-------|--------|
| internal consistency | yes — all patterns follow the same convention |
| extant conventions | intentional divergence per wish |
| new terms | "yield" — justified by vision |

**verdict**: the convention change is internally consistent and aligns with the explicit wish. no unintentional divergence.
