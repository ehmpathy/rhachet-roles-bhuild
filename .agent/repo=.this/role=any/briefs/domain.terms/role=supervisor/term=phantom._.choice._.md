# domain.term: phantom

term.chosen   = phantom
term.kind     = noun
term.synonyms.forbidden:
- ghost
- zombie
- orphan
- stale row
- leftover
- residue
- husk

⚠️ **`ghost` is forbidden HERE, and canonical ONE LAYER DOWN.** `duct.box.ghost` names a dim
autocomplete suggestion inside an input box — an unrelated concept, with the opposite cure
(leave it alone). 🔴 it also shares this term's **`👻` glyph**, four lines apart in the same
`git.crew.poll` output. that collision is measured and the dispute is OPEN; read
`term=duct.box.ghost._.choice.reason.md` before you reach for either word.

## .what

a **record whose subject is gone** — a registration that survives the substance it registered.

```
the row      is THERE     ~/.ductwork/ducts/<tree>/<role>.json
the session  is GONE      tmux has-session -> no
```

it is what a teardown leaves when it removes the substance and keeps the record, and it reads
from outside exactly like a healthy registration.

## .the inversion that defines it — and `husk` is its exact mirror

| | what is there | what is absent | what clears it |
|---|---|---|---|
| **phantom** | the **record** — a registry row, a ledger entry | the **substance** — its tmux session, its tree | a **registry** act — `duct.stop`, ⚠️ `crew.fell` (**it also PRODUCES one — see below**) |
| **husk** | the **substance** — a dir full of files | the **record** — git's admin entry | a **filesystem** act — `rm -rf` |

the pair is the cheapest way to hold either, and the cures **do not cross**. to reach for the
wrong one is a no-op that reports success:

- `rm -rf` on a phantom finds naught — there was never a directory
- `worktree remove` on a husk finds naught — git never owned it

## .it lives at TWO layers, and the verdicts differ

one word, two instruments, because a record can outlive its subject at either layer:

| layer | what is gone | the instrument | the verdict |
|---|---|---|---|
| **duct** | the tmux session | `duct.poll` | `💥 malfunction` |
| **crew** | the tree itself | `git.crew.poll` | `👻 phantom` |

⚠️ **only the crew layer NAMES it.** at the duct layer a phantom renders as `💥 malfunction`,
which is the same verdict a genuinely broken read produces — so the duct layer cannot part *"this
row is litter"* from *"this duct is broken"*, and a supervisor must not read `💥` as either
without a second source (`term=false-report`).

## .a phantom is NOT

- **a `husk`** — its exact mirror. see the table above; the cures are opposite
- **`down`** — a down crew has **no duct and a tree on disk**, so `crew.boot` recovers it. a
  phantom has no tree, so there is nowhere to boot. `down` is an action row; a phantom is litter
- **a duplicate** — two rows for ONE live session. the substance is present and over-registered;
  a phantom's substance is absent (`term=duct`)
- **a malfunction** — a malfunction is a claim about an INSTRUMENT that could not run. a phantom
  is a claim about a SUBJECT that no longer exists. they collide at the duct layer by accident of
  render, never by sense
- ⚠️ **UNREACHABLE** — the boundary that costs the most, because it reads as the closest fit. a
  hibernated grove is **present and asleep**; a destroyed one is gone; a network fault is neither.
  all three render as one exit code with no cause named, so the operator's test below —
  *"does the subject still exist?"* — is **unanswerable**, and a test you cannot answer is not a
  test you may answer in your own favor. reach for `phantom` only where a **second source** says
  the subject is gone

  evidenced 2026-09-02, and it was mine. `duct.read --on 'duct://grove-ahbode-v20260901/main/mechanic'`
  exited 255 with an empty error, and i reported it as *"`term=phantom` at the grove layer — the
  record is present, the substance is unreachable."* that sentence names the right SYMPTOM and the
  wrong TERM: unreachable is what i measured; **gone** is what `phantom` asserts

  ✅ **the gap this section opened is PARTLY filled** — `term=asleep`, paved 2026-09-03. the state
  has its own verdict (`😴 asleep`), its own row, and a cure on the machine that owes it
  (`rhx git.grove.wake`). so a reader who meets an unreachable grove is sent the right way.

  🔴 **but the claim that "the instrument routes it for them" is too strong, and it was mine.**
  see the next section: it holds for a grove that EXISTS and cannot be reached, and fails for
  one that no longer exists at all.

