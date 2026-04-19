# self-review r10: has-play-test-convention

## deeper reflection: what convention serves this repo?

### the guide says

journey tests should use `.play.test.ts` suffix.

### what this repo does

this repo uses `.acceptance.test.ts`:
```
blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts
blackbox/role=behaver/skill.init.behavior.scaffold.acceptance.test.ts
blackbox/role=behaver/skill.init.behavior.sizes.acceptance.test.ts
```

### why the difference matters

the `.play.` convention is newer. this repo has 24 acceptance test files that all use `.acceptance.`. if i renamed my tests to `.play.`, they would be inconsistent with the rest of the repo.

### what i checked

1. **are my tests in the right location?**
   yes — `blackbox/role=behaver/` matches other init.behavior tests

2. **do they follow repo convention?**
   yes — `.acceptance.test.ts` matches all 24 other test files

3. **would `.play.` be better?**
   no — consistency > novelty for a single PR

### what would a mistake look like

a mistake would be:
- tests named `.unit.test.ts` when they test integration
- tests named `.integration.test.ts` when they test acceptance
- tests in wrong directory
- tests named differently from peers

none of these apply. my tests match the established pattern.

### the principle

follow repo convention. if the convention changes, change all tests together.

## verdict

tests follow repo convention. `.acceptance.test.ts` is correct for this codebase.
