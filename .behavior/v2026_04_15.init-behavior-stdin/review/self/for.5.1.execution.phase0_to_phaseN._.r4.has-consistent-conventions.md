# self-review: has-consistent-conventions (r4)

## question

do new names diverge from extant conventions?

## review

### conventions check

| new name | extant pattern | verdict |
|----------|---------------|---------|
| getWishContent | get* prefix for retrieval ops | consistent |
| findsertWishFromInput | findsert* for find-or-create | consistent |
| wishInput | input param pattern | consistent |
| wishPath | path param pattern | consistent |

### why this holds

1. **get* prefix**: searched codebase for `export const get` - extant pattern uses getX for retrieval operations (e.g., getAllTemplatesBySize, getRouteDir). getWishContent follows this.

2. **findsert* prefix**: searched codebase for `findsert` - pattern used for find-or-create semantics. findsertWishFromInput follows same pattern.

3. **param names**: wishInput and wishPath follow extant patterns (e.g., behaviorDir, routeDir, templatePath in initBehaviorDir).

4. **directory structure**: operations placed in `domain.operations/behavior/init/` consistent with extant init operations.

5. **test file placement**: unit tests collocated with source files, consistent with extant pattern.

## conclusion

new names follow extant conventions. no divergence detected.

