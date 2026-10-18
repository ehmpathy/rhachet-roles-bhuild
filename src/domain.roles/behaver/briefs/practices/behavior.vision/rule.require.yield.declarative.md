# rule.require.yield.declarative

> **a yield is written in ONE grammatical mood: the declarative. it states what IS.**

the other two moods are forbidden, and each fails differently:

| mood | the sentence answers | verdict |
|---|---|---|
| **declarative** | *"what IS?"* | ✅ the only mood a yield takes |
| **narrative** | *"what HAPPENED?"* | 🔴 a chronicle — the log of how the state was reached |
| **imperative** | *"what should you DO?"* | 🔴 an order the yield has no standing to give |

⇒ **a yield is the FINAL artifact of its stage.** the road that produced it zooms to an appendix.

## 🔴 .EVERY stage's yield, and a roadmap is the case that proves it

the obvious escape is *"an order belongs in the roadmap"*. it does not — **a roadmap is a yield too,
and it declares.**

- 👎 *"first narrow the glob, then fold the doubled flag"*
- 👍 *"phase 1 = the glob is narrowed. phase 2 = the flag is folded. phase 2 reads phase 1's output."*

the second states the same order and states it as **structure** — the dependency is a property of the
phases, checkable against them. the first states it as a **decision about sequence**, which is the
author's deliberation and belongs in the appendix beside every other deliberation.

⇒ so the rule does not route the imperative downstream. **there is no downstream artifact that takes
it** — it is re-mooded wherever it appears, or it is archaeology.

## 🔴 .the mechanical reason, and it is why this is a blocker rather than a taste call

an imperative drifts against **every tool that operates on state**.

| | a declared state | an order |
|---|---|---|
| applied twice | converges — same result | 🔴 duplicates, or errors |
| verified | diff the state against the declaration | 🔴 unverifiable — no artifact says it was obeyed |
| after it is satisfied | still true | 🔴 **false, and no mark says so** |

⇒ this is `rule.prefer.declastruct` and `rule.require.idempotent-operations` at the prose grain.
**a declared state is idempotent; an instruction is a one-shot that rots on obedience.**

🟡 and the rot is silent — a stage gate can check a stated state against reality and cannot check
whether an order was followed.

## .the test — one question per mood

> **1.** strip every temporal word — *"now"*, *"we tried"*, *"this round"*, every `iNNN`, every date.
> does the claim still stand? collapse → **narrative**
>
> **2.** does the sentence command, advise, or prescribe? → **imperative**
>
> its tells: *"add X"* · *"the driver should"* · *"be sure to"* · *"will be"*.

🟡 **not *"is this true?"*** — every chronicle line and every instruction is true. that is what
carries them past a fact-check and past every density rule.

🟡 **the tell for mood 2 is a future tense.** *"will"*, *"is to be"*, *"remains to be"* — a yield has
no future tense, because a state that does not hold yet is not a state this artifact may declare.

## .the three grammars

| | a chronicle | an instruction | a yield |
|---|---|---|---|
| tense | past | future / imperative | **present** |
| subject | the author, or the round | the reader | **the artifact, or the decision** |
| grows by | **append** — a layer per round | **append** — an item per idea | **replacement** — it is rewritten |
| a reader gains | how you got here | a task | **what to act on** |

⇒ **the grows-by row is the operative one, and both failures share it.** a declaration is rewritten
in place, so its length tracks the decisions rather than the rounds.

🔴 **so the sharpest cue is a size delta on a round where no decision changed.** that growth is
archaeology or backlog by construction — there was no new state to declare.

## .the clamp is a LINT, not a brief

`review.for.yield-archaeology` names the line, deterministically, at $0 and 1ms, at `level: 0` —
before any paid lane runs.

| grade | the tell |
|---|---|
| 🔴 blocker | `retraction` · `attempt-trail` · `confidence-trajectory` · `iteration-ref` · `decision-process` |
| 🟡 nitpick | `calendar-date` · `temporal-deixis` · `process-narration` |

⇒ **a reviewer STATES a verdict a driver can argue with; a lint NAMES a line, so the repair is an
edit.** that is why this rule's enforcement is mechanized where its siblings' is not.

| when… | then… |
|---|---|
| the yield grew on a round where no decision changed | 🔴 the strongest cue. that growth is the defect |
| you would write *"the driver should"*, *"add X"*, *"be sure to"* | imperative. declare the state the step reaches |
| you reach for a **future tense** | a yield has no future tense. it holds, or it is not yours to declare |
| you would send an order to the roadmap | a roadmap declares too. re-mood it there, or eject it |
| you would write *"an earlier draft"*, *"i was wrong"*, *"we first tried"* | a retraction or an attempt trail. state what holds |
| you would write a confidence that moved — `70% → 93%` | the reader acts on where it landed |
| you would cite a round — `i038`, *"on the second pass"* | a round is archaeology by definition |
| you would write *"we deliberately chose"* | the reader did not attend the deliberation. state the choice |
| you would APPEND a section rather than revise one | the append is the tell. a yield is rewritten |
| the road is worth a record | it often is. eject it to the appendix and cite it by path |

## .the boundary

| a violation | not a violation |
|---|---|
| the road to a decision, stated inline | the decision, and one line of ground |
| a reversal narrated | a caveat the reader must **act** on |
| an order the reader is to carry out | a **constraint** the state must satisfy, stated as a property |
| *"phase 2 will fold the flag"* | *"phase 2 = the flag is folded"* |
| a date on a claim | a date inside a **verbatim quote** |
| a round cited as evidence | a measurement stated as a fact |

**the line: does the reader need it to ACT, or to follow how you got here?** act → it stays. follow
→ eject it, and cite the path.

🟡 **and an imperative that survives the ACT test is still forbidden** — a reader does act on an
order, so that test alone passes it. mood 2 is what catches it: an order may be useful and still
have no place in an artifact whose job is to declare.

## .the seam with its two siblings

| rule | its question |
|---|---|
| **this rule** | is this a STATE or a LOG? |
| `require.yield.hermeticity` | can a stranger parse this ALONE? |
| `forbid.yield.baggage` | what does this line assume the reader CARRIES? |

⇒ they overlap on accretion and part everywhere else: a hermetic chronicle is parseable by a
stranger and still a log; a declarative fragment states the present and still needs a jump.

blocker: an order, a prescription, or a future tense where a declared state was owed · the road to a
decision left inline · a reversal or attempt trail narrated · a round or a confidence trajectory
cited · a deliberation recounted · a section appended where a revision was owed.
nitpick: a calendar date on a claim · a word whose referent is a moment.
false positive: a caveat the reader must act on · a constraint stated as a property of the state · a
measurement stated as a fact · a verbatim quote · an appendix, whose declared subject IS the road.

⇒ see also: `rule.require.yield.hermeticity` · `rule.forbid.yield.baggage` ·
`rule.always.yield-the-output-not-the-archaeology` (`bhrain/role=driver` — the parent) ·
`rule.forbid.chronological-accretion` (`ehmpathy/role=mechanic` — the narrative shape, in full) ·
`rule.prefer.declastruct` + `rule.require.idempotent-operations` (the imperative shape, at the code
grain) · `review.for.yield-archaeology` (the lint that clamps mood 1).
