# domain.term: escalate

term.chosen   = escalate  (the noun form is `escalation`, a regular nominalization)
term.kind     = verb
term.synonyms.forbidden:
- punt
- defer
- hand off
- kick up
- bubble up
- raise
- flag
- block

## .what

to **transfer a decision to the human**, on the ground that it is not yours to render.

```
nudge      restores MOTION     — the clone was stopped, now it goes
steer      changes ROUTE       — the clone was headed at a wall
escalate   transfers a DECISION — the verdict is not yours to give
```

it is the **last resort** of a loop built to conserve the scarcest resource in it. every rule
in this repo that names it says so: *"escalation to a human is the last resort"*
(`rule.always.converge-to-terminal`, `rule.always.diagnose-reviewer-malfunctions`,
`rule.always.defer-fulcrums-to-last`).

## .every escalation has TWO halves, and only one of them is theirs

this is the distinction the word most needs, because every recorded failure lives in the gap
between them:

| half | what it claims | who can settle it |
|---|---|---|
| the **authority** | *only you may render this verdict* | genuinely the human, where true |
| the **premise** | *and here is the state that makes it necessary* | **always checkable, by you** |

an escalation is sound only when BOTH hold. the authority half is the one a rule hands you; the
premise half is the one you supply unawares, and it is the half that goes stale.

⚠️ **the premise has DEPTH.** presence, injection, and validity are three separate facts about
one credential, and a discharge must reach the END of the chain
(`term=partial-audit`, the presence-is-not-validity section).

## .the two KINDS, by what the escalation claims

| kind | it says | can you discharge it? |
|---|---|---|
| **authority-only** | *only you hold this* — a grant, a quota, an approval | ⛔ never. theirs by construction |
| **evidence-gap** | *i cannot see enough to judge* | ✅ **often** — the gap may close with a tool you already own |

the second is a candidate for discharge, **always**. to surface it un-enumerated spends the
human's attention on a gap that was yours to close.

⚠️ and the first kind is rarely pure. nearly every authority-only verb rests on a checkable
fact:

| the escalation | its authority half | its premise half |
|---|---|---|
| *"set this secret"* | only they can write it | **is it absent — and is the value LIVE?** |
| *"grant commit quota"* | only they can grant it | **is the meter actually at 0?** |
| *"fill this keyrack key"* | only they can fill it | **is it unfilled, or merely locked?** |
| *"approve this stone"* | only they can approve | ✅ genuinely pure — no checkable premise |

`--as approved` is the only row on record with naught beneath it.

## .the two AUTHORS, and the self-authored one is harder

the kinds above say what an escalation CLAIMS. this axis says who made it:

| author | why it evades a check |
|---|---|
| **relayed** — a mechanic reported it | it wears the authority half's shape while its premise is the evidence-gap's. **the act of relay converts its claim into yours** |
| **self-authored** — a rule routed you there | it is produced by a rule applied **correctly**, so it does not feel like a claim at all. it feels like a lookup |

the self-authored one is the harder case for exactly that reason, and it is the one that cost
thirty hours of dead time (see `.reason`).

## .escalate is NOT

