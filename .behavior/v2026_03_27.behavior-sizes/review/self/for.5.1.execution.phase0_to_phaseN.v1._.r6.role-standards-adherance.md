# self-review: role-standards-adherance (r6)

## rule directories checked

from `.agent/repo=ehmpathy/role=mechanic/briefs/practices/`:
1. `code.prod/evolvable.procedures/` - input-context, named args, single responsibility
2. `code.prod/evolvable.architecture/` - wet over dry, domain-driven
3. `code.prod/pitofsuccess.errors/` - fail-fast, no failhide
4. `code.prod/pitofsuccess.typedefs/` - no as-cast, shapefit
5. `code.prod/readable.comments/` - what-why headers
6. `code.prod/readable.narrative/` - no elses, early returns
7. `code.test/frames.behavior/` - given-when-then
8. `lang.terms/` - no gerunds, noun_adj order, treestruct

## adherance per rule category

### evolvable.procedures

**rule.require.input-context-pattern**
- getAllTemplatesBySize: `(input: { size: BehaviorSizeLevel })` ✓
- isTemplateInSize: `(input: { templateName: string; size: BehaviorSizeLevel })` ✓
- initBehaviorDir: `(input: { behaviorDir, behaviorDirRel, size?, guard? })` ✓

**rule.require.arrow-only**
- all functions use arrow syntax ✓

**rule.require.named-args**
- all functions take named objects ✓

**rule.require.single-responsibility**
- getAllTemplatesBySize.ts: single file with related exports ✓
- isTemplateInSize: single purpose ✓

### evolvable.architecture

**rule.prefer.wet-over-dry**
- no premature abstractions ✓
- BEHAVIOR_SIZE_CONFIG is single source of truth, not abstraction ✓

**rule.require.domain-driven-design**
- BehaviorSizeLevel is a proper domain type ✓

### pitofsuccess.errors

**rule.require.fail-fast**
- no hidden error handle ✓
- no try/catch without rethrow ✓

**rule.forbid.failhide**
- no swallowed errors ✓

### pitofsuccess.typedefs

**rule.forbid.as-cast**
- one `as BehaviorSizeLevel[]` at line 91: acceptable for Object.keys() ✓
- documented via config satisfies Record ✓

**rule.require.shapefit**
- types fit without force ✓

### readable.comments

**rule.require.what-why-headers**
- file header: `.what = configuration and utilities...` ✓
- function headers: `.what = get all templates...` ✓
- `.why` documented for each ✓

### readable.narrative

**rule.forbid.else-branches**
- no else branches in code ✓

**rule.require.narrative-flow**
- early returns used in isTemplateInSize ✓
- linear flow in computeTemplatesToProcess ✓

### code.test

**rule.require.given-when-then**
- tests use given/when/then from test-fns ✓
- proper test structure ✓

### lang.terms

**rule.forbid.gerunds**
- no gerunds in code ✓
- variable names: `templateName`, `sizeLevel` ✓

**rule.require.order.noun_adj**
- `sizeLevel` (noun_adj) ✓
- `guardLevel` (noun_adj) ✓
- `templateName` (noun) ✓

**rule.require.treestruct**
- `getAllTemplatesBySize` (verb first) ✓
- `isTemplateInSize` (predicate prefix) ✓

## violations found

**none.** all code follows mechanic role standards.

## summary

| category | rules checked | violations |
|----------|---------------|------------|
| evolvable.procedures | 4 | 0 |
| evolvable.architecture | 2 | 0 |
| pitofsuccess.errors | 2 | 0 |
| pitofsuccess.typedefs | 2 | 0 |
| readable.comments | 1 | 0 |
| readable.narrative | 2 | 0 |
| code.test | 1 | 0 |
| lang.terms | 3 | 0 |

## conclusion

all implementation code adheres to mechanic role standards. no violations detected.
