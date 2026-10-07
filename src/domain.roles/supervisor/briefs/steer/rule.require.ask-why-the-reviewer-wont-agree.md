# rule.require.ask-why-the-reviewer-wont-agree

## .what

when a tree reads **blocked** or **exhausted** at a peer-review level —
`review.peer, l3@i015, blocked ✋` — the supervisor's FIRST move is to send the
mechanic one question:

> **"why can't you get l3 to agree with you?"**

do NOT open by a report of it to the human as a gate. ask first; surface only after
the answer proves it is genuinely the human's.

## .why

a peer review is a conversation, not a verdict. `rule.always.converge-with-reviewers`
hands the driver a `.given`/`.taken` loop precisely so it can fix the code or marshal
the evidence its choice holds, then re-arrive. a tree parked at l3 has usually
stopped that conversation, not exhausted it.

`rule.always.converge-to-terminal` demands a cited record of what was tried each
round plus a note on what would fix the reviewer — a mechanic that cannot answer
"why won't l3 agree" has not earned its exhaustion; it coasted to the bottom.

so a peer-review block is the driver's work by default. to surface it as a human
gate spends the scarcest resource in the loop on a job the driver still owns.

## the question sorts the case

| the answer | the move | whose |
|---|---|---|
| a concrete disagreement not yet answered | converge — fix, or articulate why it holds, then re-arrive | driver |
| out of review budget, at any iteration | no top-up, ever — converge, or let it stand terminal WITH a record of what was tried (`rule.forbid.budget-top-ups`) | driver |
| the reviewer errored, could not run, or read an empty scope | diagnose per `rule.always.diagnose-reviewer-malfunctions` | driver |
| a stale cached verdict, blocked on an issue already fixed | re-run | driver |
| genuinely insatiable AND the cited record is written | now, and only now, surface it | human |

four of five rows are levers the driver already holds — that is why the question
comes first. review budget is the route's own declaration; no party at the keyboard
re-opens it by reflex. a human may still grant one deliberately, with the route in
view — that is a decision on record, never a lever this table routes to.

## the i015 bound — l3 budget is not unbounded

> never grant review budget to l3 past 15 iterations. beyond that, it is churn.

| at l3 | budget is | because |
|---|---|---|
| `i001`–`i015` | the driver's, freely | the `.given`/`.taken` loop still produces work |
| past `i015` | refused | more rounds buy churn, never convergence |

the tell: the iteration count rises while the ARGUMENT does not. a loop that nears
agreement narrows — fewer blockers, or sharper evidence on the same one. a churn
loop re-litigates, and its iteration number is the only thing that moves.

past the bound, sort by what the loop actually needs:

- the reviewer is genuinely insatiable → now the human's: `--as overruled`, the only
  lever that ends a review loop. surface it WITH the cited record
- the scope is too wide to ever satisfy → a wisher scope decision, not a review problem
- the reviewer is broken → `rule.always.diagnose-reviewer-malfunctions`; a
  malfunction never needed budget in the first place

tell the mechanic the bound out loud — it may be under
`rule.always.spend-own-levers-before-escalation` ("budget is not scarce"), which
holds under the bound and not above it.

## the one exception

do not interject while a human is mid-exchange at that mechanic's keyboard — a
question sent into a live conversation collides and costs a turn. wait for the box
to go quiet, then ask.

## .enforcement

- a peer-review `blocked`/`exhausted` state surfaced to the human as a gate, with no
  prior ask = **blocker**
- review budget added by a bot, or a clone steered toward it, at ANY iteration =
  **blocker** (`rule.forbid.budget-top-ups`)
- an `exhausted` level accepted with no cited record of the attempts = **blocker**

## .see also

- `rule.always.converge-with-reviewers` (bhrain/driver) — the `.taken` loop this question restarts
- `rule.always.converge-to-terminal` (bhrain/driver) — earned vs manufactured exhaustion
- `rule.always.diagnose-reviewer-malfunctions` (bhrain/driver) — the branch for a broken reviewer
- `rule.forbid.self-grant-human-gates` — what IS human-only, and why review budget is not

---

written by human + beaver 🦫
