# self-review: has-questioned-assumptions (round 2)

## review of: 3.3.1.blueprint.product.v1.i1.md

deeper dive with fresh eyes.

---

## assumption 7: template filter order matters

**what do we assume?** size filter must run before guard filter

**evidence?** the blueprint says "filter by size first, then select guard variant"

**what if reversed?** guard filter first, then size filter

**test the reversal:**
- guard filter selects .light or .heavy template variants
- size filter then decides if template is in this size level
- issue: if guard filter runs first, it produces base names like "1.vision.guard"
- size filter then checks if "1.vision.guard" is in size level
- problem: template lists have base names, so this works
- conclusion: order doesn't matter if size lists use base names

**verdict:** ✅ r1 was right to use base names - makes filter order irrelevant

---

## assumption 8: refs/ subdirectory is the right structure

**what do we assume?** refs/ is a subdirectory in the behavior dir

**evidence?** wisher said "refs/template.[feedback]..."

**what if opposite were true?** refs.template.[feedback]... (flat with prefix)

**did wisher mean subdirectory?** yes - slash in path implies directory

**implementation concern:** initBehaviorDir currently doesn't handle subdirectories

**verdict:** ⚠️ issue found - blueprint needs to add subdirectory creation logic

**fix verification:** blueprint already mentions "subdirectory creation for refs/" in codepath tree. ✅

---

## assumption 9: templates are static files

**what do we assume?** templates are read from filesystem at runtime

**evidence?** extant code: `readdirSync(TEMPLATES_DIR)`

**what if compiled into code?** could use object literals instead

**tradeoffs:**
- filesystem: easier to edit templates, harder to type-check
- compiled: harder to edit, better type safety

**verdict:** ✅ acceptable - follow extant pattern (filesystem)

---

## assumption 10: heavy guard variant only exists for some templates

**what do we assume?** not all templates have .heavy variants

**evidence?** extant templates show:
- 1.vision.guard has .light and .heavy
- 2.1.criteria.blackbox.guard has .heavy only (no .light)
- 3.3.1.blueprint.product.v1.guard has .light and .heavy

**implication:** if guard=light and template has no .light variant, what happens?

**check extant code:**
```ts
// skip guard-level templates that don't match chosen level
if (isGuardLevelTemplate && !templateName.endsWith(guardLevelChosenSuffix)) {
  continue;
}
```

**answer:** if 2.1.criteria.blackbox.guard.heavy exists but .light doesn't, light mode skips it entirely. this matches vision's claim: "light has no criteria guard".

**verdict:** ✅ extant behavior is correct and blueprint preserves it

---

## assumption 11: computeSizeTemplates returns template base names

**what do we assume?** size function returns ["1.vision.stone", "1.vision.guard"]

**not:** ["1.vision.guard.light", "1.vision.guard.heavy"]

**why this matters:** guard filter needs to match template names to size list

**implementation path:**
1. size filter: is this template (or its base name) in the size level?
2. guard filter: if it has variants, select the right one

**concern:** template name "1.vision.guard.light" must match base "1.vision.guard"

**verdict:** ⚠️ needs care - filter must strip suffix before size check

---

## summary of r2

| assumption | verdict | notes |
|------------|---------|-------|
| filter order | ✅ resolved | base names make order irrelevant |
| refs/ structure | ✅ covered | subdirectory in blueprint |
| filesystem templates | ✅ acceptable | follow extant pattern |
| heavy variants | ✅ correct | extant behavior preserved |
| base name match | ⚠️ needs care | filter must handle suffixes |

**r2 findings:**
- no new issues that require blueprint changes
- implementation must strip .light/.heavy before size check
