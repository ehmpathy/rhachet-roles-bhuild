# domain.term.choice.reason: phantom

## .etymology

**phantom** — greek *phantasma*, an appearance. a phantom is what you see where the subject is
not: the appearance persists, the substance has left.

that is exactly the defect. a registry row is an **appearance of a duct** — it says *"a duct lives
here"*, and it says it in the same bytes whether the duct lives or not. the word names the gap
between what the record shows and what is there.

it also carries the right severity. a phantom is not dangerous; it **misleads**. that is the
correct weight for litter whose only cost is noise.

## .the rejected synonyms

| ⛔ word | why it distorts |
|---|---|
| **ghost** | taken, and taken hard. `duct.poll` renders `❔ box UNKNOWN (remote — treat as ghost, do not submit)` for a box it cannot read, and `rule.require.distinguish-prefilled-from-suggested` uses *ghost* for an autocomplete suggestion. two live senses already; a third would be the overload `rule.forbid.domain-term-ambiguity` grades a blocker |
| **zombie** | in unix a zombie process **still exists** — it holds a pid and awaits a reap. that is the opposite state: a zombie is substance with no reaper, a phantom is a record with no substance. a borrowed word whose canon means the inverse is worse than a coined one |
| **orphan** | already taken by git for an *orphaned worktree* — a dir git **still owns** whose branch was deleted. `term=husk` had to spend a whole section to part that from a husk; to spend `orphan` again here would re-open the same confusion one layer over |
| **stale row** | names the mechanism and misses the sense. *stale* implies the record was once right and has aged — true of a phantom, and equally true of a cache that merely needs a refresh. a phantom can never be refreshed into correctness; its subject is gone |
| **leftover** | too weak to carry the two-layer split, and it implies a remainder of work still underway |
| **residue** | the word this file's own prose reaches for as a *description*. as a TERM it collides with `term=husk`'s *"the residue of a teardown that died halfway"* — which names a husk, the exact mirror. one word for two inverses is the sharpest possible drift |
| **husk** | the mirror, not a synonym. see the inversion table in the say file |

## .why the pair with `husk` carries the load

`husk` was paved on 2026-08-25 after **two misreads in one hour**, and its say file already draws
the inversion in full: substance-with-no-record versus record-with-no-substance, and two cures
that do not cross.

so `phantom` arrives with its hardest work already done. what it adds is the **other half named**,
so a reader can reach the distinction from either side. before this cluster, a traveler who met a
phantom first had to find `term=husk` — a word for the opposite defect — to learn what a phantom
is. that is a real cost, and it is the cost `rule.require.domain-term-itemization` exists to end.

## .the two-layer split, and why it is a property of the term

the say file records that a phantom renders `👻 phantom` at the crew layer and `💥 malfunction` at
the duct layer. that is not a render quirk to be tidied away — it is a genuine limit, and the term
must carry it:

> **a `💥` at the duct layer is a DISJUNCTION.** it means *the read failed OR the subject is gone*,
> and the duct layer holds no source that parts the two.

`term=false-report`'s countermeasure applies directly, and its derived-pair trap applies with it:
`duct.poll` derives its fleet from `duct.list`, so to check a `💥` against `duct.list` asks one
registry the same question twice. the read that adjudicates is the **filesystem or live tmux** — a
source the registry does not feed.

this was settled on 2026-08-05 by exactly that move: `ls -d …/_worktrees/<tree>` returned
`NO_SUCH_WORKTREE`, which proved the `💥` true and the `duct.list` row a false report. it is
recorded in `term=false-report._.choice._.md` — a phantom, by this file's definition, diagnosed
long before the word had a cluster.

## .the evidence — 20 files leaned on it, and one of them flagged the gap

at the moment of the pave:

| where | what it says |
|---|---|
| `term=duct._.choice._.md` | *"a **phantom** = a row whose session is gone → `duct.poll` reports `💥 malfunction`"* |
| `term=husk._.choice._.md` | the four-row classification table, with `phantom` as its fourth row |
| `term=crew._.choice._.md` | `👻 phantom \| no duct, no tree \| term=duct · term=husk — **no cluster of its own**` |
| `term=down._.choice._.md` | *"a phantom has no tree, so there is nowhere to boot. `down` is recoverable; `phantom` is litter"* |
| `rule.require.speak-at-the-supervisor-layer.md` | *"a felled tree left a phantom crew"* — offered as the CORRECT work-layer sentence |
| `git.crew.poll.sh` | renders the verdict |

