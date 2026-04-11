# self-review: has-pruned-backcompat

## backwards compat concerns in blueprint

### concern 1: give.feedback.sh symlink

**what is it?**: symlink from give.feedback.sh → feedback.give.sh

**did wisher explicitly request?**: yes

from the wish:
> "renames `give.feedback` → `feedback.give` (keep old as symlink)"

**evidence of need**: explicit wisher request.

**verdict**: keep — explicit requirement.

### concern 2: extant giveFeedback.ts kept (not deleted)

**what is it?**: the extant giveFeedback.ts in domain.operations is updated, not replaced.

**did wisher explicitly request?**: no — but this is normal refactor pattern.

**evidence of need**: file exists, has tests, no reason to delete and recreate.

**verdict**: keep — normal refactor, not a backcompat concern.

## search for other backcompat concerns

searched blueprint for: compat, alias, legacy, deprecate, old

| term | found? | context |
|------|--------|---------|
| compat | yes | "backwards compat" symlink |
| alias | yes | "symlink alias" |
| legacy | no | - |
| deprecate | no | - |
| old | no | - |

only one backcompat concern found: the symlink.

## is the symlink truly needed?

**what if we didn't have it?**:
1. extant workflows that use `rhx give.feedback` would break
2. hooks that reference `give.feedback` would fail
3. docs/tutorials that mention `give.feedback` would be wrong

**evidence of extant usage**:
- give.feedback.sh exists in current codebase
- it's been the command name since introduction
- wisher explicitly mentioned "keep old as symlink"

**verdict**: the symlink is justified by explicit wisher request.

## issues found

none. the only backcompat concern (symlink) is explicitly requested by wisher.

## conclusion

all backcompat concerns are either:
1. explicitly requested (symlink)
2. normal refactor patterns (update extant file)

no assumed "to be safe" backcompat found.
