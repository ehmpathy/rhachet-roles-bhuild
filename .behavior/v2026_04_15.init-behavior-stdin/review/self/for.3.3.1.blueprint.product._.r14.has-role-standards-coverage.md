# self-review r14: has-role-standards-coverage

## why r14?

verify all relevant mechanic role standards are applied in the blueprint. check for patterns that should be present but are absent.

---

## rule directories checked

from `.agent/repo=ehmpathy/role=mechanic/briefs/practices/`:

1. `lang.terms/` — term conventions
2. `lang.tones/` — tone conventions
3. `code.prod/evolvable.procedures/` — procedure patterns
4. `code.prod/evolvable.domain.operations/` — operation patterns
5. `code.prod/pitofsuccess.errors/` — error standards
6. `code.prod/readable.narrative/` — narrative flow
7. `code.test/frames.behavior/` — bdd test patterns
8. `code.test/scope.coverage/` — test coverage requirements

---

## coverage check 1: error standards

### are all error paths covered?

| error case | covered in blueprint? | test case? |
|------------|----------------------|------------|
| empty wish (inline) | yes — lines 195-198 | [case3] |
| empty wish (stdin) | yes — same path | [case4] |
| modified wish file | yes — lines 205-211 | [case5] |
| absent --wish value | yes — zod schema | zod handles |

**analysis**: all error paths have explicit implementation and test coverage.

**verdict**: covered

---

### are error messages failloud?

| error | message | recovery hint? |
|-------|---------|---------------|
| empty wish | "error: --wish requires content" | no hint needed — clear |
| modified wish | "error: wish file has been modified" | yes — shows rm command |

**analysis**: modified wish error includes actionable recovery hint.

**verdict**: covered

---

### are exit codes semantic?

| error | exit code | semantic? |
|-------|-----------|-----------|
| empty wish | exit(2) | yes — constraint |
| modified wish | exit(2) | yes — constraint |

**analysis**: both use exit(2) for constraint errors (user must fix).

**verdict**: covered

---

## coverage check 2: test standards

### are all test types present?

| layer | required test type | present? |
|-------|--------------------|----------|
| contract | acceptance test | yes — skill.init.behavior.wish.acceptance.test.ts |
| contract | integration test | via acceptance |
| transformer | unit test | inline — tested via acceptance |

**analysis**: transformers are inline in contract file per rule.prefer.wet-over-dry. coverage via acceptance tests is sufficient for first occurrence.

**verdict**: covered

---

### does test tree show all case types?

| case type | examples present? |
|-----------|------------------|
| positive | [case1], [case2], [case6] |
| negative | [case3], [case4], [case5] |
| edge | [case7] backwards compat |
| journey | [case8] full lifecycle |

**analysis**: all four case types are represented.

**verdict**: covered

---

### are snapshots declared?

from blueprint test coverage section:

```
| inline non-empty | stdout tree |
| stdin non-empty | stdout tree |
| inline empty error | stderr |
| stdin empty error | stderr |
| inline + modified wish error | stderr |
```

**analysis**: all outputs are snapshotted for visual review in PRs.

**verdict**: covered

---

## coverage check 3: procedure standards

### is (input, context) pattern used?

**analysis**: this is a CLI entry point (contract layer). CLI entry points use `schemaOfArgs` pattern which is the contract equivalent of (input, context). context is implicit via node globals.

**verdict**: n/a for contract layer — covered

---

### are procedures single responsibility?

| codepath | responsibility |
|----------|---------------|
| getWishContent | extract @stdin or return inline |
| validateWishContent | check non-empty |
| validateWishFileState | check template-only |
| writeWishFile | write content to file |

**analysis**: each transformer has one clear responsibility.

**verdict**: covered

---

### is failfast applied?

from implementation:

```ts
if (!wishContent) {
  console.error('error: --wish requires content');
  process.exit(2);  // early exit
}
```

**analysis**: validation runs before directory creation (after r11 fix). early exit prevents partial state.

**verdict**: covered

---

## coverage check 4: narrative standards

### is codepath tree present?

yes — lines 57-74 of blueprint show full codepath tree with legend.

**verdict**: covered

---

### is sequence explicit?

codepath tree shows:

```
├── [+] getWishContent                 # BEFORE initBehaviorDir
├── [+] validateWishContent            # BEFORE initBehaviorDir
├── [○] initBehaviorDir                # only runs after wish validated
├── [+] validateWishFileState          # AFTER initBehaviorDir
├── [+] writeWishFile                  # if wish, populate 0.wish.md
└── [○] openFileWithOpener             # opens after wish populated
```

**analysis**: sequence is explicit with BEFORE/AFTER annotations.

**verdict**: covered

---

## coverage check 5: research citations

### are external patterns cited?

from blueprint research citations section:

| citation | pattern | action |
|----------|---------|--------|
| [1] | @stdin handler | [REUSE] from feedback.take.set.ts |
| [2] | zod schema | [EXTEND] |
| [3] | findsert semantics | [REUSE] |
| [4] | wish template format | [REUSE] |
| [5] | error output format | [REUSE] |
| [6] | editor open sequence | [REUSE] |

**analysis**: all reused patterns cite their source.

**verdict**: covered

---

## coverage check 6: implementation detail

### is implementation detail sufficient?

| section | present? | lines |
|---------|----------|-------|
| schema change | yes | 162-179 |
| wish extraction (BEFORE initBehaviorDir) | yes | 183-199 |
| wish file write (AFTER initBehaviorDir) | yes | 204-227 |
| test helper extension | yes | 229-255 |

**analysis**: implementation shows exact code snippets for all changes.

**verdict**: covered

---

## absent patterns check

### what should be present but might be absent?

| standard | present? |
|----------|----------|
| filediff tree | yes — lines 39-52 |
| codepath tree | yes — lines 57-103 |
| test coverage section | yes — lines 106-153 |
| implementation detail | yes — lines 157-255 |
| sequence section | yes — lines 277-284 |

**analysis**: all required blueprint sections are present.

**verdict**: no gaps

---

## summary

| category | coverage check | result |
|----------|---------------|--------|
| errors | all paths | covered |
| errors | failloud | covered |
| errors | exit codes | covered |
| tests | all types | covered |
| tests | case types | covered |
| tests | snapshots | covered |
| procedures | input-context | n/a |
| procedures | single responsibility | covered |
| procedures | failfast | covered |
| narrative | codepath tree | covered |
| narrative | sequence | covered |
| citations | external patterns | covered |
| detail | implementation | covered |

---

## verdict

all relevant mechanic role standards are applied.

no absent patterns found.

no issues remain.

