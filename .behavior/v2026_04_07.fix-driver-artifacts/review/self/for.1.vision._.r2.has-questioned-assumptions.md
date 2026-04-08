# self-review: has-questioned-assumptions

## assumption 1: `yield.md` is the right suffix

**what do we assume here without evidence?**
- that `yield` is the best word for this concept
- that users will intuitively understand "yield" means "output of a stone"

**what evidence supports this assumption?**
- the wisher explicitly chose `yield` in the wish
- the agricultural metaphor (stone → yield, like seed → harvest) is consistent

**what if the opposite were true?**
- if users found `yield` unclear, they might prefer `out`, `output`, or `result`
- but the wisher has context on their users; we defer to their judgment

**did the wisher actually say this, or did we infer it?**
- the wisher explicitly said `yield.md` — not inferred

**verdict: assumption holds** — wisher's explicit choice

---

## assumption 2: yield files are always `.md`

**what do we assume here without evidence?**
- that all stone outputs are markdown files
- that we never need `yield.json`, `yield.ts`, etc.

**what evidence supports this assumption?**
- current system uses `.md` for all stone outputs
- markdown is human-readable and fits the behavior-driven workflow

**what if the opposite were true?**
- some stones might need to emit structured data (json, yaml)
- some stones might need to emit code (ts, sh)
- the pattern `{stone}.yield.md` would be too rigid

**did the wisher actually say this, or did we infer it?**
- INFERRED — the wisher only said `yield.md` as the pattern
- they did not specify whether other formats are needed

**verdict: flagged for validation** — ask wisher if non-md yields are needed

---

## assumption 3: one yield per stone

**what do we assume here without evidence?**
- each stone produces exactly one output file
- the pattern is `{stone}.yield.md` (singular)

**what evidence supports this assumption?**
- current `v1.i1.md` pattern is singular
- the wish says "the yield of the stone" (singular)

**what if the opposite were true?**
- a stone might produce multiple related outputs
- we would need `{stone}.yield/{name}.md` or similar

**did the wisher actually say this, or did we infer it?**
- INFERRED from the singular language in the wish
- not explicitly stated

**verdict: flagged for validation** — ask wisher if multiple yields are needed

---

## assumption 4: alpha-order matters

**what do we assume here without evidence?**
- that users navigate behavior directories via file browsers
- that file browsers alpha-sort by default

**what evidence supports this assumption?**
- the wisher explicitly said "better alphaorders"
- common file browsers (vscode, finder, etc.) sort alphabetically

**what if the opposite were true?**
- if users navigate via CLI (`ls -t`), alpha-order is irrelevant
- but the wisher's explicit mention suggests it matters to them

**verdict: assumption holds** — wisher's explicit priority

---

## assumption 5: the pattern applies uniformly

**what do we assume here without evidence?**
- all stones that emit output should use `yield.md`
- there are no exceptions or special cases

**what evidence supports this assumption?**
- consistency is valuable for learnability
- the wish describes a uniform pattern

**what if the opposite were true?**
- some stones might have special output conventions
- vision might use `vision.md` instead of `vision.yield.md`

**did the wisher actually say this, or did we infer it?**
- INFERRED — the wisher described the general pattern
- did not mention exceptions

**verdict: assume uniform for now** — flag if exceptions arise in implementation

---

## summary

| assumption | evidence | inferred? | verdict |
|------------|----------|-----------|---------|
| `yield` is right word | wisher said it | no | holds |
| yields are `.md` only | current usage | yes | validate |
| one yield per stone | singular language | yes | validate |
| alpha-order matters | wisher said it | no | holds |
| uniform pattern | consistency | yes | assume |

two assumptions need validation with wisher before we proceed to blueprint.
