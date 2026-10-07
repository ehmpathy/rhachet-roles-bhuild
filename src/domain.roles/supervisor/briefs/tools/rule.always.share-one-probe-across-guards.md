# rule.always.share-one-probe-across-guards

> **when two or more guards ask the SAME question, they share ONE probe. an inline copy per
> guard is not a duplicate — it is a set of independent detectors that can each be wrong
> alone.**

a **probe** is the predicate a guard evaluates (*"is a screen up?"*, *"is this pane a husk?"*).
a **guard** is what acts on the answer — a stall timeout, an unknown-state warn, a cure path.

## .why

a copied predicate drifts — one copy gets fixed, the others do not. worse: inlined at each
guard, it reads as a local detail rather than a claim about the domain, so nobody checks "is
this phrase the whole of what I mean?" and the blind spot is **common mode** — every copy
carries the same omission, so a second guard is no backstop for the first.

measured: four guards each inlined one literal (`Enter to confirm`) to detect a parked screen;
none also matched claude's oauth retry screen (`Press Enter to retry`), so all four went blind
on the same input and the run named a false cause. one shared helper (`__screen_up`) fixed all
four at once.

## .the cues

| when… | then… |
|---|---|
| you write a grep/regex a peer guard already runs | extract it — the second copy IS the cue |
| you fix a predicate at one guard | grep for its siblings before you move on |
| a guard is named for a state (stall, unknown, husk, cap) | its predicate is a claim, and claims get names |
| two guards in the same loop disagree about what they saw | they cannot, if they share a probe |
| a predicate is a literal lifted from a foreign ui | it is a sample of one — list the other screens first |
| a helper's name reads as a question (`__screen_up`) | correct — that is what makes it arguable |

## .the test

> **"if this predicate is wrong, how many guards go blind?"**

one → inline is fine. more than one → share a probe, or you ship a common-mode blind spot. the
question is whether the guards bind to one answer, never line count — two greps that happen to
match one literal for unrelated reasons are two probes; two greps that both ask "is a human at
this prompt?" are one probe, copied.

## ⚠️ .the bound

a predicate belongs to one probe only when every guard reads the same sense from it. where they
do not, a shared helper is worse than a copy — it fuses two questions under one name. test: can
you name the question in one sentence every caller would endorse? yes → one probe. no → keep
them distinct.

## .enforcement

- a predicate inlined at 2+ guards where a shared probe would serve = **blocker**
- a predicate fixed at one copy, siblings left stale = **blocker**
- a guard that names an unknown state where a peer guard held the discriminator = **blocker**
- two distinct questions fused under one helper = **blocker** (the inverse defect)
- a repeated line whose guards read different senses from it = **false positive**

## .see also

- `term=auth.swap._.choice._.md` — the full measured case
- `rule.require.enumerate-before-you-name` (bhrain/learner) — list every screen first
- `rule.always.pave-on-second-repeat.md` — the general form this instances
- `rule.forbid.remedies-that-mimic-the-defect.md` — a fused helper repeats the fault it cures
- `rule.always.clamp-the-verbatim-pane-your-classifier-judged.md` — clamp a missed pane verbatim
- `rule.require.clamp-edge-cases` (ehmpathy/mechanic) — clamp the property, not the tally

---

written by human + beaver 🦫
