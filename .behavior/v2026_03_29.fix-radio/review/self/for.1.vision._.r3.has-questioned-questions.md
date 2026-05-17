# self-review: has-questioned-questions

triage of open questions in the vision.

---

## questions in the vision

### question 1: what permissions does the beaver app need?

| triage | answer |
|--------|--------|
| can this be answered via logic? | partially — gh.issues channel implies `issues: write` |
| can this be answered via code/docs? | no — app does not exist yet |
| needs external research? | no |
| does only the wisher know? | yes — wisher must decide scope |

**result: [wisher]**

however, I can suggest: for gh.issues channel, likely needs `issues: write` permission.

---

### question 2: what repos should the beaver app access?

| triage | answer |
|--------|--------|
| can this be answered via logic? | no |
| can this be answered via code/docs? | no |
| needs external research? | no |
| does only the wisher know? | yes |

**result: [wisher]**

---

### question 3: is the beaver app public or private?

| triage | answer |
|--------|--------|
| can this be answered via logic? | no |
| can this be answered via code/docs? | **yes** — wish says "public app" |
| needs external research? | no |
| does only the wisher know? | no |

**result: [answered]**

the wish explicitly states "public app, so that we can use the app token".

---

### question 4: where are app creds stored (1password item)?

| triage | answer |
|--------|--------|
| can this be answered via logic? | no |
| can this be answered via code/docs? | no |
| needs external research? | no |
| does only the wisher know? | yes |

**result: [wisher]**

---

## research items in the vision

### research 1: review declastruct-github provision workflow

| triage | answer |
|--------|--------|
| can this be answered via logic? | no |
| can this be answered via code/docs? | yes — I already reviewed `provision/github.apps/readme.md` |
| needs external research? | no |

**result: [answered]**

already reviewed at vision creation. the pattern is:
1. declare app in `resources.app.*.ts`
2. run `npx declastruct plan --wish ... --into plan.json`
3. run `npx declastruct apply --plan plan.json`

---

### research 2: verify keyrack cli available from skill context

| triage | answer |
|--------|--------|
| can this be answered via logic? | partially — rhachet provides keyrack |
| can this be answered via code/docs? | yes — can check bhrain's pattern |
| needs external research? | no |

**result: [research]**

needs verification by code review of bhrain's review skill.

---

### research 3: confirm bhrain's review skill pattern

| triage | answer |
|--------|--------|
| can this be answered via logic? | no |
| can this be answered via code/docs? | yes — can read bhrain's skill code |
| needs external research? | no |

**result: [research]**

---

## vision update needed

update the vision's "open questions & assumptions" section to clearly mark each item.

**before:** generic questions list
**after:** triaged with [answered], [research], [wisher] labels
