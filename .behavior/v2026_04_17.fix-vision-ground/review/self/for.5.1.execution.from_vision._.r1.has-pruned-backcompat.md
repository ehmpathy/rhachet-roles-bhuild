# self-review: has-pruned-backcompat

review for backwards compatibility concerns.

## changes made

1. **1.vision.stone**: added new `## groundwork` section
2. **1.vision.guard.light**: added new `has-grounded-in-reality` self-review
3. **1.vision.guard.heavy**: added new `has-grounded-in-reality` self-review

## backwards compatibility analysis

### is backwards compat needed?

**no** — these are template additions, not code changes.

templates are copied at init time (when `initBehaviorDir` runs). extant behaviors already initialized have their own copies and won't be affected by template updates.

new behaviors will get the new groundwork section and self-review.

### did we add any backwards compat code?

| pattern | present? |
|---------|----------|
| fallback for old format | no |
| migration logic | no |
| version checks | no |
| deprecation warnings | no |

### why no backwards compat is needed

1. templates are static text, not runtime code
2. extant behavior dirs are unaffected (they have their own copies)
3. new behaviors simply get the updated templates
4. no API contracts changed

## summary

no backwards compat concerns. pure addition to templates, no migration needed.
