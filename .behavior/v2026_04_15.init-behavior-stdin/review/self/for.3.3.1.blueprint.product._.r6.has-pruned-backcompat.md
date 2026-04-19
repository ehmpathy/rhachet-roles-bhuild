# self-review r6: has-pruned-backcompat

## why r6?

r5 identified compat concerns but didn't deeply answer the three questions from the guide for each. this r6 systematically answers all three questions for each concern.

---

## the three questions

for each backwards-compat concern:
1. did the wisher explicitly say to maintain this compatibility?
2. is there evidence this backwards compat is needed?
3. or did we assume it "to be safe"?

---

## compat concern 1: absent `--wish` maintains extant behavior

### Q1: did wisher explicitly say to maintain?

**answer**: yes

**quote from vision** (lines 67-68):
> - behavior directory created as before
> - route bound as before

the phrase "as before" is explicit request for backwards compat.

### Q2: is there evidence this is needed?

**answer**: yes

**evidence**: the vision's before/after table (lines 17-23) shows extant workflow:
> | before | after |
> | `rhx init.behavior --name foo --open nvim` | `rhx init.behavior --name foo --wish "..."` |

the "before" column shows extant usage. users currently run without `--wish`. they must continue to be able to do so.

### Q3: did we assume it "to be safe"?

**answer**: no

**proof**: the vision explicitly states "as before" twice. this is not an assumption — it's a requirement.

---

## compat concern 2: `--open` continues to work with `--wish`

### Q1: did wisher explicitly say to maintain?

**answer**: yes

**quote from original wish**:
> `rhx init.behavior --open nvim --name @branch --wish "to do some cool feature..."`

the wisher's example shows `--open` combined with `--wish`.

**quote from vision** (line 61):
> `rhx init.behavior --name @branch --open nvim --wish "quick note to expand on"`

**quote from vision** (line 131):
> `--wish "..."` + `--open nvim` → wish populated, then editor opens (user can expand)

### Q2: is there evidence this is needed?

**answer**: yes — the wisher's original example shows this combination

### Q3: did we assume it "to be safe"?

**answer**: no — it's in the original wish text

---

## compat concern 3: `--name @branch` continues to work

### Q1: did wisher explicitly say to maintain?

**answer**: implicitly yes

**quote from original wish**:
> `rhx init.behavior --open nvim --name @branch --wish "..."`

the wisher's example shows `--name @branch` combined with `--wish`.

### Q2: is there evidence this is needed?

**answer**: yes — the wisher assumes @branch works in their example

### Q3: did we assume it "to be safe"?

**answer**: no — the wisher's example requires it. however, the blueprint achieves this not by compat code but by NOT modifying @branch code path.

**implementation note**: the blueprint is additive. it doesn't touch `--name` logic. therefore no compat code exists for @branch — extant code just works.

---

## compat concern 4: all other extant flags

### Q1: did wisher explicitly say to maintain?

**answer**: implicitly yes via "as before" (vision lines 67-68)

### Q2: is there evidence this is needed?

**answer**: yes — "as before" implies all extant behavior preserved

### Q3: did we assume it "to be safe"?

**answer**: no — "as before" is explicit. but again, no compat CODE exists because blueprint is additive.

---

## key insight: additive design means no compat code

the blueprint preserves backwards compat NOT via compat code but via additive design:

| approach | code needed | used in blueprint |
|----------|-------------|-------------------|
| modify extant code + add compat | yes | no |
| add new code path, leave extant untouched | no | yes |

because the blueprint only ADDS code (schema field, wish logic after initBehaviorDir), extant behavior is preserved automatically. there is no compat code to prune.

---

## audit: is there any compat code to prune?

| potential compat code | exists in blueprint? | verdict |
|----------------------|---------------------|---------|
| check for old flag format | no | none to prune |
| migration from old behavior | no | none to prune |
| deprecation warnings | no | none to prune |
| fallback logic | no | none to prune |
| version checks | no | none to prune |

---

## verdict

**no compat code to prune** because:

1. all backwards compat requirements are explicitly stated (vision "as before", wisher's examples)
2. blueprint achieves compat via additive design, not compat code
3. there is no "to be safe" compat code — only additive changes

**no open questions** for the wisher about backwards compat.