## 🔴 .a THIRD layer — a RETIRED grove, and the poll calls its phantoms `asleep`

**2026-09-07.** a babysit tick met this header:

```
├─ ⚠️  UNREACHED: grove-ahbode-v20260810 grove-ahbode-v20260810.ground
│   └─ crews there render 😴 asleep — unread, NOT down — rhx git.grove.wake <grove>
```

the prescribed cure was run verbatim and refused — `grove 'grove-ahbode-v20260810' is not
registered` — and `git.grove.list` holds `v20260811` and `v20260901` only. **the grove is
retired.** its crew ledger rows point at a machine that is not in the forest.

⇒ record present, substance gone. **that is this term, at a third layer:**

| layer | what is gone | what the instrument says |
|---|---|---|
| **duct** | the tmux session | `💥 malfunction` |
| **crew** | the tree itself | `👻 phantom` |
| 🔴 **grove** | the **box**, and every tree on its disk | **`😴 asleep`** — recoverable, which is false |

⚠️ **this is the EXACT INVERSE of the 2026-09-02 error recorded above.** then, a reader measured
*unreachable* and asserted *gone*. now, an instrument measures *gone* and asserts *reachable*.
the same boundary, crossed from the other side — and the second is worse, because a reader can
be argued out of their own guess and cannot be argued out of a published verdict.

### ✅ the second source this term has wanted since 2026-09-02 is NAMED, and it is free

the caution above says *"reach for `phantom` only where a **second source** says the subject is
gone"* and never says what that source could be. at the grove layer it is one local file read:

> **is the grove in `git.grove.list`?** no ssh, no tunnel, no latency, no ambiguity.

| the grove | the crews are |
|---|---|
| registered, unreachable | 😴 **asleep** — the work stands. `git.grove.wake` |
| ⛔ **not registered** | 👻 **phantom** — the work is gone. the rows are litter |

⇒ so the unanswerable test — *"does the subject still exist?"* — **is answerable at the grove
layer**, and the poll does not run it. `__crew_host_unreached` collects hosts it could not reach
and never asks whether they are hosts at all.

### ⚠️ no new word is owed — and the tick that found it guessed otherwise

the supervisor's first read proposed a fresh label (`👻 RETIRED`) on the grounds that `phantom`
*"names a TREE-level fact."* 🔴 **that is refuted by this file's own `.it lives at TWO layers`
table** — `phantom` was already multi-layer by construction, and a third layer is the same
inversion at a coarser grain, never a new concept.

⇒ the durable lesson is the one `rule.always.reuse-pavement-before-improvise` states: the term
was adequate, and the gap was in the **instrument**, not the vocabulary. a render label may still
be owed so a human can see WHY those rows are litter; that is a render question, and it does not
reach the word.

⚠️ **the arrear is not merely a mis-label.** a retired grove's rows sit inside the `36 crew(s)`
denominator and the `😴 unread` tally, so every ratio a supervisor reads is diluted by crews that
can never answer (`term=partial-audit`, and `term=false-report` reader-inference family).
recorded at `.dream/2026_09_07.poll-prescribes-wake-for-a-decommissioned-grove.dream.md`.

## .the operator's read

a phantom is **litter, not an incident.** it costs naught but noise — and the noise is the whole
hazard, because a poll dominated by phantoms is a poll whose real verdicts are hard to find.

so the test is one question: **does the subject still exist?**

| the answer | the row is |
|---|---|
| the session answers / the tree stands | a live registration |
| neither answers, and a `fell` explains it | a **phantom** — clear it |
| neither answers, and no `fell` explains it | ⛔ do not clear. read a third source first |

the last row carries the weight. a phantom and a **crew whose grove went down** render alike, and
one is litter while the other holds work. `rule.require.verify-after-send`'s discipline applies:
verify the subject is gone before you drop the record that says it existed.

## 🔴 .the CURE this term names is the verb that PRODUCED one — measured 2026-09-05

a merged tree was torn down by the paved sequence, and every step reported success:

```
git tree del <branch>   ->  🍂 status: removed
crew.stop               ->  both ducts stopped
crew.fell               ->  📒 ledger: row dropped — the crew is off the books
                            🦫 timber! — tree, branch, ducts, tabs, and record 🌊
```

then the next poll read **`👻 3 phantom`**, up from 2, and `--all` named the third:
`rhachet-brains-anthropic.beav.feat-frontier-claude-models — 👻 crew: phantom`.

