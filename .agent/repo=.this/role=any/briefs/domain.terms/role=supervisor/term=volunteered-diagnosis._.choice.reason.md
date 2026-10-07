# domain.term.choice.reason: volunteered diagnosis

## .etymology

`diagnosis` was already the repo's word before this file. `rule.require.nudge-parked-clones`
states the distinction outright:

> **a poll verdict is a MEASUREMENT, not a diagnosis.**

so this term coins no fresh noun for the concept — it reuses the pair that rule already put in
circulation, which is what `rule.require.ubiqlang` asks for. the compound simply names the case
that rule does not cover: where the INSTRUMENT, rather than the reader, fuses the two.

`volunteered` names the defect precisely and needs no gloss. nobody asked `duct.poll` **why** the
input waits. it answered anyway, and answered in the same voice it uses for what it measured.

## .the discovery — an inference i obeyed for three polls

on 2026-08-10 `camp-grove/foreman-4` held `📬 QUEUED` across three consecutive polls, ~30 minutes.
i left it alone each time. my reason, had anyone asked, was the tool's own sentence:

```
📬 QUEUED — input waits; mechanic busy, will consume it
```

what makes it a term rather than a note is where that sentence had already traveled. **the cron
prompt repeats it as policy**, in the human's own text:

> `📬 QUEUED` -> leave it; the mechanic is busy and will consume it.

so the chain ran: **the tool's string → a sweep rule → my behavior.** at no point did any party
mark that the second clause was reasoned rather than observed. it entered a rule with a
measurement's authority and governed three ticks of my conduct from there.

when i finally read the pane raw, the queued text was `ESC[38;5;231m` — bright white, normal
intensity — so it was PREFILLED, the human's own words, unsent. and the clone's stone read
`🗿 5.3.verification, yield, blocked ✋`.

**i still do not know whether the diagnosis was false.** a blocked stone is a route state, not a
live claim that no turn is in flight. that unresolved status is the point: after 30 minutes and a
raw read, the tool's second clause remains unverifiable from where i stand — while its first
clause was settled in one glance.

### ✅ RESOLVED one round later — and it was TRUE

~45 minutes after the first observation, `foreman-4` read `box empty`. the queue drained. so the
tool's *"mechanic busy, will consume it"* was **correct**, and my three ticks of restraint were
the right act for the wrong reason.

**that outcome CONFIRMS this term rather than refutes it**, and the say file says so in advance:

> a volunteered diagnosis may be entirely correct and still be one, because the defect is that its
> status is unmarked.

this is the property that most sharply parts it from `false report`. there, the content is wrong,
so a correct outcome would have refuted the case. here the content was right and the defect is
untouched: for 45 minutes i could not tell an observed clause from a reasoned one, and i would not
have been able to tell had it been wrong. **a term whose instances are usually correct is exactly
the term an operator most needs**, because the wrong ones look identical and arrive with no tell
at all.

the honest cost, stated plainly: this instance cost naught. instance 2 costs a resize every 15
minutes. the term is earned by the second and illustrated by the first.

## .the second instance, and why it is the sharper one

`duct.poll` also prints:

```
⌨️  no input box (not a claude session)
```

same shape: a measurement (no input box matched) plus an unmarked diagnosis (*because this is not
a claude session*). and **this diagnosis is provably wrong in the common case** — a narrow pane
breaks the detector, so a live claude mechanic renders exactly that line.

the proof is not mine. it is in the cron prompt, written by the human:

> a narrow pane BREAKS the poll's detectors — a live claude mechanic false-reports as
> `no input box (not a claude session)`.

two things follow, and both matter.

**first**, the whole per-tick resize workaround — the mandated first act of every sweep — exists
to dodge this one line. that is a real, repeated, measured cost, paid every 15 minutes.

**second**, the human's phrase *"false-reports as"* is a loose use of the extant term, and the
looseness is instructive rather than a fault. run `false report`'s discriminators on it:

| | verdict |
|---|---|
| d1 — did the tool fail? | no |
| d2 — is the content untrue? | **half** — the measurement is arguably true of a narrow pane; the parenthetical is false |

`false report` has no room for *half*. a case that is true in one clause and false in the next
needs a word that names the fusion, which is exactly the gap this term fills.

