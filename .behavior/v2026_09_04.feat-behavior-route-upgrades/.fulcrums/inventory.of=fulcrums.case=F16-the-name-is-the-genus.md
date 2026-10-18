# fulcrum F16 — the new prose rule's name: the genus, or the differentia?

- **rework** = clean — a rename, and no caller had hardened against it
- **status** = 🔴 **CLOSED 2026-09-11 by wisher verdict** — `rule.forbid.ejectable-overzoom`
- **confidence** = **58%** in the name while open · **96%** in the rule throughout

## .the fork

the wisher coined `rule.forbid.prose.inconsiderate` verbatim
(`$route/.seeds/inventory.of=seeds.case=S8-prose-bloat-is-a-charge-on-a-peer.md`). the fork was
whether to ship that word or a word that names the differentia.

| branch | |
|---|---|
| A — ship the wisher's word | taken while open |
| B — translate to the differentia | rejected while open, **and it is what the verdict chose** |

## .why A was taken while the row was open

`rule.always.archive-the-wishers-words-verbatim` is explicit — *"a coinage's source is its
etymology"* — and it says adopt rather than translate. the `subversive` cluster is this repo's own
precedent: the wisher's word was taken over `unfalsifiable`, and the choice held.

⇒ so bhuild flagged the mismatch rather than swapped the word. that is the move the rule asks for
when a coinage looks wrong: **surface it, do not correct it silently.**

## 🔴 .the verdict — the wisher re-coined it, and the second word passes the test the first failed

> `rule.forbid.ejectable-overzoom` · *"if details can be omitted and instead ejected into a zoom
> file, they should be, to keep the subject dense as possible. no need to force readers to zoom into
> overdetails until they ask"*
> — wisher, 2026-09-11

`rule.require.enumerate-before-you-name` demands two checks. the first word passed one; the second
passes both:

| the check | `prose.inconsiderate` | `ejectable-overzoom` |
|---|---|---|
| covers every instance? | ✅ | ✅ the same six shapes |
| **excludes its neighbours?** | 🔴 **no** — `forbid.riddles` already says *"it is rude"*, and decode-friction, diffusion, obfuscation and defensive-prose are each inconsiderate too | ✅ **yes** — every neighbour repairs by a rewrite, a promotion, a deletion, or an addition; only this one repairs by an EJECT |
| matches telepath's adjective-noun shape? | 🔴 no — it was noun.adjective | ✅ `ejectable` + `overzoom` |

⇒ the differentia is the **EJECT verdict**. the exclusion walk, neighbour by neighbour, is at
`$route/.dispatch/v2026_09_11.into=bhrain.forbid-ejectable-overzoom.md`.

## 🟡 .what the verdict gave up, deliberately

`inconsiderate` covered both verdicts — *cut it* and *move it*. `ejectable-overzoom` names only the
second.

⇒ the scope is **narrower, and that is correct**: the CUT verdict is already
`require.reflexive-condensation`'s and `forbid.purposeless-passages`', and the rule's whole claim was
that a THIRD verdict was absent.

## .the collision sweep, run before the words were adopted

```sh
rhx git.repo.get files --repos 'ehmpathy/*' --paths '**/domain.terms/term=*zoom*'
rhx git.repo.get files --repos 'ehmpathy/*' --paths '**/domain.terms/term=*eject*'
```

**0 files org-wide on both.** so `overzoom` is a clean coin, and `eject` is a **cite** — already
this repo's verb for the act, in the self slug `has-ejected-the-archaeology`.

## .where it landed — and it is NOT where the row assumed

the row was written on the premise that the rule ships as a dispatch and bhrain authors it. the radio
is blocked, so the wisher ruled it lands here instead:

| artifact | what it holds |
|---|---|
| `.agent/repo=.this/role=any/briefs/rule.forbid.ejectable-overzoom.md` | the rule, booted and bound |
| `$route/1.vision.guard` → lane `overzoom-of-yields` | the dogfood — it grades this route's own yields |
| `$route/.dispatch/v2026_09_11.into=bhrain.forbid-ejectable-overzoom.md` | the zoom, and the ask still owed to bhrain |

🟡 **the lane is its own, rather than a 15th rule on `dense`, and that was forced twice over.**
bhrain's `review.ts:129` names `--refs` as the one repeatable flag and casts `options.rules as
string` at `:154`, so a second `--rules` would last-win **silently** — the #366 defect in a new slot.
and the crowd-out measurement says the same independently: on the 20-rule lane this guard replaced,
24 of 40 points cited the three cheapest mechanical rules and the five thought-graders cited 0.

## 🔴 .the lesson the row bought

**a coinage flagged is a coinage the wisher can fix. a coinage swapped is one they never see.**

- bhuild ran `enumerate-before-you-name`, found the second check failed, and **shipped the word
  anyway with the failure stated**
- the wisher read the flag and supplied the differentia in one message
- ⇒ had bhuild translated it silently to `forbid.prose.bloat`, the fork would have closed on
  bhuild's guess and the better word would never have been typed

⇒ that is `rule.always.defer-fulcrums-to-last` at work: best-guess it, flag it, drive on.
