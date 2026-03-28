# self-review: has-questioned-assumptions

## review of: 3.3.1.blueprint.product.v1.i1.md

---

## assumption 1: separate computeSizeTemplates.ts file

**what do we assume?** that size template logic warrants its own file

**evidence?** none provided by wisher - this is an implementation choice

**what if opposite were true?** could inline in initBehaviorDir.ts

**verdict:** ✅ acceptable - separation aids readability, but could also inline. either works.

---

## assumption 2: base names in template lists

**what do we assume?** guard filter runs AFTER size filter

**evidence?** the extant code filters guards; we add size filter before

**what if opposite were true?** if size filter ran after, we'd need guard variants in size lists

**verdict:** ✅ correct - size filter first, guard filter second is cleaner

---

## assumption 3: giga = mega (same templates)

**what do we assume?** giga provides no new templates, just signals decomposition

**evidence?** vision says "giga = same stones as mega - signals decomposition expected"

**wisher confirm?** yes - wisher said "giga 'novel domain work, with decomposition expected'"

**verdict:** ✅ holds - wisher confirmed

---

## assumption 4: refs/ subdirectory approach

**what do we assume?** that refs/ is the right path for feedback template

**evidence?** wisher said "refs/template.[feedback].v1.[given].by_human.md"

**what if opposite were true?** could keep flat structure with different name

**verdict:** ✅ holds - wisher chose the path explicitly

---

## assumption 5: all templates have clear size ownership

**what do we assume?** every template belongs to exactly one size level

**evidence?** vision shows clear categorization

**counterexamples?** guards accompany stones - are they counted separately?

**verdict:** ⚠️ clarification needed - guards are NOT separate; they accompany their stone's size level. the guard file follows the stone file.

---

## assumption 6: verification and evaluation belong together

**what do we assume?** 5.2.evaluation and 5.3.verification are both mini-level

**evidence?** vision shows mini includes "5.2.evaluation.v1 (.stone + .guard)"

**question:** does nano include verification? wisher said no - "vision, blueprint, execution" only.

**verdict:** ✅ holds - nano has execution only, mini adds evaluation

---

## summary

| assumption | verdict | notes |
|------------|---------|-------|
| separate file | ✅ acceptable | implementation choice |
| base names | ✅ correct | filter order supports it |
| giga = mega | ✅ holds | wisher confirmed |
| refs/ path | ✅ holds | wisher chose it |
| template ownership | ⚠️ clarified | guards follow stones |
| evaluation in mini | ✅ holds | vision confirms |

no issues found that require blueprint changes.
