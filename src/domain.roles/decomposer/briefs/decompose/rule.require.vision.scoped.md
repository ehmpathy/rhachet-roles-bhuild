# vision.scoped

# severity = blocker

## .what
if parent has vision content, extract relevant guidance into each behavior.

## .how
- extract vision elements that apply to this behavior's scope
- adapt shared guidance to behavior's context
- if no vision elements apply, set to null (not empty text)
- preserve architectural constraints that span behaviors

## .when.null
set vision to null when:
- parent vision was empty
- no parent vision elements apply to this scope
- behavior is purely technical/infrastructural
