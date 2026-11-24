# domain.term.choice.reason: experience

## .etymology

### `feel` · `care` — why two axes, and why these two words

the split exists to keep **what the actor meets** independent of **what it costs us**. a word that
reads as a value on both collapses that independence, which is the whole reason the frame has two
axes rather than one severity dial.

- **`feel`** names the actor's side. it answers *"is there an edge here the behavior must guard?"*
- **`care`** names ours. it answers *"what if it breaks?"* — computed, `severity = freq × cost`.

`care` is the **product**, so neither factor may name it (see the `freq` rejection below).

### `boundary-density` — a metric, deliberately not a third axis

- how many boundaries one experience exercises
- it prioritizes which cells earn a demo
- it does **not** verdict a cell, so it is not an axis
  - a dense alterpath is still an alterpath

🟡 a cell's density is only knowable **after** its demo is written, so a cell skipped because it
reads thin is a cell never measured.

## .the cell verdicts — a refinement of the architect's three

the architect's `howto.dimensional-decomposition` offers three verdicts (`filled` / `gap` /
`forbidden`). the behaver refines them into **four**. the architect's verdicts blur two things the
behaver needs:

- **coverage** — is a real experience demonstrated, or just on record?
- **why a non-experience can't occur** — that decides whether a guard is owed

| architect | behaver | sense |
|-----------|---------|-------|
| `filled` | **demoed** | a real experience, demonstrated with a `case=N` |
| `filled` / `gap` | **itemized** | a real experience on record, deliberately not demoed |
| `forbidden` | **forbidden** | **the attempt is possible and REJECTED** — the actor may try it, the behavior refuses → a fail-loud invariant |
| `forbidden` | **impossible** | **no attempt is possible at all** → no experience, no guard owed |

- **`filled` is dropped** — it conflated existence with coverage, which is the behaver's whole point.
  a demoed cell is also itemized, so a cell is labelled by its higher coverage.
- **`gap` → `itemized`** — the architect's "valid but unbuilt" is, in behaver terms, a cell on record
  with no demo. no separate word is owed.
- **`forbidden` splits on whether an ATTEMPT is possible** — a `forbidden` cell yields a sharp
  rejection experience to demonstrate; an `impossible` cell yields no experience at all. the
  architect did not split because it modeled a **feature** space, not an **experience** one.

🔴 **the discriminator is the absence of an ATTEMPT, never the absence of a CHOICE** — corrected
2026-09-09, and the correction matters because the narrower reading silently mis-sorts real cells:

| what bars the attempt | still `impossible`? |
|---|---|
| **nature** — no law of the domain permits it | ✅ |
| **the shipped design** — nothing prevents it; we did not build it | ✅ **and this is the common case** |

⇒ measured on `v2026_09_04.feat-behavior-route-upgrades`: **all 4** of that route's impossible cells
are barred by the shipped design rather than by nature — no law prevents a peer lane that grades
fulcrums or test selection, and we shipped none. with no lane there is no attempt to reject.

🟡 **so a `by nature` gloss would have verdicted those four cells wrong**, and the walk's own legend
(`…experience.case=_.md`) had already drawn the right line while three briefs and this file carried
the narrow one. caught by the `dense-of-briefs` peer lane under `rule.forbid.obfuscation`, which
grades a term used in a sense the author knows a reader will take differently.

⇒ the behaver↔architect map lives in `howto.experience.decompose`, so the lineage stays legible.

## .the glyphs — notation for extant terms, never new terms

the inventory tags each cell `[feel, care]`, so each pole value carries a glyph.

- **🌴 / 🌵** — two trees of one climate; you reach for either, and only one has spines. holds
  *"a sharp path must fail safe"*: a cactus is not a defect, it is handled or it is not.
- **⭐ / 🌙** — maps `freq × cost` with no lore, because **a sun is a star**: ⭐ is the one up
  **every day** (max freq) whose loss is total (cost → ∞). 🌙 wanes, hides, goes new (freq < 1), and
  daylight replaces it (cost ≈ 0).

🟡 **the gloss carries the definition; the glyph carries only the vibe.** a gloss that drifts from
the axis briefs is wrong, however well it reads.

### 🔴 no tag may carry a variation selector

- ☀️ is `U+2600` **+ `U+FE0F`** (VS16)
  - nvim renders the selector as a stray glyph and mis-measures the width
  - ⇒ column alignment breaks
- the four chosen are selector-free — 🌴 `1F334` · 🌵 `1F335` · ⭐ `2B50` · 🌙 `1F319`

⇒ **the test, before any taste call:** `printf '<glyph>' | wc -c`

- 3 or 4 bytes = one codepoint, good
- 6 bytes = a base plus VS16, reject

### rejected glyphs

| candidate | for | why not |
|-----------|-----|---------|
| ☀️ sun `U+2600 FE0F` | critipath | 🔴 carries a variation selector — see the test above |
| 🌞 sun-with-face `U+1F31E` | critipath | selector-free and correct, but ⭐ carries the same claim with less visual weight beside 🌴 |
| 🎯 bullseye | critipath | an **aim** metaphor — "what we hope to hit", which care does not mean |
| 🌊 wave | happy | no contrast with 🌵; and it is a declared seaturtle vibe emoji |
| 🌿 herb | happy | 🟡 **collides for real** — `review.behavior.sh:372` prints `🌿 summary` |
| 🍀 clover | happy | asserts *fortune* — a fine actor-side read, but 🌴 pairs to 🌵 by silhouette |

