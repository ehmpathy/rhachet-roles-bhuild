# domain.term.choice.reason: sprout

## .etymology — a human coinage, and a deliberate pair

vlad coined `sprout` and `seed` together on 2026-08-09, as a matched pair for the two dispatch
shapes. that provenance is recorded as what it is: a **human attestation**, not a citation of
prior art.

the garden metaphor does real work rather than decorate. a sprout breaks ground — it is visible,
it consumes soil and water the moment it happens, and you cannot put it back. that is a precise
description of what a tree boot costs, and it needs no gloss.

## .why the word is the AUTHORIZATION, not merely a label

this is the part that separates `sprout` from an ordinary synonym choice.

the rule, settled 2026-08-09: **`sprout` is the only word that authorizes a tree boot, and its
absence forbids one.** every other way a dispatch is said defaults to a seed.

so the word is not a convenient name for an act the supervisor decides to take. **the word IS the
decision.** the supervisor's whole judgment collapses to a string match plus a default — no
severity to weigh, no urgency to read, no tone to interpret.

that also makes a violation legible after the fact: a tree exists, and the transcript either
holds the word or it does not. a judgment leaves no such trace.

## .the evidence — a fell, then a question that was the wrong repair

nheuron booted a full worktree off a bare *"dispatch a task into rhachet-roles-bhuild"*. the
human had meant a queued issue — *"we're not ready to begin it."* the tree was felled, its boot
artifacts discarded, and the work redone as a push.

the first repair was `rule.require.clarify-radio-push-vs-pull`: **ask** on every ambiguous
dispatch. it held for days, and it was the wrong shape.

**why the question was the wrong repair:** an ask is worth its cost only while neither answer is
known to be safer. write the asymmetry down and the answer IS known:

| | a wrong seed | a wrong sprout |
|---|---|---|
| cost | a gh issue nobody wanted | a branch, a worktree, two ducts, a terminal, an install, a bound route |
| undone by | a close | `git.tree.del`, which refuses where the tree holds work |
| disturbs | naught | the fleet — a crew begins the wrong work at once |

**the decisive property is not that a seed is cheaper. it is that the recovery path from a wrong
seed passes THROUGH the seed.** a seed that should have been a sprout costs one message — the
human says "sprout it" and the tree boots from the very same wish, already authored. a sprout
that should have been a seed costs a fell, and the wish must be pushed to the radio anyway.

so a seed is never wasted work. a sprout can be. that is what sets the default, and what left the
question as a round trip that bought naught on a phrase said many times a day.

## .why the forbidden synonyms distort

| ⛔ synonym | why it distorts |
|---|---|
| `pull` | the prior name, and it names the DIRECTION rather than the act. `push`/`pull` are a mechanism pair a reader must first map onto consequences; sprout/seed carry the consequence in the word |
| `boot` | already taken, one layer down — `crew.boot` turns on a crew's WORK axis on a tree that already exists. to reuse it for the tree itself overloads one word onto two layers |
| `spin up` | two words, and vague about what comes up. it also reads as cheap, which is the exact property a tree does not have |
| `kick off` | names urgency rather than mechanism. a sprout is not more urgent than a seed; it is more expensive |
| `start` | the most dangerous of the set, because it is the word a human reaches for by instinct. it describes every act and authorizes none |
| `claim` | belongs to the radio's own lifecycle (`QUEUED → CLAIMED → DELIVERED`). a claim marks a task taken; it does not boot a tree |

## .disputes

### dispute: the match — strict literal, or a closed set?  —  raised 2026-08-09  —  status: OPEN

- raised.by  = beaver, at the moment the rule was written
- claim      = a strict literal match on `sprout` is the only form that fully removes the guess.
               a looser match re-opens the judgment the rule exists to close.
- counter    = "spin up a tree", "boot a worktree", "pull that task and start it" each name the
               act unmistakably. a supervisor that seeds in answer to one of those is technically
               correct and practically obtuse, and the human pays a round trip to say one word.
- resolution = **UNSETTLED.** a small **closed, declared** set would keep the pit-of-success while
               it absorbs the obvious phrasings; an open-ended *"whatever sounds like it"* would
               not. the boundary between those two is the whole question, and it belongs to the
               role that owns the vocabulary. carried into
               `ehmpathy/rhachet-roles-bhuild#325` as an explicit open question.

