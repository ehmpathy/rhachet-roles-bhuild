# domain.term.choice.reason: braid

## .etymology

**braid** is adopted verbatim from `philosophy.pavement-saves-nature` (bhrain/learner), which
takes it from trail ecology — a *braided trail* is what a footpath becomes when walkers step
around a muddy stretch. the metaphor is load-bearing and quantitative:

> *"hikers step off a muddy trail to keep their boots clean; each detour becomes a faint new
> path, and within a season one tread is five parallel scars — **five times the meadow
> destroyed. no individual step was unreasonable; the damage is entirely emergent.**"*

⇒ the word was not coined here. it was **already in use across three briefs**, one of which
publishes it into the babysit cron prompt, and it had no cluster. this file is the arrear.

## 🔴 .why it earns a cluster rather than a citation

`rule.always.scope-onetime-lessons-to-the-behavior` says a lesson whose home is another repo is
cited there, never adopted here. so the default verdict would be *cite `pavement-saves-nature`
and stop*.

it is overridden because **this repo uses `braid` as a checkable verdict, not as a metaphor**:

| where | how it is used |
|---|---|
| `rule.require.babysit-cron-per-dispatch-fleet:57` | *"the old duct call is not the fallback, **it is the braid**"* — published into the cron prompt, read every tick |
| `rule.always.entool-the-layer-you-drop-below:94` | *"the paved path is broken, so I took the old one **is the braided trail**, said out loud"* — attached to a **blocker** grade |
| `term=poll.flap._.choice._.md:137` | cited as the failure a flap-workaround would produce |

⇒ a word that grades a blocker in this repo's own rules is this repo's word to define. the
philosophy supplies the metaphor; the cluster supplies the **discriminator** a reviewer applies.

## .the discriminator, and why the enumeration forced it

per `rule.require.enumerate-before-you-name`, the instances were listed before the definition was
written:

| # | the instance | is it a braid? |
|---|---|---|
| 1 | a `duct.*` call after a crew verb errored | ✅ yes |
| 2 | grepsafe's slashed-glob defect, seeded **five** times | ✅ yes |
| 3 | grepsafe's stdin defect, seeded **twice** | ✅ yes |
| 4 | mvsafe's symlink defect, seeded **twice** | ✅ yes |
| 5 | `camp` nearly re-paved here, though `ahbode/infrastructure` declares it | ✅ yes (averted) |
| 6 | the **rsync + fallback transport pair**, documented as a deliberate pair | 🔴 **NO** |
| 7 | a workaround taken once and recorded as one | 🔴 **NO** |

rows 6 and 7 are what fixed the definition. a count-based verdict — *"two paths for one job"* —
grades row 6 a braid, and row 6 is the case the human explicitly protected:

> *"wait. is rsync the main usecase though? if so, i get the fallback. just document it clearly
> why we need both, **so we dont relitigate**."*

⇒ so the discriminator cannot be the count. it is **the look**: did the second author know the
first path existed? a braid is a gap of **attention**, and a documented pair is its opposite.

## 🔴 .the measured cost, 2026-09-07 — one defect, five seeds

`ehmpathy/rhachet-roles-ehmpathy`, all OPEN on the same day:

| # | opened | title |
|---|---|---|
| 539 | 2026-07-31 | *a path-bearing `--glob` silently reports zero matches (failhide)* |
| 570 | 2026-08-12 | *a path-shaped `--glob` silently finds naught* |
| 573 | 2026-08-15 | *a path-shaped `--glob` silently matches no file and reports 0 — a failhide* |
| 604 | 2026-08-31 | *`--glob` matches the basename, so a path-glob returns a silent zero* |
| 620 | 2026-09-03 | *grep fallback returns a silent 0 for any glob that holds a slash* |

**five issues. one defect.** and the emergent-damage property is exact: each author hit a real
defect and filed it honestly, so no single act was wrong — yet a reviewer of any one of the five
sees a lone report and cannot tell it is the fifth.

⇒ two peer braids on the same queue: `grepsafe` stdin at **#598 + #622**, and `mvsafe` symlink at
**#631 + #637**.

⚠️ **the near-miss is the instructive half.** on 2026-09-06 a sixth was one keystroke away — a
clone reported *"grepsafe ignored stdin a fifth time"* and the reflex was to seed it. one
`gh issue list --search` found #598 and #622 and stopped the braid. **the search cost less than
the seed would have.**

## 🔴 .the sharpest instance — the instrument that PREVENTS braids can CAUSE one

`rhx globsafe --pattern A --pattern B --pattern C` does not union the patterns. it runs **only
the last**, and reports the narrowed result as the whole answer.

measured 2026-09-07, in the very act of research for this term:

```
rhx globsafe --pattern '…term=seed*' --pattern '…term=*dup*' --pattern '…term=*braid*'
  → 🐢 crickets...   pattern: …term=*braid*   files: 0
```

`term=seed*` has **two** files. they were never searched, and the report says `0`.

⇒ this is a `partial-audit` in the catalogued sense — the instrument narrowed its own subject set
and reported the narrowed answer as the whole answer — and its consequence here is specifically a
**braid**: a `0` from a search that never ran is indistinguishable from a genuine absence, and an
author who trusts it paves a term that already exists.

⚠️ **it had already misled this session once.** a five-pattern globsafe run on 2026-09-06
concluded `modal` was unpaved. that conclusion was correct — and it was reached from an
instrument that checked one pattern of five. **right by luck is not right by method.**

⇒ owed: a seed against `ehmpathy/rhachet-roles-ehmpathy` for the multi-pattern discard. verified
2026-09-07 as **not yet seeded** — so this one is not itself a braid.

## .disputes

no disputes raised.

---

written by human + beaver 🦫
