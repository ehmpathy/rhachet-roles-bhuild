# self-review: has-pruned-backcompat

review for backwards compatibility that was not explicitly requested.

---

## component-by-component review

### 1. GITHUB_TOKEN env var fallback

| question | answer |
|----------|--------|
| explicitly requested? | yes — wish says "cicd will work out of the box" and "keyrack will already forward from env var if needed" |
| minimum viable? | yes — single fallback path |
| added for backwards compat? | yes, but prescribed |
| shim or wrapper for old api? | no |

**verdict**: keep — explicitly prescribed by wisher

### 2. explicit --auth flag preserved

| question | answer |
|----------|--------|
| explicitly requested? | implied — wish says keyrack is "first", not "only" |
| minimum viable? | yes — retain extant behavior |
| added for backwards compat? | partially |
| shim or wrapper for old api? | no — extant api unchanged |

**verdict**: keep — extant api, no removal requested

### 3. auth resolution order (keyrack > explicit > env)

| question | answer |
|----------|--------|
| explicitly requested? | yes — wish says "skill's auth to default to keyrack --owner ehmpath first" |
| minimum viable? | yes |
| added for backwards compat? | no — this is new behavior |
| shim or wrapper for old api? | no |

**verdict**: keep — explicitly prescribed

---

## backcompat patterns reviewed

| pattern | found? | verdict |
|---------|--------|---------|
| deprecated api preserved | no | n/a |
| shim layer for old callers | no | n/a |
| dual-write to old/new format | no | n/a |
| version flag for old behavior | no | n/a |
| re-export for renamed module | no | n/a |

no unprescribed backwards compatibility patterns found.

---

## conclusion

all backwards compatibility in the blueprint traces to explicit wish requirements:

1. **env var fallback**: wisher said "cicd will work out of the box"
2. **explicit --auth preserved**: extant api, no removal requested
3. **keyrack first**: wisher said "default to keyrack first" (implies fallback order)

no unprescribed backcompat hacks or shims detected.

