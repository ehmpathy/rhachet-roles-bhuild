# F8 — split the terseness cluster into its own tree

rework = dirty · status = superseded by F22 · confidence = 81% at the time · risk = rework only, no harm

## status — superseded by F22

- 2026-09-04: closed by wisher verdict — one tree (see §the verdict below)
- 2026-10-20: superseded by F22. the wisher dropped the prose cluster, so no terseness cluster
  remains to split. the fork is moot and needs no further verdict
- risk of a wrong guess: rework only (a second route and a re-bind). no security, safety, money,
  reputation, or behavior harm

## the fork

the wish invites this one by name:

> if partway through you judge that the terseness cluster deserves its own tree — say so, with your
> reasons. a split is cheap to grant and expensive to guess at.

| branch | for | against |
|--------|-----|---------|
| **one tree** (all twelve) | 9 of 12 share one spine, and the 3 standalone are each a small, self-contained edit. shared criteria and one execution pass | the 3 standalone issues carry criteria unrelated to the other 9, so the criteria stone holds two unrelated halves |
| **split** — terseness+fulcrum in one tree, the 3 standalone in another | each tree gets criteria that cohere | two routes, two vision stones, two guard ladders, for three edits that total maybe 80 lines |

## what i took, and why at the time

**one tree — do not split.** three reasons, in order of weight:

1. **the nine genuinely are one design**, and the decomposition proved it rather than assumed it:
   #347, #350, #351 and #356 request the *same reviewer pair* at four different scopes. they cannot
   be delivered independently without four copies of one lane — the exact defect the wish forbids.
2. **the three standalone issues are small and touch disjoint files** — #355 is one stone template,
   #346 is one rule plus a header convention, #342 is one operation. they add a second half to the
   criteria stone, and that is a cost measured in a section, not a route.
3. **#349 is the bridge and it belongs with both.** it is a scope fix to extant lanes, and it
   compounds with the prose gate: #349 removes ~366k of support artifacts, the prose gate shrinks the
   155.8k of yields that remain. split them and the compound effect is measured twice, in two places,
   by two drivers.

## why 81%, and why dirty

**dirty**: a split decided *after* the criteria stone is a teardown of shared criteria, shared
blueprint, and a shared roadmap. before criteria it is nearly free. so the cost of this fork rises
sharply with delay, which is why it is flagged now rather than at the council.

**81%** — my doubt is that the three standalone issues are the only argument for a split, and i
judged them small from a read of the issues rather than from an attempt at the work. if #342 turns
out to be the mechanism branch of F7 (real code, a cross-role dependency, a new failure mode), that
third issue alone could rival the other nine in weight — and the tree would be genuinely mixed.

⇒ **F7 and F8 are coupled.** if the council rules F7 to "the mechanism writes it", F8 deserves a
second look.

## where

route structure. a split would mean a second `.behavior/` route and a re-bind.

## the verdict

**one tree. the terseness cluster stays here.** — wisher, 2026-09-04:

> terseness cluster goes into this tree

⇒ my guess held, and the doubt behind the 81% is now moot rather than merely unconfirmed. the 19%
priced one risk: that #342 would turn out to be the mechanism branch of F7 and rival the other nine
in weight. **the same council ruled F7 to convention-only in the same breath**, so #342 shrinks to a
rule + a howto + a lint. the third issue is now the smallest of the three standalone, not the
largest — the argument for a split is weaker after the verdict than it was before it.

⇒ no rework follows. the route, the bind, and the criteria stone all stand.
