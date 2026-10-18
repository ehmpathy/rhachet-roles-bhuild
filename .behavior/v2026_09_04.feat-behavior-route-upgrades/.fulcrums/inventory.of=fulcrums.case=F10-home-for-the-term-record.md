# F10 — the home for the experience term record

**rework** = clean · **status** = **closed — wisher directive** · **confidence** = 84%

## the fork

the name decisions behind the experience vocabulary had **two homes** at once:

| home | what it held |
|------|--------------|
| `.agent/repo=.this/role=any/briefs/lesson.experience-term-choices.[lesson].md` | the rejections, the glyph choices, the verdict refinement — plus a restatement of the axis definitions |
| the behaver briefs (`define.experience.*`) | the definitions themselves |

two copies of the definitions, so every axis edit was a two-file edit. that duplication is the
defect — a copy that is not edited in lockstep drifts, and the drifted copy still reads as
authoritative.

## what i took, and the wisher's directive

**one canonical spot: a `domain.terms/` cluster.**

`rule.require.persist-domain-term-evidence` names the spot explicitly — one file per term, which
records its etymology and the evidence that backed its choice, at
`.agent/repo=.this/role=any/briefs/domain.terms/*`. i had cited that rule myself while the record sat
elsewhere.

the wisher's words:

> rename the record to domain.terms/term=experience._.choice.reason.md and cut the duplicated
> definitions — do it. rule.require.persist-domain-term-evidence mandates one canonical spot
> precisely so nobody hunts. you cited it yourself. the two-copy edit tax is the defect.

⇒ shipped as the cluster shape `template.domain-term` prescribes:

- `term=behavior.experience._.choice._.md` — **say**: the cluster table, the forbidden synonyms, the one-name principle, the refs
- `term=behavior.experience._.choice.reason.md` — **ref, required**: etymology, the glyph choices, the verdict refinement, the rejected terms, the dated `hazard` dispute, the evidence

🟡 **the filename carries the `behavior.` boundary, and the wisher's directive above does not** —
that is **F11**, closed separately and against my guess. this row settled the **home**; F11 settled
the **filename**.

the lesson brief is deleted. **zero files cited it**, so the delete broke no reference; it is
restorable from the `rmsafe` trash.

## why 84% and not higher

🟡 **the cluster covers five terms in one file**, where the template says *"one cluster per term
(one word)"*: `experience`, `feel`, `care`, `boundary-density`, and the four cell verdicts.

i took the single cluster because the five are **not independently meaningful** — `feel` and `care`
are defined by their orthogonality to each other, so five files would each need the other four to
make sense, and the split would re-create the duplication this row exists to remove.

but that is how i read the template's intent, not the template's text. the alternative — five
clusters, each terse, cross-linked — is defensible and i did not take it.

⇒ the split is **clean** rework if the wisher prefers it: five files, no callers, one afternoon.

## where

`.agent/repo=.this/role=any/briefs/domain.terms/term=behavior.experience._.choice{._,.reason}.md`

## the residue

✅ **none — F11 closed it.** this row settled the **home** and left the **filename** open; F11 read
bhrain's 38 clusters, found that a flat name is a positive claim of roothood, and **renamed** the
cluster to carry its `behavior.` boundary. the path above is the shipped one.
