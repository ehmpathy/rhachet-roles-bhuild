# self-review r4: has-pruned-yagni

## the question

did we add extras that were not prescribed?

---

## methodology

for each blueprint component, verify:
1. explicitly requested in vision or criteria?
2. minimum viable way to satisfy requirement?
3. no premature abstraction "for future flexibility"?
4. no features added "while we're here"?
5. no premature optimization?

---

## component audit

### 1. schema: `wish: z.string().optional()`

**requested?** yes — vision line 37: `--wish "inline words"`

**minimum viable?** yes — one line, optional string

**verdict**: not YAGNI — essential for the flag

---

### 2. getWishContent transformer

**requested?** yes — vision line 38: `--wish @stdin`

**minimum viable?** yes — 5 lines, checks for `@stdin` and reads fd 0

**alternatives considered:**
- could make @stdin automatic (detect pipe) — no, explicit is clearer
- could support @file — no, vision line 155 says use `cat | @stdin` instead

**verdict**: not YAGNI — required for @stdin pattern

---

### 3. validateWishContent transformer

**requested?** yes — vision line 129: `--wish ""` → error

**minimum viable?** yes — 4 lines, checks empty after trim

**verdict**: not YAGNI — pit-of-success requirement

---

### 4. validateWishFileState transformer

**requested?** yes — vision line 150-151: error if non-template content

**minimum viable?** yes — 6 lines, checks for template marker

**alternatives considered:**
- could add `--force` flag — no, vision says delete manually (simpler)
- could silently overwrite — no, vision says pit-of-success

**verdict**: not YAGNI — pit-of-success requirement

---

### 5. writeWishFile

**requested?** yes — vision line 66: wish file contains `wish = \n\n<content>`

**minimum viable?** yes — one writeFileSync call

**verdict**: not YAGNI — core feature

---

### 6. exit(2) for constraint errors

**requested?** not in vision, but required by brief `rule.require.exit-code-semantics`

**is this YAGNI?** no — follows repo standards, not a new feature

**verdict**: not YAGNI — adherence to standards

---

### 7. wishPathRel in error message

**requested?** implied by pit-of-success — error should tell user how to fix

**minimum viable?** yes — relative path is friendlier than absolute

**verdict**: not YAGNI — usability requirement

---

### 8. test helper extension (optional stdin param)

**requested?** not explicitly, but required to test @stdin cases

**minimum viable?** yes — extends extant function, doesn't create new one

**alternatives considered:**
- new function `runInitBehaviorSkillWithStdin` — rejected in r3, extend is simpler
- shell redirection in tests — rejected, execSync `input` is cleaner

**verdict**: not YAGNI — test infrastructure for required feature

---

### 9. acceptance test cases (7 cases)

| case | traces to |
|------|-----------|
| inline non-empty | vision line 37, criteria usecase.1 |
| stdin non-empty | vision line 38, criteria usecase.2 |
| inline empty error | vision line 129, criteria usecase.5 |
| stdin empty error | vision line 129, criteria usecase.5 |
| inline + modified wish error | vision line 150-151, criteria usecase.4 |
| inline + open combined | vision line 131, criteria usecase.3 |
| absent --wish backwards compat | vision line 67-68, criteria usecase.7 |

**verdict**: not YAGNI — all cases trace to requirements

---

## things NOT in the blueprint

| potential feature | why not added |
|-------------------|---------------|
| `--wish @file` | vision line 155 says no — use @stdin |
| `--force` flag | vision says delete manually |
| log/verbose mode | not requested |
| config file support | not requested |
| wish content validation (length, format) | not requested |
| multiline inline detection | not requested |

---

## verdict

no YAGNI violations found. every component in the blueprint:
- traces directly to vision or criteria
- is the minimum viable implementation
- has no premature abstraction
- has no "while we're here" additions
- has no premature optimization

the blueprint is lean.

