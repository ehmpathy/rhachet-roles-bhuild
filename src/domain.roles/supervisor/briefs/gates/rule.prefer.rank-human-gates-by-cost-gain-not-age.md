# rule.prefer.rank-human-gates-by-cost-gain-not-age

## .what

when a tick surfaces several human-only gates across repos, rank them by **cost vs gain**
(`define.cost-gain-matrix`), never by gate age or by the mechanical cost of the unblock
command. a low-gain repo's gate is fine to leave last, even if it is the oldest in the fleet.

## .why

age is not cost, and a one-line unblock command is not the review cost. a `1.vision --as
approved` gate's command is one line; the review it asks for is sign-off on the whole proposed
scope and architecture — a cost that scales with what was proposed, never with how old the
gate is.

age is not gain, either. a stale gate on a low-value repo does not outrank a fresh gate on a
high-value one just because it aged longer.

## .the three quantities, never conflated

| quantity | what it measures | a proxy that lies about it |
|---|---|---|
| **mechanical cost** | the literal command to unblock | none — this really is cheap |
| **review cost** | the attention needed to judge what is proposed | gate age, or command length |
| **gain** | the value delivered once unblocked | gate age, or how loud the mechanic asks |

a report that reduces all three to one sort key (age) undersells what a vision review costs,
and overweights a repo that merely sat the longest.

## .how

before you rank human gates still awaited:

- read (or summarize) what each gate asks the human to approve — a vision's real scope, not
  its stone name
- estimate gain per repo — what this behavior unlocks, and how much the fleet needs it
- present the unblock command separate from the review-cost estimate; never label a thing
  "cheap" or "quick win" by merging the two
- let a low-gain repo sit last, regardless of gate age

## .examples

### 👎 bad — sorted by age, labelled cheap

> five vision gates, oldest first: "these are cheap, one-glance approvals — batch these first."

### 👍 good — cost and gain named separately

> `svc-reminders` — vision proposes X, unblock is one line, but the proposal reworks Y so
> it deserves a real read. `feat-thinker-notes-overflow` — small scope, low review cost, **and**
> low gain relative to the others — fine to leave for last.

## .enforcement

- human gates awaited, ranked by age alone with no cost/gain read = **nitpick**
- a vision-approval gate described as cheap or one-glance with no read of its content =
  **blocker** (it can talk a human into a rubber stamp on something that deserved attention)

## .see also

- `define.cost-gain-matrix.md` — the framework this rule applies
- `howto.run-a-babysit-tick.md` — the tick this governs the reporting half of
- `rule.require.report-stone-with-status.md` — the adjacent rule on what a stone report carries

---

written by human + beaver 🦫
