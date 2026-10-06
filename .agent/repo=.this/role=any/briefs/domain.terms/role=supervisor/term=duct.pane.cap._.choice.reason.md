# domain.term.choice.reason: cap

## .etymology

a **cap** is an upper bound reached — short, concrete, and already the plain-English word a human
uses for this (*"i hit my cap"*). it names the wall rather than the mechanism, which is right: the
supervisor never needs to know how the vendor meters, only that a wall is in the pane.

chosen over:

- **`quota`** — the closest rival, and rejected because this repo **already spends it**:
  `git.commit.uses` meters a commit quota, and `radio.uses` an org permission. those are grants a
  human controls. a vendor cap is not grantable by anyone here, and to share a word across a
  grantable and an ungrantable limit would invite exactly the wrong reflex — a supervisor that
  looks for a lever
- **`limit`** — the vendor's own word (`hit your limit`), and too wide. every gate in the fleet is
  a limit
- **`exhausted`** — 🔴 the dangerous one. it is **already declared at the `review` boundary** for
  a reviewer that spent its budget. worse, the two co-occur: a cap makes reviewers report
  `malfunction`, and a driver reads that as a verdict. one word over both would fuse a
  driver-owned lever (top up the budget) with a state no lever reaches
- **`throttle` / `rate-limit`** — assert a per-request pace over a window that rolls. this is an
  account-wide wall with a wall-clock reset. different mechanism, different cure

## .the incident it was coined from — 2026-09-03

**five clones sat capped across three ticks**, on one account-wide reset (`1:50pm America/Chicago`
== `6:50pm UTC`), across five separate trees.

every one was found by a **human** who asked *"what do you see on that duct?"* — one drill-in at a
time, which is precisely the byhand loop the sweep exists to retire
(`rule.require.bulk-over-byhand`). the human's words, on the second one:

> *"your crew.poll should have detected that defect automatically. i should have never had to find
> that myself."*

one of the five had gone green on types, lint, 2123 unit tests and two acceptance suites,
completed seven scoped lane re-runs at exit 0, and then **sat frozen for three hours within one
converge of done**.

### ⚠️ why the sweep could not see it

the box detector answers exactly one question: *is a permission modal up?* a capped clone has no
modal, an empty box, and its last stone intact. so it rendered `⌨️ box empty` — which reads as
*idle and fine* — and the tally counted it among the healthy.

⇒ **a poll verdict is a measurement, never a diagnosis.** `box empty` says the detector found no
modal. it does not say the clone is at work. those are different claims, and only the first was
ever made.

## .why the render says SEEN and never CAPPED

the line lives in **scrollback**. a clone resumed an hour ago still carries it, so a row that read
`CAPPED` would be a false-report the instant a resumed clone scrolled its own cap line back into
view (`term=false-report._.choice._.md`).

so the field reports one fact and the judgment is composed downstream from three. that discipline
is what `plea` later adopted wholesale, and the two now stand as peers.

## .the join is STILL OWED — recorded, not built

`duct.poll` emits the fact. **`git.crew.poll` does not yet compare the reset against now**, so a
supervisor still performs that arithmetic by eye each tick.

that is the unfinished half, and it is the half that turns a fact into an action row:

```
🔋 N capped — reset PASSED and still — resume them
```

until it exists, a cap is a row a human must read and reason about, which is one rung short of
what `rule.always.entool-the-skills-you-touch` asks for. it is filed here rather than deferred in
silence, so the next traveler finds the gap named rather than re-derives it.

⚠️ the clock read for that join must **not** come from `tmux display-message`. it was reached for
once, on 2026-09-03, purely because `tmux display-message` sat on the allowlist and `date` did
not — a tool picked by permission status rather than by job. the human, verbatim:

> *"why did you need direct tmux access? gotta forbid that too"* … *"also you should never need
> direct tmux clals"*

⇒ that also surfaced a second defect, still open: the allowlist carries `tmux display-message`,
which **contradicts `rule.forbid.direct-tmux-duct-term`**. the entry should go.

## .the cap also hides INSIDE guard output

not merely in the pane's status area. a capped clone's reviewer lanes fail, and the guard renders
them as `malfunction` — which a driver reads as a broken reviewer and starts to diagnose.

confirmed by a clone, verbatim, once resumed:

> *"The r10/r11 malfunctions were quota exhaustion, not verdicts."*

⇒ so a cap can produce a **false diagnosis** two layers away from itself, in a field whose own
sense is well understood. this is why the term's `.what` is so tightly bound to *the line in the
pane*: it is the only place the cap says its own name.

## .the peer

`plea` — same boundary, same shape, same `SEEN` discipline, coined one round later.
see `term=duct.pane.plea._.choice.reason.md`, which carries the open question of whether the two
want a shared parent term.

---

written by human + beaver 🦫
