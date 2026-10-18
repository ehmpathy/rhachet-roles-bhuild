# F4 — the shape of the #349 scope cut

**rework** = clean · **status** = open · **confidence** = 87%

⬆ **up from 79% once the context window was measured.** the doubt this row priced was *"B may not
restore a verdict"*; at a ~1.00M window B lands the lane at ~45% of the gate, so that doubt closes.
what remains is only the yields-in-code-lanes question below, which is a taste fork the council owns.

## the fork

#349 offers three shapes and declares the exact form mine:

| branch | shape | for | against |
|--------|-------|-----|---------|
| A | narrow the behavior side to `**/*.yield.md` | smallest subject | drops the yield's peers that a stage rubric may want; needs a rewrite of each glob |
| B | add `--paths-wout '$route/*.experience.*'` to the **code** lanes | surgical; one flag per lane; the stage lanes keep their subject untouched | leaves the yields in the code lanes' subject (~156k on the measured branch) |
| C | let each guard declare which behavior artifacts its rubrics grade | most precise, and it documents itself | new machinery in the guard schema; a large change for one defect |

## what i took, and why at the time

**B.** the measured prize is the 366,363 of support artifacts (51.7% of the subject), and B removes
exactly those with one flag that already exists (`review.ts:48`). C is the right long-term shape and
is far more than this wish asked for — #354's *audit is not a guard* check applies to me here.

the decisive fact is that the two glob families need **opposite** treatment. verified at source:

- stage lanes already glob `'$route/1.vision.*.md'` — the experience artifacts are their **subject**
- code lanes glob `'**/*.{ts,sh,md,snap}'` — the same files are pure **noise**

so a blanket exclusion would break the coverage lanes silently. only the code lanes narrow.

## why 79%

B leaves the yields in the code lanes' subject. on the measured branch that is 155.8k tokens of
prose handed to rubrics about error handles — real waste, and it may still overflow.

my reason to keep them is #349's own words: *"a yield is the stone deliverable and legitimately
belongs in a review subject."* the repo-rules lane (`.agent/repo=.this/**/rule.*.md`) can genuinely
grade a yield. but i did not verify that any *specific* code rubric has ever raised a real result on
a yield — so the claim that yields earn their place in a code lane is inherited, not measured.

🟡 this fulcrum partly depends on the prose gate: once yields shrink 3x (#350, #356), the argument
for their exclusion weakens considerably. the two fixes compound, as #350 notes.

## the premise, measured — B is sufficient, and the margin was the defect

this row previously said *"none of A, B or C is proven to restore a verdict"* and priced the doubt
against an unknown window. **the window is now measured**, and the doubt does not survive it:

> this route's own peer lane logged `estimate: 58017` at `contextWindowPercent: 5.8` on
> `brain: fireworks/deepseek/v4-flash` (`.log/bhrain/review/2026-09-04T04-42-33-761Z/metrics.expected.json`).
> the guard names no `--brain` ⇒ the default window is **≈ 1.00M**, the gate **≈ 750k**.

| subject | vs a ~750k gate |
|---------|-----------------|
| 707,400 targets alone | **94%** — under by a hair |
| plus the 791-token rule, 7 refs, the prompt scaffold | **over** — which is what test-fns observed |
| 341,037 after B | **~45%** — clear, with over half the gate to spare |

⇒ the lane was never hopeless; it sat **one ref away** from silent. B moves it to over half the
gate in reserve, so B alone restores the verdict at this window.

🟡 **the residual doubt is narrow and named:** test-fns' guard may name a different brain, in which
case this arithmetic is ours rather than theirs. and the **code diff alone is 327k** — so a repo
whose code half grows past ~750k needs a lever outside #349 (a per-lane `--brain`, or a narrower
code glob). flagged rather than adopted; both are outside #349's stated scope.

⇒ this does not re-rank the branches. A and C narrow the *same* behavior side and reach the same
341,037; B reaches it with one extant flag and the strongest fail-safe (`case=004`).

## two facts found after this row was written

1. 🔴 **the flag name in our own templates is wrong.** `--paths-without` (used at
   `from_vision.guard:173`, `phase0_to_phaseN.guard:177`) is parsed into an unread key and
   discarded; bhrain reads `paths-wout` (`review.ts:158`). branch B must use `--paths-wout`, and
   the two extant no-ops are repaired in the same edit.
2. **branch C is less new than it looked.** `5.3.verification.guard:254` already hands the
   experience artifacts to its rubric as `--refs` rather than `--paths-with` — reference context,
   not review subject. that is C's idea, already in use for one lane. C remains out of scope for
   this wish, but it is the natural next step rather than novel machinery.

## where

the `--paths-with '**/*.{ts,sh,md,snap}'` lanes — **14 in total**: `5.3.verification.guard:234,239,244,249,259`
and `5.1.execution.{from_vision:163,168,173,180,185,190,195,200,205 · phase0_to_phaseN:167,172,177,184,189,194,199,204,209}`.

🟡 the test-only lanes (`'**/*.test.ts'` + `'**/*.snap'` at `5.3.verification.guard:254,264,269`)
need **no** change — they already exclude markdown, so `.behavior/**` never enters their subject.

## the verdict

_(open — for the council)_
