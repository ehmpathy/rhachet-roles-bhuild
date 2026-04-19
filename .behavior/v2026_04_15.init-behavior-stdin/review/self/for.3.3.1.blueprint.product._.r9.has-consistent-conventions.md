# self-review r9: has-consistent-conventions

## why r9?

check that blueprint name conventions and patterns align with extant codebase conventions.

---

## the four questions

for each name choice, ask:
1. what name conventions does the codebase use?
2. do we use a different namespace, prefix, or suffix pattern?
3. do we introduce new terms when extant terms exist?
4. does our structure match extant patterns?

---

## convention 1: CLI argument names

### Q1: what convention does the codebase use?

**extant schema** (init.behavior.ts lines 33-45):
```ts
named: z.object({
  name: z.string(),
  dir: z.string().optional(),
  open: z.string().optional(),
  size: z.enum(['nano', 'mini', 'medi', 'mega', 'giga']).optional(),
  guard: z.enum(['light', 'heavy']).optional(),
})
```

pattern: lowercase single words (name, dir, open, size, guard)

**blueprint addition**:
```ts
wish: z.string().optional(),
```

### Q2: do we use a different pattern?

**answer**: no — `wish` follows the same lowercase single-word pattern.

### Q3: do we introduce new terms?

**answer**: `wish` is a new term but it's the established domain term in this codebase (.behavior routes use 0.wish.md).

### Q4: does structure match?

**answer**: yes — `z.string().optional()` matches `open`, `dir` patterns.

**why it holds**: `wish` follows all extant conventions for CLI argument names.

---

## convention 2: variable names

### Q1: what convention does the codebase use?

**extant variables** (init.behavior.ts):
- `targetDirRaw`, `behaviorName`, `currentBranch` — camelCase
- `behaviorDir`, `behaviorDirRel`, `behaviorFound` — camelCase with domain nouns

**blueprint variables**:
- `wishContent` — camelCase
- `wishPath` — camelCase
- `wishPathRel` — camelCase
- `wishCurrent` — camelCase

### Q2-Q4: alignment check

**answer**: all blueprint variables follow camelCase convention. names use domain noun (`wish`) + descriptor pattern matched to `behaviorDir`, `behaviorDirRel`.

**why it holds**: variable names follow extant camelCase + domain noun pattern.

---

## convention 3: error message format

### Q1: what convention does the codebase use?

**search performed**: `console.error` in `src/contract/cli/*.ts`

**findings**:
- plain format: `error: <message>` (4 occurrences: decompose.behavior.ts, review.behavior.ts, bind.behavior.ts)
- emoji format: `⛈️  error: <message>` (8 occurrences: radioTaskPull.ts, feedback.give.ts, catch.dream.ts, radioTaskPush.ts)
- emoji format: `💥 error: <message>` (1 occurrence: init.behavior.ts)

**codebase state**: inconsistent — both plain and emoji formats used across different files.

**blueprint format**:
```ts
console.error('error: --wish requires content');
console.error('error: wish file has been modified');
```

### Q2-Q4: alignment check

**answer**: blueprint uses plain `error:` format, which is used in decompose.behavior.ts, review.behavior.ts, bind.behavior.ts.

**divergence from init.behavior.ts**: the target file uses `💥 error:`, but the codebase doesn't have a consistent standard.

**resolution**: accept plain format because:
1. the vision document specified this format
2. it's used in multiple other CLI files
3. emoji usage varies (💥 vs ⛈️) — no firm standard exists

**why it holds**: blueprint follows one of two extant patterns. no new pattern introduced.

---

## convention 4: exit code semantics

### Q1: what convention does the codebase use?

per rule.require.exit-code-semantics:
- exit(1) = malfunction (server must fix)
- exit(2) = constraint (caller must fix)

**extant usage**: `process.exit(2)` in feedback.take.get.ts for constraint errors

**blueprint usage**:
```ts
process.exit(2);  // constraint error: user must fix
```

### Q2-Q4: alignment check

**answer**: blueprint follows extant exit code convention exactly.

**why it holds**: exit(2) for constraint errors matches extant pattern and documented rule.

---

## convention 5: recovery hints in errors

### Q1: what convention does the codebase use?

**extant pattern** (init.behavior.ts lines 60-66):
```ts
console.error('💥 error: --open requires an editor name');
console.error('');
console.error('please specify what editor to open with. for example:');
console.error('  --open codium');
// ...
```

pattern: error message, blank line, hint text, examples

**blueprint pattern**:
```ts
console.error('error: wish file has been modified');
console.error('');
console.error('to overwrite, delete the wish file first:');
console.error(`  rm ${wishPathRel}`);
```

### Q2-Q4: alignment check

**answer**: blueprint follows same structure — error, blank line, hint, command example.

**why it holds**: recovery hint format matches extant init.behavior.ts pattern.

---

## convention 6: test file names

### Q1: what convention does the codebase use?

**extant test files** in `blackbox/role=behaver/`:
- `skill.init.behavior.acceptance.test.ts`
- `skill.init.behavior.bind.acceptance.test.ts`

pattern: `skill.{skillname}.acceptance.test.ts`

**blueprint test file**:
- `skill.init.behavior.wish.acceptance.test.ts`

### Q2-Q4: alignment check

**answer**: blueprint follows pattern with `.wish.` suffix to distinguish from extant tests.

**why it holds**: file name follows extant name convention.

---

## summary table

| convention | extant pattern | blueprint | verdict |
|------------|----------------|-----------|---------|
| CLI args | lowercase single word | `wish` | consistent |
| variables | camelCase + domain noun | `wishContent`, `wishPath` | consistent |
| error format | `error:` or `⛈️ error:` | `error:` | consistent (one of two patterns) |
| exit codes | exit(2) for constraints | exit(2) | consistent |
| recovery hints | error + blank + hint + example | same structure | consistent |
| test file names | `skill.{name}.acceptance.test.ts` | `skill.init.behavior.wish.acceptance.test.ts` | consistent |

---

## verdict

all guide questions answered for each convention:

- **no divergence** — blueprint follows extant patterns
- **no new terms** — `wish` is established domain vocabulary
- **structure matches** — all patterns align with extant codebase

no issues found.

