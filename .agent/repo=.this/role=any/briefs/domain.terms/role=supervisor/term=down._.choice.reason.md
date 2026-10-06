# domain.term.choice.reason: down

## .etymology

`down` comes from the operator's oldest vocabulary for a machine that was up and is not — *the box
is down*, *the site is down*. it carries three senses at once, and the fleet needs all three:

1. **it was UP** — the word presumes a prior live state, which is exactly the claim the verdict
   makes
2. **it is RECOVERABLE** — a box that is down comes back up. no operator hears *"down"* and reaches
   for a teardown
3. **the CAUSE is unstated** — a box is down whether it was shut off on purpose or fell over

the third is why it beat `stopped`, and it is the whole argument.

## .the rejected synonyms

| ⛔ synonym | why it distorts |
|-----------|-----------------|
| `stopped` | names a CAUSE, not a state. `crew.stop` is one road into `down`; a machine death is another, and on 2026-08-24 that second road took the whole fleet at once. a verdict that says `stopped` over a crew nobody stopped is a false report about causation (`term=partial-audit`, the provenance mechanism) |
| `dead` | over-claims. `dead` reads as terminal, and the row's own cure line says otherwise. reserve the finality for `fell` |
| `offline` | a network word. it says the crew cannot be REACHED, which is a different failure — a reachable grove can hold a down crew, and an unreachable grove can hold one at work (`term=grove`) |
| `idle` | the most expensive of the set. an idle crew is **at work** with an empty box; a down crew has no duct at all. they read identically from outside and take opposite cures — a nudge versus a boot (`rule.require.nudge-parked-clones`) |
| `inactive` | same defect as `idle`, plus it is a passive-voice hedge that names no state a verb can act on |
| `killed` | names a cause AND assigns an agent. most down crews had no killer |
| `asleep` | implies it wakes on its own. it does not — `crew.boot` is a deliberate act |

## .the evidence

### 1. the shipped skill renders it in five places

`git.crew.poll.sh`, read 2026-08-26:

| line | what it holds |
|---|---|
| `:66` | the verdict table — `💀 down · no duct, tree on disk · rhx git.crew.boot` |
| `:411` | the default assignment — every crew starts `down` and is lifted to `at work` only by a live duct |
| `:436` | the orphan guard — `down` **and** dirty is the loudest row in the fleet |
| `:470` | the tally |
| `:490` | the action line, which names the cure inline |

⚠️ **row `:436` is SUPERSEDED, 2026-09-03.** the orphan guard no longer keys on `down` alone. a
duct outlives its clone, so a crew can read `at work` and still hold no worker at its mechanic
keyboard. the guard now keys on `crew_cloneless` — `down`, OR `at work` with a `mechanic:shell`
box — so `down` is one of its two arms rather than the whole of it. two crews had been invisible
for five and a half hours; the measurement and the verdict live in `term=husk._.choice.reason.md`
under the 2026-09-03 entry.

⇒ `down` itself is untouched. what changed is that `down` ceased to be the ONLY way a tree loses
its worker.

line `:411` is the design tell: **`down` is the DEFAULT**, and `at work` is what must be proven.
that is the right way round — a live duct is positive evidence, and its absence is not.

### 2. the word was already in the glossary, as the subject of a defect

`term=ledger._.choice.reason.md:93-95`, written before this cluster existed:

> so a disk-derived poll reported **~128 crews that were never born**, each rendered
> `💀 down — rhx git.crew.boot` — a verdict that asserts a crew DIED where none ever existed. that
> clears both `false report` discriminators: the tool did not fail, and the content is untrue.

so the fleet's vocabulary held this word only as **evidence in another term's incident report**,
with no definition of its own. that is the state a glossary exists to prevent: a word the fleet
leans on, known well enough to indict and not well enough to define.

### 3. the derivation constraint the defect yields

the ~128 false rows were not a bug in the verdict. they were a bug in the **subject set**, and the
verdict was the messenger:

| the source | can it support `down`? |
|---|---|
| trees on disk | ⛔ no — a tree proves a crew COULD be booted, never that one WAS |
| live tmux | ⛔ no — it proves the present, and `down` is a claim about the past |
| **the crew ledger** | ✅ yes — one row per tree a crew was EVER booted on (`term=ledger`) |

this is `term=poll`'s derivation-axis rule aimed one level in: the axis must belong to the subject,
**and it must reach as far back as the verdict claims.** a verdict in the past tense needs a source
with a memory.

## .disputes

### dispute: stopped — raised 2026-08-26 — status: RESOLVED (keep `down`)

- raised.by  = beaver 🦫 (self-raised while the cluster was paved)
- claim      = the fleet already has `crew.stop` as the verb, so `stopped` is the symmetric state
               and `rule.prefer.symmetric-term-pairs` favours it
- counter    = the symmetry is real and it is the wrong symmetry. `stop` is **one** road into this
               state; the 2026-08-24 machine death took fourteen crews down with no `stop` anywhere
               near them. a state word that names a cause is a false report the moment the cause is
               a different one. the verb/state pair we actually want is `boot` ↔ `down`, and that
               pair is asymmetric on purpose — many roads in, one road out
- resolution = keep `down`; record `stopped` as a forbidden synonym

### dispute: idle — raised 2026-08-26 — status: RESOLVED (keep both, as distinct terms)

- raised.by  = beaver 🦫
- claim      = both describe a crew that does not move, so one word would serve
- counter    = they are not one concept. an **idle** clone holds a live duct and an empty box — it
               is at work and awaits a word. a **down** crew holds no duct at all. the two take
               opposite cures (`duct.send` versus `git.crew.boot`), and to merge them would send a
               nudge to a keyboard that does not exist
- resolution = `down` is this term; `idle` stays the property of a live duct's box, governed by
               `rule.require.nudge-parked-clones`. `idle` is a forbidden synonym OF `down`, not a
               term this cluster claims

## .the axis peers

`down` is one of three crew-axis verdicts, and the other two are not homeless:

| verdict | where it lives |
|---|---|
| `👥 at work` | `term=at-work._.choice._.md` — paved the same round, once the search below refuted my claim that it was unrendered |
| `💀 down` | **this cluster** |
| `👻 phantom` | `term=duct._.choice._.md` (a row whose session is gone) and `term=husk._.choice._.md` (its exact inversion) |

⚠️ this table first read *"`at work` — undefined, owed, but no trigger has fired."* that was written
**before** i searched for it, and a `grepsafe "at work"` over `domain.terms/` returned six
renderings across five files — among them a dedicated section in `term=grove`. same defect as the
deferral this term's own round indicts, committed in the entry that indicts it. corrected within the
hour; the sequence is on record in `progress.md` r125.

`phantom` is the one left with two homes and no cluster of its own. that is a real gap — the word is
fully defined in both files, so it is a **consolidation**, not a discovery.

## .see also

- `term=ledger._.choice._.md` — the source that makes `down` derivable, and the incident that proved it
- `term=poll._.choice._.md` — the derivation-axis rule this term sharpens
- `term=crew._.choice._.md` — the work/view axes, and why `stop` is not `hide`
- `term=fell._.choice._.md` — the terminal state `down` is not
- `term=false-report._.choice._.md` — the discriminators the ~128 rows cleared

---

written by human + beaver 🦫
