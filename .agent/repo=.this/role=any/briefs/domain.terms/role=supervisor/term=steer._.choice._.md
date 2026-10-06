# domain.term: steer

term.chosen   = steer
term.kind     = verb  (the noun form — *a steer* — is the same word, per `poll`'s precedent)
term.synonyms.forbidden:
- nudge
- redirect
- correct
- guide
- hint
- advise
- unblock
- override

## .what

to hand a stalled or misrouted clone **a concrete compliant path it did not see**, in one
message, and then leave the choice to it.

a steer carries two parts, and **both are required**:

| part | what it is |
|---|---|
| the **refusal** | what will not work, or what is off its allowlist, or why its ask is misrouted |
| the **path** | a named, sanctioned move that reaches the same outcome |

a refusal with no path is a **decline**. a path with no refusal is a **nudge**. only the two
together are a steer.

## .the boundary against `nudge` — the one that matters

both are a single message into a parked clone's keyboard, so they are easy to conflate. they
differ in what they change:

| | what it changes | example |
|---|---|---|
| **nudge** | the clone's **motion** — it was stopped, now it goes | dismiss a survey; *"release into prod"*; a continue prompt after a quota reset |
| **steer** | the clone's **route** — it was headed somewhere that will not work | *"`git checkout -b` is off your allowlist; rebase in place instead"* |

a nudged clone resumes the plan it already had. a steered clone takes a different one.

`rule.require.nudge-parked-clones` governs the first. this term governs the second, and the
two rules do not overlap.

## .the three live senses

| # | sense | where | 🔴 2026-09-08 |
|---|---|---|---|
| 1 | a **payload** attached to a decline | `howto.review-permission-requests` — `"steer": null`, *required whenever `verdict` is `decline`* | ✅ **survives** |
| 2 | a **peer action** alongside deny | `rule.require.pause-babysit-cron-after-idle-streak` — *approve / deny / **steer** / submit / release / send* | ✅ **survives** |
| 3 | a **standalone redirect** — a refusal of a HALT, never of a request | evidenced 2026-08-15 and 2026-08-31; no rule covers it | 🔴 **FORBIDDEN** |

### 🔴 .the wisher's 2026-09-08 verdict cut this table along its own seam

> *"honestly, you should never need to talk to them"*
> *"you should only ever at most need to approve | reject their permission requests"*

read that against the senses above and it is **not** a ban on the word. senses 1 and 2 live
**inside** a reject — a decline is the verdict, and the steer is the reason it carries. that is
exactly *"reject their permission request"*, so both stand unharmed.

🔴 **sense 3 is the one it forbids**, and precisely because sense 3 is the only one with **no
request to answer.** it is a message the supervisor originates, so it is *talking to them*.

⇒ the discriminator is now sharp, and it is a question about the CLONE, never about the message:

> **did the clone ask for something?**
> asked → a steer may ride the answer. **did not ask → send no message at all.**

⚠️ **and the three senses were flagged as a possible defect for weeks** — *"senses 1 and 2
disagree… sense 3 is neither."* the ruling settles it in the opposite direction to the suspicion:
the disagreement between 1 and 2 was never the fault line. **the fault line was 1+2 against 3**,
and it took an outside verdict to see it. an enumeration can be complete and still be grouped
wrong.

⇒ governed by `rule.forbid.steer-a-clone-beyond-a-permission-key`.

⚠️ sense 3 read *"of a clone with no unresolved request"* until 2026-08-31, when its second
instance broke that clause: the clone HAD an unresolved request — a wisher scope question,
genuinely the human's — and a steer was owed anyway. **the ask and the halt are two things**;
sense 3 refuses the halt and leaves the ask alone. see `.reason`.

senses 1 and 2 disagree — one makes it a payload, the other a verdict. sense 3 is neither.
the resolution, and why the disagreement is not a defect, is in `.reason`.

## .a steer is NOT

- **an override** — it is advisory. the clone may reject it and say why, and often should
- **a correction** — the clone's diagnosis is frequently right; only its ROUTE was blocked
- **a grant** — a steer names a path the clone can already walk. a path it cannot walk without
  a human is an **escalation** (`rule.forbid.self-grant-human-gates`)

## .refs

- `howto.review-permission-requests.md` — the verdict contract's `steer` field, and
  *"prefer a steer over a bare decline"*
- `rule.require.pause-babysit-cron-after-idle-streak.md` — one of six actions that reset the streak
- `rule.require.babysit-permission-approval.md` — *"when unsafe — prefer steer over deny"*
- `rule.require.babysit-cron-per-dispatch-fleet.md` — the tick contract's *approve/steer/escalate*
- `rule.require.distinguish-prefilled-from-suggested.md` — *"when a dispatchee needs a steer,
  decide what it needs and say that, in your own words"*

## .reason

see `term=steer._.choice.reason.md` — etymology, the three-sense split, the rejected synonyms,
and the evidence.

---

written by human + beaver 🦫
