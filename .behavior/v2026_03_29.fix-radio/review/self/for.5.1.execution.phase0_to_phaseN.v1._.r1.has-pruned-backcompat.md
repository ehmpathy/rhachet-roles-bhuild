# self-review: has-pruned-backcompat

review for backwards compatibility not explicitly requested.

---

## backcompat concerns reviewed

### BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN constant retained

| question | answer |
|----------|--------|
| did wisher explicitly request this compat? | no — but it's not backcompat |
| is there evidence this is needed? | yes — tests case2/case3 use it to test explicit `--auth` mode |
| did we assume "to be safe"? | no — it tests the explicit auth path, not a fallback |

**analysis**: this is NOT backwards compatibility. the constant is used to test that `--auth as-robot:env(VAR)` still works. the deprecation note clarifies that NEW tests should use default keyrack auth.

**verdict**: not a backcompat concern — it's explicit auth mode test coverage

### GITHUB_TOKEN fallback removed

| question | answer |
|----------|--------|
| did wisher request removal? | yes — blueprint: "removed GITHUB_TOKEN fallback" |
| was this backcompat? | yes — old code fell back to GITHUB_TOKEN env var |
| did we preserve it? | no — removed as prescribed |

**verdict**: backcompat intentionally removed per blueprint

### extant --auth modes preserved

| question | answer |
|----------|--------|
| did wisher request preservation? | implicitly yes — blueprint shows these modes in contract |
| are these backcompat or core functionality? | core functionality — not fallbacks |

modes preserved:
- `as-robot:shx(...)` — explicit shell command
- `as-robot:env(...)` — explicit env var
- `as-human` — gh cli session

**verdict**: core functionality, not backcompat

---

## conclusion

no unasked-for backwards compatibility detected.

the only backcompat that existed (GITHUB_TOKEN fallback) was explicitly removed per the blueprint. all preserved modes are core functionality, not fallbacks.
