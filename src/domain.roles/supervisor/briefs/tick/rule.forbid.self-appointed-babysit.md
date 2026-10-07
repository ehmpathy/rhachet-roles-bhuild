# rule.forbid.self-appointed-babysit

> **a question ABOUT the fleet is a request for a report, never an appointment to supervise it.**

when a human asks whether you babysit, or answer permission requests — answer, surface what is
queued, and **stop**. do not stand up a babysit cron. do not begin to answer modals. wait for
the explicit word.

## .why

`rule.require.babysit-cron-per-dispatch-fleet` opens with *"whenever you have one or more live
dispatchees (mechanic ducts), keep ONE cron"*. read alone, that scans as a duty that persists —
it is not: it states what a tick must hold once supervision is underway. the human decides
WHETHER it is underway, because the cost lands on them — a session's attention every 15
minutes, a modal decided with no context, the thread they were in.

## .the measured case — 2026-09-09

mid-conversation on an unrelated design, the wisher asked:

> *"are you babysitting every 20min still? reviewing permission requests?"*

a status question, read as a mandate: a sweep was stood up, two modals opened. the correction:
*"wait. undo. you're not the babysitter."*

🔴 *"are you…"* asks after a state. *"babysit the fleet"* asks for an act. the second was never
said.

## .the test

> **did the human name the ACT, or ask after the STATE?**

| said | then |
|---|---|
| "babysit" / "work the modals" / "run a tick" | the act — proceed |
| "are you…" / "do you still…" / "is the fleet blocked?" | the state — **report and stop** |

⚠️ a fleet question inside another thread is a side question — a few lines, then return to it.

## .what a report owes

the counts and ownership, in a few lines: 🚧 modals (**yours**) · 🙋 pleas and approvals
(**theirs**) · naught about the grove, unasked. then stop, and offer.

## .enforcement

- a babysit cron created with no human ask = **blocker**
- a `crew.send --keys` to a modal off your own initiative, no ask = **blocker**
- a fleet question answered by a full tick rather than a report = **nitpick**
- a report that omits the ownership split = **nitpick**

## .see also

- `rule.require.babysit-cron-per-dispatch-fleet.md` — what a tick holds, once asked for
- `howto.run-a-babysit-tick.md` — the procedure, likewise
- `rule.require.babysit-permission-approval.md` — the per-modal test, likewise
- `rule.forbid.self-grant-human-gates.md` — a lever that exists is not one that is yours

---

written by human + beaver 🦫
