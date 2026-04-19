# self-review r3: has-questioned-questions

## why r3?

r2 updated the vision but did not articulate the full reason chain. slow down further.

---

## each question, re-examined

### question 1: --wish and --open mutual exclusivity

**can logic answer now?** yes

**the wisher's exact words:** `--open nvim --name @branch --wish "to do some cool feature..."`

this shows both flags in one command. the intent is explicit: populate first, then open editor.

**what if i'm wrong?** if they're meant to be exclusive, user loses the ability to pre-populate then expand. that's strictly less useful.

**why it holds:** combined use enables flow: capture thought inline, then expand in editor. separate commands would be required otherwise.

**verdict:** [answered] — both work together.

---

### question 2: extant wish content

**can logic answer now?** yes

**current behavior check:** init.behavior creates 0.wish.md from template. template contains only `wish = \n\n`. so "extant content" means user modified the file after creation.

**scenario:** user runs `rhx init.behavior --name foo`, edits the wish, then accidentally runs `rhx init.behavior --name foo --wish "new thought"`.

**pit-of-success:** don't silently overwrite. user might have hours of work in that file.

**options:**
1. error if file differs from template — simple, safe
2. error if content differs from template-with-wish — allows re-run with same wish
3. `--force` flag to allow overwrite — adds complexity

**simplest pit-of-success:** error if file differs from template. user can delete file manually or use --open to edit.

**verdict:** [answered] — error if wish file has non-template content.

---

### question 3: --wish @file support

**can logic answer now?** yes

**the @stdin pattern covers this:** `cat file.txt | rhx init.behavior --wish @stdin`

**cost of @file:** new parse logic, new documentation, new edgecases (file not found, file too large, file is directory...)

**benefit of @file:** slightly shorter command

**kiss analysis:** marginal convenience does not justify added complexity

**verdict:** [answered] — no @file support. @stdin is sufficient.

---

### question 4: empty --wish ""

**can logic answer now?** yes

**if user runs `--wish ""`:**
- they provide the flag but no content
- this is likely a mistake

**if user wants empty structure:**
- they can omit `--wish` entirely
- that's the extant behavior

**pit-of-success:** explicit empty string is probably a typo or confusion. fail fast.

**verdict:** [answered] — error on empty. omit flag for empty structure.

---

## issues found in r3

**issue:** vision previously had "questions for wisher" section with assumptions inline.

**fix applied:** renamed to "resolved questions" and marked each as [answered] with evidence/rationale.

**verification:** re-read the updated vision to confirm.

---

## verification of fix

re-read vision lines 143-168:

```
### resolved questions

1. should `--wish` and `--open` be mutually exclusive?
   - **[answered]**: both work together — wish is populated, then editor opens
   - **evidence**: wisher's example shows both flags combined

2. what happens if wish file already has content?
   - **[answered]**: error if wish file has non-template content
   - **rationale**: pit-of-success — don't silently overwrite user's prior work

3. should we support `--wish @file`?
   - **[answered]**: no — @stdin covers the usecase via `cat file | rhx ... --wish @stdin`
   - **rationale**: kiss — avoid complexity for marginal benefit

4. what about empty `--wish ""`?
   - **[answered]**: error — require non-empty content
   - **rationale**: if user wants empty structure, omit `--wish` flag entirely
```

all 4 questions now have:
- clear answer
- evidence or rationale
- [answered] tag

**verdict:** fix complete. vision questions are properly triaged.

---

## reflection

the original vision left questions open that could be resolved via logic. r3 resolved them and updated the vision to reflect this. the vision is now clear on all contract decisions.