**the third row is the sharpest evidence this glossary has produced.** `term=crew`'s table names
the gap in its own cell — *"no cluster of its own"* — and that annotation sat there while the term
stayed on a deferred list. a glossary that documents its own hole and then leaves it open has
converted a gap into a fact.

## .⚠️ why it was deferred for fifteen rounds, and why that was WRONG

`phantom` sat on the deferred list from roughly r120 onward, carried forward unchanged in every
round's final paragraph. the deferral was never re-argued; it was **inherited**.

and the verdict it inherited had been overturned. the sequence:

| round | what happened |
|---|---|
| ~r120 | `phantom` deferred — party count one, and the replication gate was read as a bar to any single-party pave |
| **r131** | the gate was **sharpened**: *"the gate blocks an INVENTED distinction, never a RECORDED one."* `nudge` was paved on one party for exactly this reason — 19 files leaned on it and a paved file already drew its boundary |
| r132–r136 | `phantom` carried forward on the deferred list, five more times, under the pre-r131 read |

`phantom` fits r131's exemption precisely: `term=husk` had **already drawn** its distinction, in a
table, at say level. the gate stopped covering it the moment r131 was written, and no round
noticed — because a deferred entry is re-read as a **label** rather than as a claim.

### the defect this yields, and it is about the glossary's own process

> **a deferral list inherits its entries' verdicts and never re-runs them against rules paved
> since.** every entry is a judgment made under the rules of its own round; the list carries the
> judgment forward and drops the rulebook that produced it.

the shape is `partial audit`'s fourth mechanism aimed at time rather than at subject: the subject
set was complete — the list was read every round, in full — and the CLAIM each entry carries,
*"this cannot be paved yet"*, was answered against a rulebook that had since changed.

**the cure is cheap, and it belongs to the round that paves a gate rather than to the list:**

> when you sharpen a gate, **re-run the deferred list against the new form, in that same round.**
> r131 sharpened the replication gate and paved `nudge` under it — and `phantom`, which meets the
> identical test, sat four feet away on the same page.

and a weaker but general form, for a list nobody sharpened a gate against:

> a deferral owes **what would discharge it**, never a date. *"⚗️ next round"* costs naught to be
> wrong about and renews itself indefinitely; *"waits for a second party, or for an artifact that
> settles it"* is a condition a reader can check.

r135 wrote `resume`'s deferral in the second form and `escalate`'s in the first. `escalate` has now
been carried *"⚗️ next round"* for three consecutive rounds.

## .the live instance that forced it — 2026-08-28

four consecutive babysit ticks polled **19 malfunctions out of 28 ducts** — roughly 68% of every
report. all 19 are duct-layer phantoms from trees felled days earlier.

that is the noise hazard, measured: a supervisor who reads that poll scans 9 real verdicts out of
28 rows, every 15 minutes. the term earns its keep because it makes the 19 nameable as **one class
with one cure**, rather than 19 separate instrument failures to be diagnosed one at a time.

## .disputes

### dispute: `phantom` for a record that was NEVER true — raised 2026-09-05 — status: OPEN

- **raised.by** — beaver 🦫, mid-babysit
- **claim** — this file defines a phantom as *"a record whose subject is **gone**"*, and stakes its
  identity on that history: it is *"what a **teardown** leaves"*, and `stale row` was rejected
  precisely because *"stale implies the record was once right — **true of a phantom**."* ⇒ the term
  asserts **once-true, now-false**. but the corpus uses the same word for **never-true**, and that
  is a second concept with no home
- **counter** — both senses share one measurement: *an index asserts a referent, and the referent
  is absent*. the history is a **cause**, and `term=duct.box.quiet` warns in its own file that six
  of seven rejects failed by a name for the CAUSE where the measurement holds only an EFFECT. so a
  split may import exactly the defect that file paid to avoid
