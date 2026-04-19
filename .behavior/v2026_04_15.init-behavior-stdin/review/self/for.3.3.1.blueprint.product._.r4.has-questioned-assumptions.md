# self-review r4: has-questioned-assumptions

## why r4?

r3 identified two issues and they were fixed in the blueprint. this r4 verifies the fixes are in place and no new assumptions were introduced.

---

## r3 issues verified as fixed

### issue 1: exit code semantics

**r3 found**: blueprint used exit(1) for all errors, but constraint errors should use exit(2)

**verification**: checked `3.3.1.blueprint.product.yield.md` lines 190-203

```ts
  // validate non-empty
  if (!wishContent) {
    console.error('error: --wish requires content');
    process.exit(2);  // constraint error: user must fix
  }
  ...
  if (wishCurrent.trim() !== 'wish =') {
    console.error('error: wish file has been modified');
    console.error('');
    console.error('to overwrite, delete the wish file first:');
    console.error(`  rm ${wishPathRel}`);
    process.exit(2);  // constraint error: user must fix
  }
```

**status**: fixed — both constraint errors now use exit(2) with explanatory comments

### issue 2: undefined wishPathRel variable

**r3 found**: `wishPathRel` was used in error message but not defined

**verification**: checked `3.3.1.blueprint.product.yield.md` line 196

```ts
  const wishPathRel = relative(process.cwd(), wishPath);
```

**status**: fixed — variable is now defined before use

---

## re-examination of assumptions

### do the fixes introduce new assumptions?

**new code**: `relative(process.cwd(), wishPath)`

**assumption**: `relative` function is imported from 'path' module

**question**: is this import stated anywhere?

**analysis**: the blueprint shows implementation detail code snippets, not complete files. imports are implied by standard node conventions. `join` is already used (line 195), which implies `path` module import. `relative` is from the same module.

**verdict**: no new hidden assumptions — follows same pattern as extant `join` usage

---

## all 8 assumptions re-verified

| # | assumption | status | holds because |
|---|------------|--------|---------------|
| 1 | readFileSync(0) reads stdin | holds | evidence: used in feedback.take.set.ts |
| 2 | template is `wish =` | likely holds | verify at implementation |
| 3 | file exists after init | holds | findsert semantics |
| 4 | write format correct | holds | human-readable, aesthetic |
| 5 | empty = invalid | holds | vision says error on empty |
| 6 | spread pattern works | holds | JS semantics correct |
| 7 | exit codes | **fixed** | now uses exit(2) for constraints |
| 8 | wishPathRel defined | **fixed** | now defined with relative() |

---

## verdict

r3 issues are verified as fixed in the blueprint. no new hidden assumptions were introduced by the fixes.

the blueprint's technical assumptions are sound:
- all evidence-based assumptions verified against research citations
- all habit-based assumptions questioned and justified
- two issues found, fixed, and verified