⚠️ **the ledger row really was dropped** — `git.crew.ledger` no longer lists it. so the fell's
report is TRUE of the ledger and the summary line `record 🌊` invites the inference that EVERY
record is gone. the poll derives from `crew ledger ∪ duct registry ∪ live tmux`, and one of the
other two still holds the row. (`term=false-report`, reader-inference family, cause `scope`: the
instrument named the record it cleared and let a plural stand for the union.)

### what this does and does NOT overturn

- ✅ **the poll's own gloss already said so** — *"felled trees whose registry rows remain"* — and
  so does `.the operator's read` above: *"neither answers, and a fell explains it → a phantom."*
  a fell PRODUCING a phantom is the documented, expected outcome
- 🔴 **the inversion table's cure column is what fails.** it names `crew.fell` as the registry act
  that CLEARS a phantom. a supervisor who reads that table and reaches for `crew.fell` reaches for
  the verb that just made one
- ⚠️ **untested, and do NOT assume it:** whether a SECOND `crew.fell` on an already-phantom crew
  clears the residual row. it may be idempotent and finish the job, or report the same success
  over a row it cannot see. one measurement settles this; it has not been run

### 🔴 a SECOND candidate cause, found 2026-09-05 — and it inverts the blame

the section above asserts that `crew.fell` produced the phantom. **a defect found later the same
day offers a different account of the same measurement, and it is at least as good:**

`crew.stop` hardcoded `grove="local"` (`crewwork.sh:1504`) and never derived from the ledger — so
a stop aimed at a GROVE crew read localhost, found no ducts of that name, and the teardown's own
`|| true` (`crewwork.sh:1590`) swallowed the miss. the verb then printed `🦫 lodge closed` while
the grove's ducts stayed live.

⇒ on that account the sequence reads:

| the step | what it reported | what it did |
|---|---|---|
| `crew.stop` | both ducts stopped | 🔴 **naught — it read the wrong box** |
| `crew.fell` | ledger row dropped | dropped the row, correctly |
| the next poll | `👻 3 phantom` | the LIVE ducts, minus their ledger row |

**so the fell did not PRODUCE the phantom. it REVEALED one the stop had already made.**

⚠️ **two candidate causes, one measurement. do NOT collapse them.** what parts them is a single
read — were that tree's ducts still LIVE between the stop and the fell? that read was available
at the time, was not taken, and is no longer available.

⇒ the cures diverge, which is what makes the ambiguity expensive rather than academic:

- **if the stop bug** — repaired 2026-09-05 (`crew.stop` and `crew.boot` both derive now), so
  future teardowns leave no phantom, and the `crew.sweep` arrear covers only the extant litter
- **if the fell** — the arrear stands in full, and the paved teardown mints a fresh phantom every
  time it runs

the next grove teardown settles it, at the cost of one `crew.read` between the two steps.

### 🔴 and the poll names NO cure on that line

every other verdict line carries its remedy, and this one does not:

```
├─ 💀 12 down       — rhx git.crew.boot --tree <tree>
└─ 👻 3 phantom    — felled trees whose registry rows remain
```

⇒ **the one row a supervisor is told is harmless is the one row with no lever offered** — so
phantoms accrete, and `.the operator's read` above is precisely right that *"a poll dominated by
phantoms is a poll whose real verdicts are hard to find."* the arrear is a `git.crew.sweep`, or a
`--phantoms` flag on `crew.fell` that takes the tree it can no longer derive.

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `git.crew.poll.sh` — the `👻 phantom` verdict, and the only instrument that names it
- `duct.poll.sh` — where a phantom renders as `💥 malfunction`
- `duct.stop.sh` · `duct.send.sh` · `work/ductwork.sh` — the registry acts that clear one
- `work/crewwork.sh` · `git.crew.fell.sh` — the crew-layer clear

leaned on, undefined until now, at:

- `term=duct._.choice._.md` — *"a phantom = a row whose session is gone"*
- `term=husk._.choice._.md` — the inversion table this cluster inherits
- `term=crew._.choice._.md` — the three-state table, which flagged *"no cluster of its own"*
- `term=down._.choice._.md` — the boundary against the recoverable state
- `rule.require.speak-at-the-supervisor-layer.md` — *"a felled tree left a phantom crew"*

## .reason

see `term=phantom._.choice.reason.md` — etymology, the rejected `ghost` and `zombie`, why it was
deferred for fifteen rounds, and the evidence.

---

written by human + beaver 🦫