**until it is settled, the strict read governs here:** where the word is absent, seed. that is
the safe side of an open dispute, per the asymmetry above.

### the first field use — 2026-08-12, and it arrived as a NOUN

the dispute above had never been exercised on a real utterance. on 2026-08-12 it was:

> *"hey, please dispatch a **sprout** to upgrade sdk-aws-lambda to support .forSqs …"*

the strict read fired, a tree booted, and no question was owed. that is the outcome the default
was built for, and a rule never triggered reads exactly like one that is.

**but note the grammar.** the say file declares `term.kind = verb`, and the human reached for the
NOUN — *"dispatch a sprout"*, never *"sprout it"*. the match held anyway, because it keys on the
WORD rather than on its part of speech.

that is worth the record rather than a correction. a strict-literal rule that keyed on the verb
form would have missed this utterance and seeded a task the human wanted begun — the exact wrong
answer, produced by a rule that was too precise. so the kind declaration names the word's primary
sense; it does not narrow what authorizes a boot.

it also sharpens the OPEN dispute one notch. the question there is how wide the match should be,
and the first real utterance landed **outside the declared part of speech and squarely inside the
intent** — which is evidence that a match on the bare token already does more work than a
grammar-aware one would.

### the second and third field uses — 2026-08-31, and the OBJECT moved too

the entry above records that the first real utterance landed outside the declared part of speech.
two more landed on 2026-08-31, in one exchange, and they moved a different axis: the **object**.

| # | the utterance | grammar | its object |
|---|---|---|---|
| 1 | *"dispatch a **sprout** to upgrade sdk-aws-lambda…"* | noun | none |
| 2 | *"please **sprout** this"* — followed by a pasted handoff | verb | a **document** |
| 3 | *"just **sprout** the crew"* | verb | a **crew** |

the say file declares the act as *"to **dispatch a tree**"*. **not one of the three utterances
named a tree.** the match held in every case, because it keys on the bare token.

#### why `crew` is not a drift

`crew ↔ tree ↔ branch ↔ pr` is strictly 1:1:1:1 (`term=crew`), and `git.tree.behavior` boots both
halves in one call — a worktree AND the clones on it. so *"sprout the crew"* and *"sprout the
tree"* name one act through two faces of the same pair. the human named the half they cared about:
they wanted workers begun, not a directory made.

that is the domain expert's own word for the act (`def.domain-discovery`), so it is evidence about
the term rather than a synonym to correct. **no dispute is owed.** what it corrects is the say
file's implicit narrowness, and the correction is small: `sprout` takes the **crew** or the
**tree** as its object interchangeably, because the two are one act by construction.

#### why the DOCUMENT object matters more

utterance 2 is the sharper one. its object was a handoff — an artifact that is neither a tree nor
a crew, and cannot be sprouted at all. read literally it is a category error.

read as the human meant it, it is a **compression**: *"do the sprout this document describes."*
the supervisor's job there is to author the wish the document implies and boot from it, which is
exactly what happened. so the object of `sprout` is often not what gets sprouted but the
**material the sprout is drawn from**.

that widens the strict-literal read in a direction the OPEN dispute never contemplated. the
dispute asks *how many WORDS authorize a boot*; these three utterances say the harder variable is
**what may follow the word**. a rule that keyed on `sprout a tree` would have missed all three.

⚠️ and it cuts the other way too. an object that is neither tree, crew, nor material — *"sprout an
idea"*, *"sprout a discussion"* — would match the bare token and authorize a boot nobody asked
for. no such utterance is on record, so this is a **recorded gap, not a repaired one**; it is
carried into the same open dispute rather than patched here.

### the case still worth a question

one, and it is narrow: the human names a **tree-shaped outcome** AND withholds the word — *"get
someone onto X right now"*. that describes an act begun, not a task queued, so the default is
plausibly wrong and one question is cheaper than a fell.

a bare *"dispatch a task into $repo"* is NOT that case, and earns no question.

## .see also

- `term=seed._.choice._.md` — the counterpart; the pair is defined against each other
- `define.sprout-vs-seed.md` — the full brief, with the default and its enforcement
- `rule.require.clarify-radio-push-vs-pull.md` — the superseded ask, kept with its supersession
  noted rather than deleted
- `term=crew._.choice.reason.md` — the same lesson one layer down: *a safety fix in the mechanism
  is not finished until the NAMES carry it too*

---

written by human + beaver 🦫