🟡 **🌙 is double-booked and shipped anyway** — bhrain's guard prints `exhausted 🌙`, and the dreamer
role uses it. one more overload would make this a pattern rather than a one-off.

🟡 **a favorites list does not bar a glyph.** 🌴 sits in `rule.im_an.ehmpathy_seaturtle` and ships as
a tag regardless — a *prose vibe* emoji and a *tag* emoji sit in different registers, and the
`[feel, care]` brackets disambiguate. what **does** bar a glyph is a collision in the **same**
register, which is why 🌿 was cut.

## .rejected terms

### `edgepath` — ambiguous across *both* axes

| sense of "edge" | maps to | axis |
|-----------------|---------|------|
| "an edge that can cut" | sharp | feel |
| "an edge case / peripheral" | alter | care |

a reader who meets `edgepath` cannot tell which axis it names. two further traps: "edge case" is the
exact misread rejected for alterpath (a fallback path, not a rare peripheral one), and "edge"
smuggles in a frequency read, when care turns on `freq × cost` rather than frequency alone.

> **`boundary` is the legitimate word** for "a point where the system's response changes" — see
> `define.experience._.metric=boundary-density`. what is rejected is `edge` as the label of a
> **path** or an axis value.

⇒ use `sharp path` (the feel edge), `alterpath` (the care fallback path), `boundary` (the coverage
target).

### `crierpath` → `alterpath`

- `crier` ("a surprise failure that makes someone cry") needed a gloss on every use — **opaque on
  first read**
- `alter` is self-evident: an **alter**nate path, the *other* route
  - so the word names *why* the path is non-critical
  - and it keeps the `-path` rhyme with `critipath`

### `corepath` — considered, not adopted

a real contender: it dodges the project-management overload of "critical path" (the longest
dependency chain) and echoes our own words ("a *core usecase* depends on it"). `critipath` kept for
continuity; `corepath` remains the fallback name if the pm overload ever bites.

### `freq` — rejected as the axis *name*, though it is an input

- frequency is **half** of care — `severity = freq × cost`
  - a critipath can be rare: a once-a-year recovery whose break cannot recover (low freq, cost → ∞)
  - an alterpath can be frequent: a common shortcut with a costless fallback (high freq, cost ≈ 0)
- ⇒ so the axis is named for the **product**, never for either factor

### `positive` / `negative` / `seam` — demoted to hunt-aid

- they name the *machine's* decision points, not the *actor's* lived encounter
  - engineer vocab, and the axis is experience-native
  - and they straddle the axes as `edge` does
- ⇒ they survive only inside `howto.experience.enumerate`, as a **scan aid**
  - the rejection, the limit, the handoff — three places to **find** a sharp path
  - never as a taxonomy

## .disputes

### dispute: hazard — raised 2026-09-05 — status: RESOLVED (keep `edge`)

- raised.by  = beaver
- claim      = *"a hazard the behavior must guard"* reads sharper than *"an edge…"*, because it
               names the obligation rather than a mere geometric feature
- counter    = 🔴 **`hazard` is already canonical elsewhere, twice over.** mhedic declares it as
               *"a potential adverse effect an exposure can cause"*; bhuild already uses it as
               "a class of defect" (`rule.forbid.behavior-hazards`, `.friction-hazards`,
               `.maintenance-hazards`). a third sense on the feel axis is not inconsistency but
               ambiguity — one word, three concepts. separately, `edge` held ~14 uses across the
               behaver briefs and was canonical by weight of use
- resolution = keep `edge`; record `hazard` as a forbidden synonym for the feel discriminator. the
               gloss need is served in full by *"an edge the behavior must guard"* — the obligation
               rides the phrase, not the noun

provenance:

- the synonym was introduced by my own gloss, mid-drive, as i edited
  `define.experience._.axis=feel.path=happy-vs-sharp`
- it was never a considered candidate — it drifted in and stood for ~20 sites before the
  inconsistency was caught
- ⇒ recorded so a reader does not mistake it for a rejected proposal that was ever argued for on
  the record

⇒ `hazard` remains correct in its own senses. `define.experience.md` legitimately says
"maintenance hazard", and that use is untouched.

## .the disputable claim under all of it

🟡 **each axis carries one decoy that reads correct and is not.**

| axis | the decoy | why it is wrong |
|------|-----------|-----------------|
| `feel` | *"did the actor get what they came for?"* | an **outcome** gloss — true of both poles. a sharp path routinely succeeds |
| `care` | *"is there a workable route around a break?"* | the brief's **test**, not its definition. `0 × ∞ = 0` refutes it |

⇒ `define.experience._.demo.ship-sailor` demos both decoys in one wish.

## .evidence

- **discovery** — dimensional decomposition of `actor × lens × feel` (56 cells) plus three worked
  demos, each of which isolates exactly one lesson so none restates another:
  - `define.experience._.demo.surf-school` 🐢 — the 2×2 baseline; the axes are independent
  - `define.experience._.demo.camp-beaver` 🦫 — frequency alone flips care; severity is an aggregate
  - `define.experience._.demo.ship-sailor` 🐈⛵ — the two decoys above
- **precedent** — `rule.forbid.ambiguous-labels` (ergonomist) is the general one-name-one-sense rule
  the one-name principle applies to axis values.
- **invariant** — a term that reads as a value on more than one axis is rejected. when a candidate
  feels *tidy* but straddles, that tidiness is the smell.
