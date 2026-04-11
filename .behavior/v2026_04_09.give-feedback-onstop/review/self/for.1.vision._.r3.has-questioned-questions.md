# self-review: has-questioned-questions (round 3)

verify that the issue from round 2 was fixed.

## issue from round 2

**issue:** vision questions not triaged with [answered], [research], [wisher] markers.

**fix applied:** updated vision "open questions & assumptions" section.

## verification

checked the vision file. the section now includes:

```
### questions triaged

| question | triage | notes |
|----------|--------|-------|
| hash algorithm | [answered] | sha256, no truncation — standard practice |
| hash storage location | [wisher] | recommend: frontmatter in [taken] file |
| behavior scope | [wisher] | recommend: bound behavior only |
| hook registration | [research] | check extant skill patterns |
| backwards compat alias | [wisher] | keep `give.feedback` as alias? |
```

## triage summary

| triage | count | questions |
|--------|-------|-----------|
| [answered] | 1 | hash algorithm |
| [research] | 1 | hook registration |
| [wisher] | 3 | hash storage, behavior scope, backwards compat |

## issues found this round

none. the fix was applied correctly. questions are triaged and enumerated in vision.

## conclusion

all open questions are now triaged:
- 1 answered (hash algorithm = sha256)
- 1 for research phase (hook registration patterns)
- 3 for wisher (hash storage, scope, alias)

vision is ready for wisher review.
