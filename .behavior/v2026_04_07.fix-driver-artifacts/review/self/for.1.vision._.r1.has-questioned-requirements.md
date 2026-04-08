# self-review: has-questioned-requirements

## requirement 1: rename from `v1.i1.md` to `yield.md`

**who said this was needed?** the wisher, in `0.wish.md`

**what evidence supports this requirement?**
- `v1.i1.md` is opaque — "i1" means "iteration 1" but this is not obvious
- `yield.md` is self-documented — it is what the stone produces
- the wisher explicitly states it "better alphaorders and names what the artifact really is"

**what if we did not do this?**
- users continue to wonder what `v1.i1` means
- files continue to sort in a less intuitive order
- no functional impact, only ergonomic

**is the scope too large, too small, or misdirected?**
- scope is appropriate — it is a name convention change
- impacts: stone templates, references in templates, potentially tests
- not too large: does not touch core logic

**could we achieve the goal in a simpler way?**
- simpler alternatives considered:
  - `out.md` — shorter but less evocative
  - `output.md` — clear but longer
  - `result.md` — common but does not pair as well with "stone"
- `yield.md` is the wisher choice and has strong semantic fit (stone yields result)

**verdict: requirement holds**

---

## requirement 2: better alpha-order

**who said this was needed?** the wisher, in `0.wish.md`

**what evidence supports this requirement?**
- `y` sorts after `s` (stone) — so `1.vision.yield.md` sorts after `1.vision.stone`
- current `v1.i1.md` sorts inconsistently based on the stone name prefix

**what if we did not do this?**
- files would continue to sort in unpredictable ways
- users would need to mentally group files

**is the scope too large, too small, or misdirected?**
- this is a secondary benefit of the rename, not a separate requirement
- the primary goal is clearer name; better sort order is a bonus

**verdict: requirement holds**

---

## implicit requirements discovered

### assumption: yield files are always markdown

- this is assumed but not stated in the wish
- flagged in vision as an open question
- **action**: validate with wisher if non-md yields are needed

### assumption: one yield per stone

- the pattern implies `{stone}.yield.md` — singular
- what if a stone produces multiple outputs?
- **action**: validate with wisher if multiple yields are needed

---

## summary

| requirement | source | holds? |
|-------------|--------|--------|
| rename `v1.i1.md` to `yield.md` | wish | yes |
| better alpha-order | wish | yes (inherent in rename) |
| yields are always `.md` | implicit | needs validation |
| one yield per stone | implicit | needs validation |

all explicit requirements hold. implicit assumptions flagged for validation.
