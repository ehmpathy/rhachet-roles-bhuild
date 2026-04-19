# self-review r5: has-pruned-backcompat

## the question

did we add backwards compatibility that was not explicitly requested?

---

## backwards compat concerns in blueprint

### concern 1: absent `--wish` maintains extant behavior

**where in blueprint**: test case 7 — "absent --wish backwards compat"

**explicitly requested?** yes

**evidence**: vision lines 67-68:
> - behavior directory created as before
> - route bound as before

**why it holds**: the vision explicitly says "as before" twice. this is not assumed — it's stated.

---

### concern 2: `--open` continues to work

**where in blueprint**: test case 6 — "inline + open combined"

**explicitly requested?** yes

**evidence**: vision line 131:
> `--wish "..."` + `--open nvim` → wish populated, then editor opens (user can expand)

and vision line 61:
> `rhx init.behavior --name @branch --open nvim --wish "quick note to expand on"`

**why it holds**: the wisher's original example shows both flags combined. the vision explicitly addresses this in the pit-of-success edgecases table.

---

### concern 3: `--name @branch` continues to work

**where in blueprint**: not explicitly addressed — relies on extant code

**explicitly requested?** implicitly yes

**evidence**: vision line 40:
> branch-derived name | `--name @branch --wish "..."`

**why it holds**: the vision shows `--name @branch` combined with `--wish`. this implies @branch must continue to work. the blueprint doesn't touch `--name` logic at all — it only adds `--wish` logic after initBehaviorDir.

**is this assumed backwards compat?** no — the blueprint doesn't add any code to preserve @branch. it simply doesn't modify the extant @branch code path.

---

### concern 4: all extant flags continue to work

**where in blueprint**: codepath tree shows `[○]` (retain) markers

**explicitly requested?** implicitly yes

**evidence**: vision line 67-68:
> - behavior directory created as before
> - route bound as before

**why it holds**: "as before" means all extant behavior is preserved. the blueprint achieves this by:
- `--wish` logic added AFTER initBehaviorDir (not changed)
- `openFileWithOpener` left unchanged
- no extant flag handlers modified

**is this assumed backwards compat?** no — the vision says "as before". the blueprint achieves this by additive change, not modification.

---

## backwards compat NOT in blueprint

did we add preservation code that wasn't needed?

| potential compat concern | added code? | why not |
|-------------------------|-------------|---------|
| preserve `--name` logic | no | not modified |
| preserve `--dir` logic | no | not modified |
| preserve `--size` logic | no | not modified |
| preserve `--guard` logic | no | not modified |
| preserve error messages | no | not modified |
| deprecation warnings | no | not requested |
| migration path | no | not requested |

the blueprint is purely additive — it doesn't modify extant behavior, so no compat code is needed.

---

## the test

**question**: did we add backwards compatibility "to be safe"?

**answer**: no. the vision explicitly says "as before" (lines 67-68). the blueprint achieves this through additive design:
- new schema field is optional
- new logic runs only when `named.wish` exists
- extant logic paths are untouched

---

## verdict

no unasked backwards compatibility. all compat concerns are either:
1. explicitly stated in vision ("as before" on lines 67-68)
2. implicit in wisher's examples (combined flags on line 61)
3. achieved via additive design (no modification = no compat code needed)

no open questions for the wisher about backwards compat.

