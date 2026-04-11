# self-review: has-pruned-backcompat (r6)

## continued from r5

r5 identified the symlink as the only backcompat concern. this r6 questions deeper: is the symlink the right approach?

## deeper analysis of symlink approach

### alternative 1: no alias at all

**what would happen?**: all `rhx give.feedback` calls would fail with "skill not found".

**impact**:
- any hooks that use `give.feedback` would break
- any documentation would be stale
- users would need to update their calls

**verdict**: too disruptive — wisher explicitly requested alias.

### alternative 2: deprecation warning instead of clean alias

**what would happen?**: `rhx give.feedback` works but prints warning.

**pros**:
- users know to update their calls
- gradual migration

**cons**:
- more complex implementation
- wisher didn't ask for warnings

**verdict**: over-engineering — wisher just asked for symlink.

### alternative 3: rename only, no alias

**what would happen?**: same as alternative 1.

**verdict**: already rejected — wisher explicitly said "keep old as symlink".

## is symlink the simplest approach?

| approach | complexity | meets requirement? |
|----------|------------|-------------------|
| symlink | 1 line | yes |
| wrapper command | 3+ lines | yes |
| deprecation warning | 10+ lines | exceeds requirement |
| no alias | 0 lines | no |

symlink is the simplest approach that meets the requirement.

## could there be hidden backcompat concerns?

**checked**:
1. CLI argument changes? no — feedbackGive uses same args as giveFeedback
2. output format changes? no — treestruct output is consistent
3. exit code changes? no — same semantics
4. file location changes? yes — feedback now in subdir, but this is explicit wisher request

**the subdir change**:
- before: `.behavior/my-feature/artifact.[feedback].v1.[given].by_human.md`
- after: `.behavior/my-feature/feedback/artifact.[feedback].v1.[given].by_human.md`

**is this a backcompat concern?**: no — it's an explicit wisher request from the wish:
> "lets move the feedback path produced by feedback.give into $behavior/feedback/..."

## issues found

none. the only backcompat concern (symlink) is:
1. explicitly requested
2. the simplest approach
3. no hidden backcompat issues

## why this holds

1. wisher explicitly said "keep old as symlink"
2. symlink is standard unix pattern for aliases
3. no deprecation warning needed — wisher didn't ask for it
4. file location change is explicit request, not backcompat

## conclusion

backcompat review passed. no assumed "to be safe" backcompat.
