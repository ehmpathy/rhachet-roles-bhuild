# self-review r2: has-questioned-questions

## triage of open questions

### question 1: should `--wish` and `--open` be mutually exclusive?

**can logic answer?** yes

the wisher's example shows: `--open nvim --name @branch --wish "to do some cool feature..."`

this explicitly combines both flags. the intent is clear: pre-populate, then expand in editor.

**resolution:** [answered] — both work together. wish is populated, then editor opens.

---

### question 2: what happens if wish file already has content?

**can logic answer?** partial

the init.behavior skill already has findsert semantics for the behavior directory — it reuses extant directories. the question is about the wish file content specifically.

**can extant code answer?** let me check...

the current init.behavior does not write wish content — it only creates the file from template if not extant. so this question is about new behavior.

**does only wisher know?** partially. the wisher didn't specify, so this is a design decision.

**logic-based answer:** two options:
1. **overwrite always** — simple, but might lose user's prior work
2. **findsert** — preserve extant, error if user provides different content

the pit-of-success suggests: warn if extant content differs, allow `--force` to overwrite.

but for v1, simplest is: error if wish file has non-template content. user can use `--open` to edit.

**resolution:** [answered] — error if wish file has non-template content. simplest pit-of-success.

---

### question 3: should we support `--wish @file`?

**can logic answer?** yes

@stdin covers this usecase via `cat file.txt | rhx init.behavior --wish @stdin`.

add @file would add complexity for marginal benefit. kiss.

**resolution:** [answered] — no @file support. @stdin is sufficient.

---

### question 4 (from assumptions review): empty wish error?

**can logic answer?** yes

if user provides `--wish ""`:
- with `--open`: valid — create structure, open editor to fill in
- without `--open`: questionable — why create behavior with empty wish?

**pit-of-success answer:**
- `--wish ""` without `--open` → error: provide wish content or use --open
- `--wish ""` with `--open` → valid: create structure, open editor

but this adds complexity. simpler: require non-empty wish content always. if user wants to just create structure, they can omit `--wish` entirely.

**resolution:** [answered] — require non-empty wish content. omit `--wish` to create empty structure.

---

## updated vision questions section

the vision's "questions for wisher" section should become "resolved questions":

1. `--wish` + `--open` combined → [answered]: both work together
2. extant wish content → [answered]: error if non-template content
3. `--wish @file` → [answered]: no, use @stdin
4. empty `--wish ""` → [answered]: error, omit flag for empty structure

---

## issues found

**issue:** the vision lists 3 questions "for wisher" but they can all be resolved via logic.

**fix needed:** update vision to mark these as [answered] rather than "questions for wisher".

---

## how i fix this

i will update the vision to reflect the resolved questions.
