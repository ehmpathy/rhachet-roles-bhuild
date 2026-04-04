# define: guard variants (heavy | light)

## .what

behavior guards have two variants:
- `.light` — minimal self-reviews, faster iteration
- `.heavy` — thorough self-reviews, higher confidence

## .how

guard templates use suffix to declare variant:
- `1.vision.guard.light` — light version of vision guard
- `1.vision.guard.heavy` — heavy version of vision guard
- `3.3.1.blueprint.product.v1.guard.light` — light version
- `3.3.1.blueprint.product.v1.guard.heavy` — heavy version

at init time, the appropriate variant is selected:
- `initBehaviorDir({ guard: 'light' })` — uses .light variants (default)
- `initBehaviorDir({ guard: 'heavy' })` — uses .heavy variants

the suffix is stripped when copied to the behavior directory:
- template: `1.vision.guard.light`
- instance: `1.vision.guard`

## .why

| variant | reviews | use when |
|---------|---------|----------|
| light | fewer, focused | quick iteration, routine changes |
| heavy | many, thorough | high-stakes, novel territory |

light is default — most work benefits from faster feedback.
heavy is opt-in — for when extra scrutiny is worth the cost.

## .which guards have variants

| guard | light | heavy |
|-------|-------|-------|
| 1.vision | 3 reviews | 8 reviews |
| 2.1.criteria.blackbox | none | 4 reviews |
| 3.3.1.blueprint.product.v1 | 13 reviews | 17 reviews |

not all guards have variants. some guards (like execution) are the same regardless.

## .implementation

see `src/domain.operations/behavior/init/getAllTemplatesBySize.ts`:
- lists which templates have light/heavy variants
- handles suffix match and strip

see `src/domain.operations/behavior/init/initBehaviorDir.ts`:
- selects variant based on `guard` option
- defaults to 'light' if not specified

## .findsert semantics

if a behavior already has guards, re-init does not replace them.
this prevents accidental downgrade from heavy to light (or vice versa).
