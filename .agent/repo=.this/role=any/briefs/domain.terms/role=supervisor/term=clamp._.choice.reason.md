# domain.term.choice.reason: clamp

## .etymology

a clamp is a fastener that holds two parts under pressure. it does no work of its own — it
**prevents motion**. that is exactly the artifact's job: the fix makes the code right, and the
clamp stops it from a slide back to wrong.

the metaphor carries three properties the alternatives drop:

| the physical clamp | the test |
|---|---|
| holds a JOINT, not a point | it clamps the class, not the one value that broke |
| you feel it bite when you tighten it | it must have been seen red — a clamp with no bite is loose |
| it is left in place | it stays in the suite forever; the repro that proved the fix IS the clamp |

the third is why `rule.require.clamp-edge-cases` insists the clamp costs no extra work: you
build a reproduction to convince yourself the fix works, and to throw it away is to pay the
full price and keep none of the protection.

## .the rejected alternatives

### `guard` — refused outright, the collision is total

`guard` is the **bhrain route object**: a `N.name.guard` file with `artifacts:`, `protect:`,
`judges:`, and `reviews:`. it gates a stone's passage. it is not a test at all.

a reader who meets *"the guard caught the class"* has to work out which guard, and the two
senses sit in the same repo, in the same sentence shapes. one word, two concepts — the exact
overload `rule.forbid.domain-term-synonyms` refuses.

### `regression test` — the nearest neighbour, and it is the one worth an argument

this is the honest rival. it names roughly the same artifact, it is industry-standard, and a
reader outside this repo would recognize it with no gloss. three reasons it lost:

1. **it is a CATEGORY, not a standard.** a regression test that was never seen red is still a
   regression test. a regression test aimed at the single value that broke is still one. both
   of the properties this repo cares about are *optional* under that word, and a word whose
   requirements are optional cannot carry a blocker.
2. **it does not verb.** *"clamp the boundary"*, *"clamped that narrow subject green"*, *"the
   clamp bites"* — every one of those is a sentence this glossary already writes, and
   *"regression-test the boundary"* is not a phrase anybody says.
3. **it names the OCCASION, not the function.** *regression* says *why you wrote it* (a defect
   came back once). *clamp* says *what it does* (it holds). per `def.domain-discovery`, a term
   that names the motive outlives one that names the circumstance.

`regression test` remains fine in prose as a gloss for an outside reader. it is forbidden as
the **contract** word — a test file, a case name, a rule name.

### the rest

| ⛔ | why it distorts |
|---|---|
| `safety net` | a net catches whatever falls. a clamp holds ONE class shut, and says naught about the rest |
| `canary` | a canary reports a live incident, in prod, after harm. a clamp refuses a merge, before |
| `smoke test` | breadth-first sanity across a system. a clamp is depth-first on one defect |
| `lock` / `latch` | vague, and `lock` collides with file locks and mutexes |
| `assertion` | one line inside a test. a clamp is the whole artifact, and may hold several |

## ⚠️ .why a word this heavily leaned on waited 184 mentions — and it is a GAP, not an oversight

this cluster is late by any measure. `clamp` appears **184 times** across `.agent`, is leaned
on by **five paved term clusters** (`partial-audit`, `false-report`, `husk`, `replication`,
`define.work-primitive-hierarchy`), and has a **blocker-severity rule named after it**. it had
no cluster.

that is not carelessness. it is the itemization rule's own trigger:

> `rule.require.domain-term-itemization`: *"every domain term — a noun, verb, or adj that
> composes this repo's declared **domain objects and domain operations**"*

**`clamp` composes no declaration.** there is no `Clamp` class, no `genClamp`, no `getClamp`.
it lives entirely in **prose** — rule names, brief bodies, test-case comments. so the rule that
exists to catch exactly this never fired, and could not have.

### the general form, and it reaches past this term

> **the itemization rule keys on CODE declarations, so a term that lives only in BRIEFS is
> invisible to it — however heavily the vocabulary leans on it.**

and the failure is silent in the worst way: a word everybody already agrees on accrues **no
dispute**, so it never trips the *"settle a synonym"* path either. both of the rule's triggers
are events, and a term with total consensus generates neither. the more universally a word is
understood, the longer it goes undefined.

the cheap detector, which cost one command here: **grep the glossary for a word and count the
files that lean on it.** a word carried by 3+ paved clusters with no cluster of its own is
owed one, whatever the code declares.

**recorded, not repaired.** whether `rule.require.domain-term-itemization` should grow a
prose-frequency trigger belongs to the learner role that owns it, and is owed a seed rather
than a patch applied here.

## .disputes

none open. the `guard` collision is not a dispute — it is a taken word, and the two concepts
are unrelated, so no argument exists to have.

`regression test` is recorded above as a **considered and rejected** alternative rather than a
dispute, because no traveler has argued for it. should one wish to, the case against it is laid
out in full above and is what to argue with.

## .evidence

### the discovery — a clamp that counted its own class

2026-08-31. `duct.send.sh`'s arg parser ended `*) shift ;;` — a silent catch-all that discards
a caller's flag and exits 0. it had eaten `--anyway` once, been repaired **at the instance**,
and ~months later eaten `--await`, which left a sprouted tree with no bound behavior.

the human's word was **"structurally"**, and that word is what made the round a class fix.
`[case12]` was written against the one file. it came back red over **six more wrappers**.

| what the clamp was written for | what it returned |
|---|---|
| 1 known offender | **7** offenders (of 9 duct wrappers; 2 never had it) |

so the clamp did not merely hold the door — it **enumerated the doors**, and it enumerated six
its author did not know existed. that is the strongest support on record for property 2.

### the bite proof, and the half that was NOT free

`[t0]` proved itself: red across six files, green after. no probe needed — the defect was live
when the clamp was written, which is the cheapest bite proof there is.

`[t1]` (a presence assertion on `--await`) had never been seen red. rather than a probe, it was
audited for the failure mode that actually threatened it: **a presence assertion can pass for
the wrong reason** — it may match a comment rather than the live call. one grep confirmed line
295 is the only match and it is the live forward.

that is a `partial audit` check aimed at a clamp's own subject: *is what i asserted what i
meant?*

### the vacuity instances

three clamps on record read green while they guarded naught, and each is a distinct mechanism:

| the clamp | the mechanism |
|---|---|
| `[case10]` | a **proxy the observer broke** — it checked the socket FILE, which tmux unlinks early in shutdown. 43 orphans |
| `[case7]` | a **mutable subject set** — it snapshotted a list still under construction, and `--scope` filtered its whole subject away. 1,786 orphans |
| two in `define.work-primitive-hierarchy` | a **comment-strip one step too far** would have emptied their subject entirely |

all three are `partial audit` at the level of a clamp's own roster, which is why that term is
the one to reach for when a green looks suspicious.

## .see also

- `rule.require.clamp-edge-cases` (mechanic) — the two properties, and the dogfood procedure
- `rule.require.test-covered-repairs` (mechanic) — the base rule
- `term=partial-audit._.choice._.md` — the green-check cure: *a check that could not have gone
  red on the defect is not evidence about the defect*
- `term=false-report._.choice._.md` — a vacuous clamp is a false report in test form
- `rule.require.domain-term-itemization` (learner) — the rule whose trigger this term slipped

---

written by human + beaver 🦫
