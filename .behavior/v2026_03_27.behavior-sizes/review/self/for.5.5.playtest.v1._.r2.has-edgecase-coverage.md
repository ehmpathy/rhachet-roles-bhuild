# self-review: has-edgecase-coverage (r2)

## the actual question

> are edge cases covered in the playtest?

let me enumerate potential edge cases and check coverage.

## edge cases identified

### 1. invalid size value

**scenario:** user passes `--size invalid`

**playtest coverage:** edgey paths section
```bash
npx tsx ../../../bin/run skill init.behavior --name bad-size --size invalid
```
**expected:** zod validation error, non-zero exit code

**status:** covered ✓

### 2. giga = mega (boundary)

**scenario:** user passes `--size giga`

**playtest coverage:** edgey paths section
```bash
npx tsx ../../../bin/run skill init.behavior --name giga-test --size giga
```
**expected:** same file count as mega (~44 files)

**status:** covered ✓

### 3. size + guard compose (orthogonality)

**scenario:** user passes both `--size mini --guard heavy`

**playtest coverage:** happy path 5

**status:** covered ✓

### 4. empty --size value

**scenario:** user passes `--size` without value

**playtest coverage:** NOT explicitly covered

**impact:** zod will error ("Expected string, received undefined" or similar)

**status:** acceptable gap. zod handles this automatically.

### 5. case sensitivity

**scenario:** user passes `--size NANO` or `--size Nano`

**playtest coverage:** NOT covered

**impact:** zod enum is case-sensitive, will error

**status:** acceptable gap. case-sensitivity is standard for CLI flags.

### 6. duplicate --size flags

**scenario:** user passes `--size nano --size mega`

**playtest coverage:** NOT covered

**impact:** last value wins (standard zod behavior)

**status:** acceptable gap. edge case with undefined behavior.

### 7. idempotent re-run with different size

**scenario:** run `--size nano`, then `--size mega` on same behavior

**playtest coverage:** NOT covered

**impact:** findsert semantics - extant files kept, new files added

**status:** acceptable gap. findsert behavior is tested elsewhere.

## edge case coverage summary

| edge case | playtest? | status |
|-----------|-----------|--------|
| invalid size value | yes | covered |
| giga = mega boundary | yes | covered |
| size + guard compose | yes | covered |
| empty --size value | no | zod handles |
| case sensitivity | no | standard behavior |
| duplicate flags | no | undefined, acceptable |
| re-run different size | no | findsert tested elsewhere |

## what could go wrong?

1. **zod error on invalid input** - covered via edgey path
2. **wrong templates for size** - covered via happy paths 1-4
3. **size/guard interference** - covered via happy path 5
4. **giga differs from mega** - covered via edgey path

## why this holds

the critical edge cases are covered:
- invalid input (zod error)
- boundary value (giga = mega)
- flag orthogonality (size + guard)

the gaps are acceptable:
- zod handles empty values automatically
- case sensitivity is standard CLI behavior
- duplicate flags is undefined edge case
