# rule.always.capture-clamp-then-verify-in-prod

> **three steps, in order, every time you cure a tool defect:**
>
> **1. CAPTURE** the raw production artifact into a `.test/.assets/` fixture, verbatim.
> **2. CLAMP** against it — reproduce RED, cure, prove GREEN.
> **3. VERIFY IN PROD** — re-run the real tool against the real world, read the render.
>
> a cure that skips step 3 is not done. it is a test that passes.

`rule.always.clamp-the-production-defect-you-just-saw` names the reflex;
`rule.always.clamp-the-verbatim-pane-your-classifier-judged` names the fixture. this names the
order, and the step both leave implicit.

## .why step 3 — a green clamp proves the detector, never the render

a tool defect is almost never one function. it is a chain: a detector reads the artifact, a
field carries its verdict, a join decides what the verdict means, a render prints the row a
human acts on. a clamp aimed at the detector proves the detector alone — a cure whose join
keys on the wrong fact is exactly as broken as no cure, while it reports pass.

| a green clamp proves | it does NOT prove |
|---|---|
| the detector matches the captured artifact | the field is emitted where the join reads it |
| its teeth bite on the listed negatives | the join's precondition ever holds in the wild |
| the fixture corpus is handled | the render changes for a human |

a wrong join fails silently — an arm that never fires. the suite is green, the render is
unchanged, and the only signal is a human's later note that the old verdict still stands. one
measured cure wired a field and a join correctly against its fixture and left the real poll
unchanged, because the join keyed on a model of the pane read off the capture rather than off
the classifier's own ladder — every assertion in the clamp was true, and the cure moved naught.

## .the steps, and what each owes

### 1. CAPTURE — verbatim, to disk, before you edit

```sh
rhx git.crew.read --tree <t> --who <role> --raw | rhx teesafe .agent/…/work/.test/.assets/pane.<slug>.log
```

- `--raw`, always — escapes carry the signal for a ghost, a queued row, a dim placeholder
- to a FILE, read back by `readFileSync` — a hand-typed inline fixture is your model of the
  artifact, and the model is the suspect
- name it for the STATE, never the tree — the tree is felled next week; the state recurs

### 2. CLAMP — red, then green, with teeth both ways

watch it fail under the un-fixed tool; add teeth on the negative side too (the shape that
looks like the defect and is not — most wrong cures are wrong there); then cure, watch it pass.

### 3. VERIFY IN PROD — run the real tool, read the real render

run the whole verb a human runs (`rhx git.crew.poll`), never the detector alone, against the
same subject if it still exists, and read the row.

| the render… | then… |
|---|---|
| changed, correctly | done — say what changed |
| unchanged | 🔴 the cure is inert — clamp the link you skipped |
| changed, but wrong | the join fires on the wrong precondition |
| subject is gone | say so, and name what you could not verify |

an unverified cure reported as done is a `term=false-report` — a true claim about the suite,
dressed as a claim about the world.

## .the cues

| when… | then… |
|---|---|
| about to edit a classifier | capture first — the artifact changes under you |
| clamp went green | step 2 of 3. not done |
| about to report a cure | did you run the real verb and read the real row? |
| an inline hand-typed fixture is in view | that is your model, and the model is the suspect |
| real render unchanged after a green suite | 🔴 the sharpest cue — clamp the link you skipped |
| a field modelled from a READ of the capture | read the classifier instead |
| defect's subject healed before you could verify | name it unverified, never done |

## .the test

> did the output a human reads actually change — and did you watch it change?

yes, watched → cured. suite green, did not look → not cured, one command from the answer.

## ⚠️ .the bound

governs a cure to a tool that renders a verdict — a classifier, a join, a poll, a rank. not a
demand to re-run every unit test against production, nor to wait on a subject already gone.
what it forbids is the REPORT: a cure called done on a green suite alone.

## .enforcement

- a tool cure reported as done with no prod run = **blocker**
- a clamp built from a hand-typed fixture where a real artifact was capturable = **blocker**
- a capture taken non-raw where the escapes carry the signal = **blocker**
- a prod run whose render was unchanged, reported as a cure = **blocker**
- a cure whose subject healed, verified nowhere, said to be unverified = ✅ correct
- the same, reported as done = **blocker**
- a fixture named for the tree rather than the state = **nitpick**

## .see also

- `rule.always.clamp-the-production-defect-you-just-saw.md` — the reflex half
- `rule.always.clamp-the-verbatim-pane-your-classifier-judged.md` — the fixture half
- `rule.require.clamp-edge-cases` (ehmpathy/mechanic) — a clamp with teeth, red then green
- `rule.require.trust-but-verify` (ehmpathy/mechanic) — the general form
- `surgoal.polish-the-supervisor-and-prioritizer-tools.md` — the objective all three serve
- `term=partial-audit._.choice._.md` — a green scoped suite says naught about what it excluded
- `term=false-report._.choice._.md` — the class an unverified cure lands in

---

written by human + beaver 🦫