- **`surface`** — NOT a synonym, and not forbidden. `escalate` is the **verdict** (*this is the
  human's*); `surface` is the **delivery** (*put it in front of them*). you escalate once, and
  you surface it **once per state change**
  (`rule.require.nudge-parked-clones`, `rule.forbid.self-grant-human-gates`)
- **a `steer`** — a steer names a path the clone can already walk; an escalation names one it
  cannot. ⚠️ a steer that changes what the clone may REACH is a grant, never a steer
  (`rule.forbid.self-grant-human-gates`)
- **a `nudge`** — a nudge restores motion the clone already had. an escalation moves a decision
- **a `decline`** — a decline REFUSES a request; an escalation DEFERS one. a decline is a
  verdict you render, an escalation is one you decline to render.
  ⚠️ **the boundary DECAYS** — see below
- **`--as blocked`** — TAKEN. that is the driver's route signal, with its own budget and its own
  contemplation loop. a driver reaches for it only when every reviewer is terminal
  (`rule.always.converge-to-terminal`)
- **a fulcrum halt** — a design fork is best-guessed and flagged for the END, never escalated
  mid-drive (`rule.always.defer-fulcrums-to-last`)

## ⚠️ .an UNANSWERED escalation decays into a decline

the boundary above holds **at the instant of the verdict** and not a tick longer. an escalation is
not a terminal state — it is a **wait**, and a wait accrues a cost the verdict never priced:

| | an unanswered escalation | a decline + steer |
|---|---|---|
| what it costs the clone | **every tick, without end** — it is stopped | **one turn** |
| what it costs the world | the un-run command stays un-run | the un-run command stays un-run |

read row 2 twice. **the two leave the world in the IDENTICAL state**, so an escalation nobody
answers has already become a decline — it merely became one at no party's decision, and with the
clone stopped for the whole interval.

so the verb has a half-life. a decline is what an escalation DECAYS INTO, never its opposite.

### .and the decay costs more than the wait — it suppresses the SEARCH

> **a decline does not merely unblock a clone; it makes the clone SEARCH.** an escalation invites
> it to wait, and a clone that waits does not look for a better tool.

evidenced 2026-09-01, and the escalation was correct **by the letter on every tick**: a mechanic
sat on a `pkill` modal for **two hours across six ticks**, escalated twice, unanswered. on the
sixth it was declined with a steer, and it answered in one turn — *"the pkill was too broad a
hammer; let me use the proper task-stop mechanism"*. it held a narrower, sanctioned tool the whole
time, **narrower than the steer i named**.

the two hours were not the human's slow answer. they were six ticks in which the one party who
knew that repo's own tools had no reason to think.

⇒ the operative rule lives in `howto.review-permission-requests`: where a modal has sat
byte-identical across several ticks unanswered, **re-read it (step 0, never off a memory), then
decline it with a steer.** the escalation does not vanish — it becomes an open item on the human's
list rather than a live wall in front of a clone.

## .the operator's countermeasure

do not ask *"is this the human's?"* — ask **two questions, in order**:

1. **name what the human would supply.** where you cannot name it, or where the name is
   *"permission to run this exact string"* rather than a credential, a grant, or an approval —
   the rule matched the SHAPE and not the situation, and a **steer** is owed instead
2. **read the state that act would change — to the END of the chain.** where the state is
   already what the act would produce, the escalation is discharged and the real blocker sits
   elsewhere

## .refs

- `rule.forbid.self-grant-human-gates.md` — the authoritative human-only set, and the workaround class
- `howto.review-permission-requests.md` — *"unsure is a decision, and the decision is escalate"*
- `rule.require.babysit-permission-approval.md` · `rule.require.babysit-cron-per-dispatch-fleet.md`
  — the tick's approve / steer / escalate routes
- `rule.require.nudge-parked-clones.md` — the stall-owner table that sorts a stall to its owner
- `rule.require.ask-why-the-reviewer-wont-agree.md` — a peer-review block is the DRIVER's, not a gate
- `rule.always.converge-to-terminal.md` · `rule.always.converge-with-reviewers.md` ·
  `rule.always.diagnose-reviewer-malfunctions.md` · `rule.always.defer-fulcrums-to-last.md`
  (bhrain/driver) — four rules whose shared premise is that escalation is the last resort
- `term=partial-audit._.choice._.md` — the two kinds, the relayed kind, the premise's depth, and
  the self-authored kind. **the evidence lives there**; this cluster consolidates the vocabulary

## .reason

see `term=escalate._.choice.reason.md` — etymology, the rejected `punt` / `raise` / `flag`, the
`surface` boundary, and why the evidence was cited rather than excised.

---

written by human + beaver 🦫
