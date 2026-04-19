# self-review: has-pruned-backcompat (r2)

## question

did we add backwards compatibility that was not explicitly requested?

## review

### backwards compat check

| concern | answer |
|---------|--------|
| any deprecated methods? | no |
| any fallback logic? | no |
| any "to be safe" assumptions? | no |
| any version checks? | no |

### why this holds

1. **--wish is additive**: the feature adds a new optional argument. all prior invocations remain valid.

2. **no changes that break prior behavior**: init.behavior without --wish works exactly as before

3. **no backwards compat code added**: since the feature is additive, no compat shims were needed or added

## conclusion

no backwards compatibility concerns. feature is purely additive.