- **resolution** — *(open)*

#### .the enumeration — n=5 for the never-true sense, across four instruments

| where | the usage | the subject |
|---|---|---|
| `rule.always.reuse-pavement-before-improvise` | *"the **phantom path** — a cited parent claim that was **never written**"* | a brief that does not exist |
| `term=false-report._.choice._.md:100` | *"EVERY empty result renders as one **phantom row**, at line 0 of no file"* | a match the instrument invented |
| `term=false-report._.choice._.md:734` | *"a mechanic that hit three **phantom blockers**"* | defects a reviewer invented |
| `crewwork.verbs.integration.test.ts` | *"a tab onto an absent session leaves a **phantom row**"* | a tab that pointed at naught from birth |
| this round, 2026-09-05 | `rhx git.stage.add --glob` — advertised by a brief **and** by an exact-match permission entry, rejected by the skill | a flag never implemented |

⇒ against the paved sense, which is well-attested and consistent: a felled tree's leftover ledger
rows (`term=asleep`, `term=duct`, `term=down`, `crewwork.sh:1429`, and the 19-of-28 instance above).
**neither sense is a stray. both carry weight.**

#### 🔴 .the discriminator is the CURE — the same test this file already runs on `husk`

the phantom/husk pair earns its keep because *"the cures **do not cross**."* run that same test
here and the two senses part just as cleanly:

| | the record was | the cure |
|---|---|---|
| **once-true** (paved) | correct, then its subject was torn down | **clear the record** — `duct.stop`, `crew.fell`. it is litter, and one act ends it |
| **never-true** | wrong the moment it was written | 🔴 **a fork, and you must pick** — make the referent real (write the file, implement the flag), or retract the claim |

a supervisor who reads *"phantom"* and reaches for the clear-the-record cure will delete a
**citation** that was the only record of an owed artifact. that is not a no-op; it destroys the
one trace of the gap.

⇒ and the never-true sense carries a severity the paved one denies. this file says a phantom
*"is not dangerous; it **misleads**"* and is *"litter, not an incident."* a phantom blocker cost a
mechanic real rounds, and a phantom path is graded a **blocker** by
`rule.always.reuse-pavement-before-improvise`. **litter is the wrong price for either.**

#### .what would settle it

- a word for the never-true sense that names the **effect**, never its cause, so the
  `duct.box.quiet` trap is dodged — the counter above is the bar it must clear
- or a widened `.what` here, which then owes the removal of *"gone"*, *"teardown"*, and the
  `stale row` rejection, since all three assert a history that a wider `.what` would drop
