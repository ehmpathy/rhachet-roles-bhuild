# self-review: has-consistent-conventions (round 5)

## review of: 3.3.1.blueprint.product.v1.i1.md

review for divergence from extant names and patterns.

---

## name inventory from blueprint

1. `computeSizeTemplates` - function name
2. `isTemplateInSize` - predicate name
3. `SizeLevel` - type name
4. `NANO_TEMPLATES`, `MINI_ADDS`, etc. - constant names
5. `sizeLevel` - variable name
6. `refs/` - directory name

---

## check 1: function name pattern

**blueprint:** `computeSizeTemplates`

**extant patterns:**
- `computeTemplatesToProcess` in initBehaviorDir
- `compute*` prefix used for derived values

**analysis:**
- compute prefix: ✅ matches extant
- Size: describes the input dimension
- Templates: describes the output

**verdict:** ✅ consistent with extant pattern

---

## check 2: predicate name pattern

**blueprint:** `isTemplateInSize`

**extant patterns:**
- `isGuardLevelTemplate` in initBehaviorDir
- `is*` prefix used for boolean predicates

**analysis:**
- is prefix: ✅ matches extant
- TemplateInSize: describes the check

**verdict:** ✅ consistent with extant pattern

---

## check 3: type name pattern

**blueprint:** `SizeLevel`

**extant patterns:**
- GuardLevel type (implicit, but used as pattern)
- PascalCase for types

**analysis:**
- SizeLevel mirrors GuardLevel structure
- PascalCase: ✅ matches TypeScript convention

**verdict:** ✅ consistent with extant pattern

---

## check 4: constant name pattern

**blueprint:** `NANO_TEMPLATES`, `MINI_ADDS`, `MEDI_ADDS`, `MEGA_ADDS`

**extant patterns:**
- SCREAMING_SNAKE_CASE for constants
- template constants not found in codebase

**analysis:**
- SCREAMING_SNAKE_CASE: ✅ standard convention
- NANO_TEMPLATES: describes content (nano-level templates)
- *_ADDS: describes relationship (templates added at this level)

**alternative considered:** SIZE_TEMPLATES.nano, SIZE_TEMPLATES.mini, etc.
**why not:** separate constants are more explicit and easier to grep

**verdict:** ✅ consistent with standard convention

---

## check 5: variable name pattern

**blueprint:** `sizeLevel`

**extant patterns:**
- `guardLevel` variable in initBehaviorDir (proposed, mirrors extant)
- camelCase for variables

**analysis:**
- sizeLevel mirrors guardLevel structure
- camelCase: ✅ matches convention

**verdict:** ✅ consistent with extant pattern

---

## check 6: directory name pattern

**blueprint:** `refs/`

**extant patterns:**
- templates/ directory exists
- lowercase directory names

**analysis:**
- refs: short for references
- lowercase: ✅ matches convention
- wisher explicitly used "refs/" in vision

**verdict:** ✅ consistent with convention and vision

---

## check 7: term consistency

**question:** do we introduce new terms when extant terms exist?

| blueprint term | extant term? | verdict |
|----------------|-------------|---------|
| size | novel (no prior "size" concept) | ✅ new term for new concept |
| level | used in GuardLevel | ✅ consistent reuse |
| template | used throughout | ✅ consistent reuse |
| nano/mini/medi/mega/giga | novel | ✅ new terms for new concept |

**verdict:** ✅ new terms only for new concepts

---

## summary

| name | pattern | consistent? |
|------|---------|-------------|
| computeSizeTemplates | compute* | ✅ |
| isTemplateInSize | is* | ✅ |
| SizeLevel | PascalCase, *Level | ✅ |
| NANO_TEMPLATES | SCREAMING_SNAKE | ✅ |
| sizeLevel | camelCase, *Level | ✅ |
| refs/ | lowercase | ✅ |

**conclusion:** all names follow extant conventions. no divergence found.
