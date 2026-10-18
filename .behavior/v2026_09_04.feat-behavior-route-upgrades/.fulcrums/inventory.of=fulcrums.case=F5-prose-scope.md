# F5 — prose scope: yields only, or yields + experience artifacts

**rework** = clean · **status** = **closed — settled by wisher steer** · **confidence** = 58% at the time

## the fork — this one is a genuine conflict between two issues

the wish instructs: *"if two issues genuinely conflict, say so and pick one."* this is that.

| issue | its stated scope |
|-------|------------------|
| **#350** | *"a self-review or guard rubric that grades every `*.yield.md`"* · *"`**/*.yield.md` is a narrow subject, so this lane costs almost nothing"* |
| **#351** | *"**in scope:** `N.*.yield.md` · `N.*.experience.*.md` · every numbered stage deliverable"* |

#350 wants the prose gate on **yields**. #351 wants it on **yields plus the experience artifacts**.

## what i took, and why at the time

**#351's broader scope.** the evidence favours it: #351's own measurement lists
`1.vision.yield.appendix.experience.case=_.md` at **416 lines / 38.4k tokens** and `dimensions.md` at 185 lines,
against a 615-line yield. the support artifacts are more than half the bloat. a gate that spares
them addresses a minority of the defect it was built for.

and `rule.require.catalog-is-an-index` — cited by #351 — grades a catalog that narrates one member
as a **blocker**. that rule has no reach at all under #350's scope, because a catalog is never a
yield.

## why 58% — the lowest row here

two reasons, and both are real.

1. **it is a direct contradiction of a stated scope**, chosen on my reading of the evidence rather
   than on a fact that settles it. #350's author may have narrowed deliberately, to keep the lane
   cheap. i cannot tell from the issue text, and i did not ask.
2. 🟡 **it collides with F4.** i exclude `$route/*.experience.*` from the code lanes for cost, and
   here i include the same files in the prose lane. that is coherent — different rubrics, different
   subjects — but it means the experience artifacts are graded by exactly one lane, so a
   misconfiguration of that one lane leaves ~366k of artifact graded by none.

the cost of the wrong call is asymmetric and favours the broader scope: too-narrow leaves the
majority of the measured bloat ungraded, while too-broad costs some lane tokens on a small rubric.

## where

the `--paths-with` glob of the prose peer lane, and the artifact list named by the self review.

## the verdict

**settled by the wisher, mid-drive: the broad scope, and broader than either issue asked.**

the wisher's words:

> we should embed that maybe in the self review
>
> and in general we should have a rule that makes it clear this applies to all

⇒ the fork collapses. the scope is **every artifact**, not merely yields (#350) and not merely the
numbered stage deliverables (#351). and the mechanism is **a rule**, not only a self-review prompt —
a prompt binds one ladder rung, while a rule binds every artifact the reviewer can reach.

this also raises the stakes on **F3** (where the rule lives), because a rule that claims "all
artifacts" and sits in a behaver-only practice dir under-delivers on its own claim. F3 now carries
the residue of this row.

