# self-review: has-consistent-conventions

## summary

the convention change was explicitly requested. no unintentional divergence from extant patterns.

## review

### what name conventions were changed?

| before | after | reason |
|--------|-------|--------|
| `v1.i1.md` | `v1.yield.md` | wisher's explicit request |
| `{stone}.md` | `{stone}.yield.md` | same request, for non-versioned emit targets |

### was this a deliberate change?

yes. the wish explicitly stated:
- "upgrade to use the `yield.md` pattern"
- "better alphaorders and names what the artifact really is — the yield of the stone"

### does the new convention align with the codebase?

the new convention was not extant — it replaces the old one. but this was the explicit goal. the change:
- uses the same `{stone}.` prefix pattern (consistent)
- uses `.md` suffix (consistent)
- only changes the middle segment from `v1.i1` to `v1.yield`

### do we introduce terms where extant terms exist?

yes — "yield" replaces "i1". but this was explicitly requested to better name the artifact's purpose.

## conclusion

the convention change was deliberate and prescribed by the wisher. no unintentional divergence.
