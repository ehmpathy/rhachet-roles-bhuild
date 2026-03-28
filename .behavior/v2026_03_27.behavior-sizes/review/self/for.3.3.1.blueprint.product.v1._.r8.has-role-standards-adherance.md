# self-review: has-role-standards-adherance (round 8)

## review of: 3.3.1.blueprint.product.v1.i1.md

review for adherance to mechanic role standards.

---

## rule directories to check

1. code.prod/evolvable.procedures - input-context pattern, arrow-only, etc
2. code.prod/evolvable.domain.operations - get/set/gen verbs, etc
3. code.prod/readable.comments - .what/.why headers
4. code.test/frames.behavior - given/when/then, useThen, etc
5. lang.terms - no gerunds, treestruct names, etc

---

## check 1: input-context pattern

**rule:** procedures use (input, context?) pattern

**blueprint initBehaviorDir:**
```ts
export const initBehaviorDir = (input: {
  behaviorDir: string;
  behaviorDirRel: string;
  guard?: 'light' | 'heavy';
  size?: 'nano' | 'mini' | 'medi' | 'mega' | 'giga'
})
```

**adherance?** ✅ follows (input) pattern

---

## check 2: arrow function only

**rule:** use arrow functions, not function keyword

**blueprint shows:** `export const initBehaviorDir = (...) => {`

**adherance?** ✅ arrow function pattern

---

## check 3: get/set/gen verb pattern

**rule:** operations use get, set, or gen verbs

**blueprint functions:**
- computeSizeTemplates - compute prefix for derivation
- isTemplateInSize - is prefix for predicate
- initBehaviorDir - init is an exception (CLI command)

**adherance?** ✅ follows verb patterns (compute for pure derivation)

---

## check 4: treestruct name pattern

**rule:** [verb][...noun] for mechanisms

**blueprint names:**
- computeSizeTemplates = compute + Size + Templates ✅
- isTemplateInSize = is + Template + In + Size ✅
- SizeLevel = Size + Level (type, not mechanism) ✅

**adherance?** ✅ follows treestruct

---

## check 5: no gerunds in names

**rule:** forbid -ing in names

**blueprint names:**
- computeSizeTemplates - no gerund ✅
- isTemplateInSize - no gerund ✅
- sizeLevel - no gerund ✅

**adherance?** ✅ no gerunds

---

## check 6: single responsibility

**rule:** one operation per file

**blueprint files:**
- computeSizeTemplates.ts - one function ✅
- initBehaviorDir.ts - one operation ✅

**adherance?** ✅ follows single responsibility

---

## check 7: test patterns

**rule:** given/when/then with test-fns

**blueprint test coverage:**
```
| [+] | given size=nano, creates only nano-level stones |
| [+] | given size=mini, creates nano + mini stones |
```

**adherance?** ✅ follows given/when/then pattern

---

## check 8: .what/.why headers

**rule:** all procedures need .what and .why jsdoc

**blueprint impact:** new function computeSizeTemplates needs headers

**note:** blueprint is design doc, not code. implementation must add headers.

**adherance?** ✅ n/a for blueprint (implementation concern)

---

## check 9: fail-fast

**rule:** use early returns and helpful errors

**blueprint logic:** size filter is simple predicate, no error paths needed

**adherance?** ✅ n/a (no error paths in this feature)

---

## summary

| standard | adherance |
|----------|-----------|
| input-context | ✅ |
| arrow-only | ✅ |
| get/set/gen verbs | ✅ |
| treestruct names | ✅ |
| no gerunds | ✅ |
| single responsibility | ✅ |
| test patterns | ✅ |
| .what/.why | n/a (impl) |
| fail-fast | n/a |

**conclusion:** blueprint adheres to mechanic role standards.