- ⚠️ and the never-true sense may itself split — an instrument that **fabricates** a referent
  (`false-report`'s two rows) is not plainly the same as an author who **cites** an unbuilt one.
  enumerate that before any word is picked (`rule.require.enumerate-before-you-name`)

## ⚠️ .a second, independent defect — this cluster carries NO boundary

`rule.require.boundary-qualified-terms` requires a `term.boundary` field and a filename that
carries the full ancestry. this cluster has neither — the say file's header runs `term.chosen`,
`term.kind`, `term.synonyms.forbidden` with **no `term.boundary`**, and the filename is the flat
`term=phantom._.choice._.md`.

that rule grades both as **blockers**, and its own test — *"$word, of WHAT?"* — is answered in
this file's fourth section: **a phantom is of a `record`**, and it *"lives at TWO layers"*
(`duct` and `crew`). so the boundary is known and simply unwritten.

⇒ recorded rather than repaired here, because the dispute above may move it: a boundary is the
paved repair when two senses differ by **context**, and whether these differ by context or by
**concept** is precisely what stays open. to qualify the filename now, then split the term next
round, is two renames where one would serve.

## 🔴 .the GLYPH collision — `👻` marks three concepts, and one of them is this term's forbidden synonym

**measured 2026-09-04.** `👻` is not this term's alone, and the sharpest proof sits in **one file's
own legend, thirty lines apart**:

```sh
git.crew.poll.sh:107    👻 phantom    no duct, no tree HERE    -> a felled tree's stale rows
git.crew.poll.sh:137    👻ghost       an autocomplete ghost    -> NEVER submit; it is not a message
```

a reader who learns the glyph from line 107 meets line 137 forty rows later in the same output.

| surface | what `👻` marks | the layer |
|---|---|---|
| `git.crew.poll.sh:1162, 2053` | a **phantom** — a felled tree's registry rows | crew |
| `git.crew.poll.sh:584, 137` · `duct.poll.sh:814` | a **ghost** — dim autocomplete text in an input box | box |
| `duct.audit.sh:70` | a config **listed and absent on disk** — *"a candidate, never loaded"* | audit |

⇒ three concepts, three instruments, one glyph.

### 🔴 .why this is worse than the `😴` collision

two reasons, and the second has no counterpart in the `duct.box.quiet` case.

**1. the severities are inverted, and the glyph carries the wrong one.** this file grades a phantom
*"litter, not an incident"* — a row you may safely ignore. the box sense is the opposite: its own
legend reads **`NEVER submit; it is not a message`**, because a submit fabricates content under the
human's name (`rule.require.distinguish-prefilled-from-suggested`). ⇒ **the glyph that means
"ignore me" also means the most dangerous box state in the fleet.**

**2. 🔴 the second sense is spelled with this term's FORBIDDEN synonym.** `ghost` sits at the head
of `term.synonyms.forbidden` in the say file. `git.crew.poll.sh:584` renders the literal string
`👻ghost`. so the banned word is not merely in use — it is in use **as another concept's name,
under the very glyph that forbade it.**

that breaches `rule.forbid.domain-term-synonyms` and `rule.forbid.domain-term-ambiguity` at once,
on one token. and the forbid list cannot catch it, because the list guards against `ghost` used to
mean *phantom* — here it names a different concept entirely, which is the harder case and the one
no grep for a synonym will surface.

### ⚠️ .what this does NOT yet establish

`term=crew.status._.choice.reason.md` records a `👋` collision and offers a candidate pattern —
*a glyph chosen for the SHAPE of a condition rather than its OWNER* — with the threshold
*"one more instance from a different surface and it earns a term."*

`👻` fits the shape: a phantom and a ghost are both *"not really there"*, so the glyph names the
appearance while the owner and the cure differ completely.

🔴 **but it does not clear the threshold, and to claim it would repeat this session's own recorded
error.** `😴`, `👋`, and `👻` are three glyphs on **one primary instrument** — `git.crew.poll.sh`.
that is one surface counted three times, not three surfaces. the same defect as a corroboration
count taken with no check that the corroborations are independent.

⇒ the pattern stays a **candidate**. what would settle it is one collision on an instrument that
is not the poll — and the `duct.audit.sh:70` row above is a genuine second instrument for `👻`
specifically, so the **glyph's** case is proven while the **pattern's** is not.

### .what is owed

| owed | to |
|---|---|
| 🔴 a glyph of its own for the box sense, and `👻` left to `phantom` | `git.crew.poll.sh:137,584` · `duct.poll.sh:814` + the palette |
| 🔴 the word `ghost` retired from the render — it is a forbidden synonym of this very term | `git.crew.poll.sh:584` |
| a third glyph, or a qualifier, for the `duct.audit` sense | `duct.audit.sh:70` |
| ⚠️ **a `domain.glyphs/` catalog — this repo has none**, so no grep can tell used from claimed | the repo (caught as a dream) |

⚠️ the repair must come from a **palette**, never a grep — a grep proves a glyph unused, never
unclaimed (`im_an.obsessive_learner.for.domain.glyphs`). and this repo has no catalog to consult,
which is why that row is the one the others depend on.

## .refs

- `term=husk._.choice._.md` — the mirror, and where the inversion is drawn in full
- `term=duct._.choice._.md` — the row/session split a phantom sits in the gap of
- `term=false-report._.choice._.md` — the derived-pair trap, and the 2026-08-05 adjudication
- `rule.require.domain-term-itemization` (learner) — the rule a 20-file lean triggers
- `term=replication._.choice._.md` — the gate, and r131's exemption this pave rests on

---

written by human + beaver 🦫
