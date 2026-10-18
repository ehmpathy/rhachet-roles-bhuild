# domain.term.choice.reason: appendix

## .etymology

### `appendix` — adopted from the extant rule, not coined

bhrain's `rule.always.yield-the-output-not-the-archaeology` already names the concept and the word:

| dir | holds |
|---|---|
| `$route/appendix/` | the evidence under a decision that IS in the yield |
| `$route/archive/` | ideas considered and **rejected** |

⇒ so the word is a **cite**. what bhuild adds is the *shape* — an infix on the yield's own name
rather than a peer dir.

### the wisher's steer — the whole reason the infix exists

> hey should we make the experience and groundwork files located at
> 1.vision.yield.appendix.{ground,experience.*}.md instead ? i think so

> that way its clear they were created as part of the yield

⇒ **a support artifact carries the artifact it supports in its own filename.** the reader learns
what produced it from the name, with no lookup and no prose citation to drift.

## .the divergence — an infix, where the parent rule names a dir

| | the parent rule's `$route/appendix/` | bhuild's `$stage.yield.appendix.$what.md` |
|---|---|---|
| the sort | every stage's appendices file together under `a` | each appendix sorts beneath the yield it supports |
| the `N.stage.` prefix | broken — the stage is legible only from the filename inside | preserved |
| the claim it carries | the same | the same |

a route dir is ordered by its `N.stage.` prefix. a dir would file the vision's appendices beside the
criteria's and the blueprint's, so a reader who scans the dir top to bottom loses the stage grouping
the prefix exists to give them.

⇒ the divergence is **shape only**. the term, the boundary, and the appendix/archive split are all
bhrain's, unchanged.

## 🔴 .the boundary is a gap, and it is recorded rather than papered over

`term.boundary = yield`, and **no repo declares `yield`.** bhrain uses it across its driver briefs
(`rule.always.yield-the-output-not-the-archaeology`), bhuild uses it in every stage emit contract,
and neither has a cluster for it.

⇒ recorded as an open row in `domain.terms/.readme.md`. the boundary is right; its own cluster is
owed, and this cluster does not pretend otherwise.

🟡 **the F11 lesson, applied before the error rather than after.** F11 cost a rename because a flat
filename was written without a read of how bhrain names its 38 clusters. here the boundary was
checked first — the answer was *"no repo declares it"*, which is a gap to record, not a licence to
flatten the name.

## .the collision sweep — run before the cluster was written

```sh
rhx git.repo.get files --repos 'ehmpathy/*' --paths '**/domain.terms/term=*appendix*'
rhx git.repo.get files --repos 'ehmpathy/*' --paths '**/domain.terms/term=yield*'
```

**0 files, org-wide, on both.** so this is a genuine bhuild coin of the *shape*, and no peer repo
has since declared the word.

🟡 this is the pass that `term=prose.subversive` did not get. that cluster was authored 2026-09-06
and bhrain shipped an identical one 2026-09-07 — one word, two glossaries, and neither the inward
nor the outward census pass could see it.

## .rejected terms

| candidate | why not |
|---|---|
| `peer file` | names the **filesystem** relation, so it holds equally for the stone, the guard, and every other file beside the yield. it says where the file sits, never what it is |
| `support artifact` | prose, not a term — two words, and it names no relation to the yield at all |
| `attachment` · `annex` · `addendum` | plain synonyms of `appendix`. one word per concept, and the parent rule already chose |
| `archive` | 🔴 **a real distinction, not a synonym.** the parent rule parts them: an **appendix** holds evidence under a decision that IS in the yield; an **archive** holds ideas **rejected**. to merge them would overload one word onto two concepts |

## .disputes

none open.

## .evidence

### the glob partition is what earns it a term

the infix partitions one glob into three, so a rubric can name exactly one:

| glob | reaches | what grades it |
|---|---|---|
| `$route/*.yield.md` | the decisions | a density rubric — the yield must be terse |
| `$route/*.yield.appendix.*` | the evidence | a coverage rubric — the space must be walked |
| `$route/*.yield*` | both | a prose rubric |

🔴 **the `yield-density` lane is scopeable only because those two globs separate.** under the prior
`1.vision.*.md` shape there was one glob over both, so a density gate would have fired on evidence
that is correctly placed — the `case=003` over-fire, delivered by our own hand.

⇒ the appendices are archaeology **by contract** (`rule.require.archaeology-in-notes`), so the
separation is what stops the terse-yield rule from a cut of the proof it rests on.

### the dir sort, measured

with the infix, one route dir reads:

```
1.vision.yield.md
1.vision.yield.appendix.groundwork.md
1.vision.yield.appendix.experience.dimensions.md
1.vision.yield.appendix.experience.case=_.md
1.vision.yield.appendix.experience.case=001.$slug.md
2.1.criteria.blackbox.yield.md
```

with a dir, the same files scatter: `appendix/` sorts before every `N.stage.` file, and the vision's
evidence sits beside the criteria's with no path segment to part them.

## .refs

- **bhrain** `rule.always.yield-the-output-not-the-archaeology` — the parent rule and the word
- `rule.require.archaeology-in-notes` (bhrain/telepath) — why the evidence is moved rather than cut
- `$route/.seeds/inventory.of=seeds.case=S4-provenance-belongs-in-the-name.md` — the verbatim steer
- `src/domain.operations/behavior/init/templates/1.vision.stone` — the emit contract
- `term=yield.appendix._.choice._.md` — the say file
