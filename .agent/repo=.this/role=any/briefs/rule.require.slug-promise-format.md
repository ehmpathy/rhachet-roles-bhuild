# rule.require.slug-promise-format

## .what

self-review slugs must read as "i promise that it $slug"

## .why

- makes the promise explicit and readable
- clarifies what the reviewer commits to
- enables natural language validation

## .pattern

```
i promise that it $slug
```

## .examples

### good

| slug | reads as |
|------|----------|
| `has-questioned-requirements` | i promise that it has-questioned-requirements |
| `has-questioned-assumptions` | i promise that it has-questioned-assumptions |
| `has-questioned-questions` | i promise that it has-questioned-questions |
| `has-behavior-declaration-coverage` | i promise that it has-behavior-declaration-coverage |
| `has-role-standards-adherance` | i promise that it has-role-standards-adherance |

### bad

| slug | problem |
|------|---------|
| `question-the-requirements` | "i promise that it question-the-requirements" ✗ |
| `hidden-assumptions` | "i promise that it hidden-assumptions" ✗ |
| `review-coverage` | "i promise that it review-coverage" ✗ |

## .enforcement

slug that does not read naturally as "i promise that it $slug" = blocker
