# rule.require.guard-variant-consistency

## .what

when you modify guard templates, apply changes to all variants of that guard.

## .why

guard variants serve different use cases but share the same review structure. changes to one variant without the others creates drift and inconsistent behavior.

## .guard variants

| guard | variants | location |
|-------|----------|----------|
| 1.vision | `.guard.light`, `.guard.heavy` | `templates/` |
| 3.3.1.blueprint.product | `.guard.light`, `.guard.heavy` | `templates/` |
| 5.1.execution | `from_vision.guard`, `phase0_to_phaseN.guard` | `templates/` |

## .checklist

when you modify any guard template:

- [ ] identify all variants of the guard
- [ ] apply the same structural changes to each variant
- [ ] verify peer review sections match across variants
- [ ] verify judge sections match across variants

## .examples

### good — both variants changed

```bash
# modified both execution guard variants
git diff --stat
 5.1.execution.from_vision.guard      | 50 +++
 5.1.execution.phase0_to_phaseN.guard | 50 +++
```

### bad — only one variant changed

```bash
# only modified one variant — drift introduced
git diff --stat
 5.1.execution.from_vision.guard      | 50 +++
 # absent: 5.1.execution.phase0_to_phaseN.guard
```

## .enforcement

guard change without all variants changed = blocker