## .the discriminators, run BEFORE the pave

per the r50 discipline, every extant neighbor was tested first and each refused it.

### against `false report`

| | |
|---|---|
| d1 — did the tool fail? | **no.** `duct.poll` ran clean |
| d2 — is the content untrue? | **unproven** on instance 1; **half** on instance 2 |

instance 1 does not clear d2 at all, and instance 2 clears it only in part. so `false report`
refuses both — correctly. the terms are peers, not parent and child.

### against `partial audit`

no subject set was narrowed. the tool read the pane it was asked to read, in full. refused.

### against `substituted criterion`

no standard set by another party was replaced. refused.

### against camp-grove's `assertion-wider-than-its-claim`

the closest external neighbor, and the boundary is clean:

| | assertion-wider-than-its-claim | volunteered diagnosis |
|---|---|---|
| the act | an ENFORCEMENT that gates | a REPORT that describes |
| what over-reaches | the assertion a gate imposes | the status of a clause in a line |
| the cost | a gate permits or blocks on unverified ground | a reader banks a guess as a fact |
| the cure | verify the limit, or do not gate | split the line; act on the measured half only |

both are over-reach, so they are family. they differ in the act (write vs read) and in the cure,
so they are distinct members. **the word stays theirs** — this file cites it and annexes naught,
per the jurisdiction discipline r52 set and r70 upheld.

## .why not the rejected names

- **`asserted cause`** — collides with camp-grove's `assertion-wider-than-its-claim`, which is a
  genuine neighbor; two assert-words for two related-but-distinct defects is the drift
  `rule.forbid.domain-term-synonyms` guards. and `cause` misses half the evidence: *"will consume
  it"* is a PREDICTION, not a cause. `diagnosis` covers both
- **`stapled inference`** — the mechanism is right and the word implies the attachment is
  temporary. it is not; it ships in the tool's format string
- **`fused verdict`** — `verdict` is taken twice over (poll verdicts, peer-review verdicts). the
  overload `rule.require.ubiqlang` forbids
- **`editorial gloss`** — `gloss` is in live use in `def.domain-discovery` (*"recognizes it with
  no gloss"*), same sense. to make the same word a defect noun overloads it
- **`helpful hint`** — the fatal one. `rule.require.errors-name-the-fix` DEMANDS hints and grades
  their absence a blocker. a name that makes hints sound suspect would fight a rule we want kept

that last rejection matters most, because the boundary is easy to lose: **a hint is a
prescription, offered as one. a volunteered diagnosis is a description, offered as a fact.** the
first is required; the second is unmarked.

## .the restraint bar

84 rounds preceded this one, and most paved zero. the bar: a term must be **compelled** by
evidence, never manufactured to satisfy an hourly hook. tested:

- **a new kind?** yes — three extant terms and one external neighbor each refuse it, on stated
  discriminators, and its cure differs from every one of them
- **evidenced?** two instances, same instrument, one with an independent proof written by the human
- **a victim?** two — three ticks of my own conduct, and a resize workaround the whole fleet pays
  every 15 minutes
- **ours?** yes. `duct.poll` is declared at `.agent/repo=.this/role=any/skills/duct.poll.sh`
- **would it be re-derived?** it already was, in part: the human documented instance 2's falsity in
  the cron prompt without a word for the shape, and reached for `false report` — which refuses it

it cleared every line. the rounds that declined on jurisdiction alone are what make this
acceptance credible.

## .what this does NOT license

a rewrite of `duct.poll`. the repair is a real design question — mark the seam (`observed:` /
`inferred:`), drop the diagnosis, or keep it and label it — and it belongs to the layer that owns
the skill, not to a glossary round. **recorded, not repaired.**

and the diagnoses may well be worth the keep. an unmarked one costs a reader their ground; a
marked one costs a few characters and saves a round trip. the defect is the absent marker, never
the help.

## .see also

- `term=volunteered-diagnosis._.choice._.md` — the choice itself
- `term=false-report._.choice.reason.md` — the neighbor; its reader-inference cure fails here
- `rule.require.nudge-parked-clones` — the measurement/diagnosis pair this reuses
- `rule.require.errors-name-the-fix` (ergonomist) — why a marked prescription is required

---

written by human + beaver 🦫
