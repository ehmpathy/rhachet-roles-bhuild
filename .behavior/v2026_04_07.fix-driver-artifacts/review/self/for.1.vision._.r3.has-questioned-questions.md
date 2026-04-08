# self-review: has-questioned-questions

## triage of open questions from vision

### question 1: should we support non-md yields?

**can this be answered via logic now?**
- no — depends on wisher's usecase knowledge

**can this be answered via extant docs or code now?**
- partially — current codebase only uses `.md` yields
- but this doesn't tell us if non-md yields are needed in future

**should this be answered via external research later?**
- no — this is an internal design decision

**does only the wisher know the answer?**
- yes — the wisher knows their users' needs

**verdict: [wisher]** — requires wisher input

---

### question 2: is `yield` the right word?

**can this be answered via logic now?**
- yes — the wisher explicitly said `yield.md` in the wish
- the word was chosen deliberately

**verdict: [answered]** — wisher already chose `yield`

---

### question 3: should we provide a migration tool?

**can this be answered via logic now?**
- partially — depends on how many extant behavior directories use `v1.i1.md`

**can this be answered via extant docs or code now?**
- yes — we can check if there are extant usages that need migration

**verdict: [research]** — to be answered in the research phase
- research task: count extant `v1.i1.md` usages
- if significant, add migration to blueprint

---

### question 4: one yield per stone vs multiple?

**can this be answered via logic now?**
- no — depends on wisher's usecase knowledge

**does only the wisher know the answer?**
- yes — the wisher knows their users' needs

**verdict: [wisher]** — requires wisher input

---

## update to vision

the vision's "open questions & assumptions" section should be updated to reflect this triage:

### questions to validate with wisher [wisher]
1. should we support non-md yields? (e.g., `*.yield.json`, `*.yield.ts`)
2. can a stone produce multiple yields?

### answered [answered]
- is `yield` the right word? → yes, wisher chose it explicitly

### to research [research]
- how many extant `v1.i1.md` usages need migration?

---

## action items

1. **update vision** — add triage labels to open questions section
2. **proceed to research** — answer the [research] question before blueprint
3. **await wisher** — [wisher] questions block blueprint until answered
