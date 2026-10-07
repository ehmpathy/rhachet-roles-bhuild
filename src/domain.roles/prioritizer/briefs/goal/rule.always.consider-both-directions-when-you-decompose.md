# rule.always.consider-both-directions-when-you-decompose

## .what

every time you decompose a goal that CHANGES A NUMBER, consider BOTH directions — 🔬 from-bot and
🗼 from-top (`define.decomposition.from-bot-and-from-top`) — and say what you found, out loud, in
the same turn. both, or a stated reason why one does not apply. never one by default, the other
by accident.

## .when it fires

| the act | why |
|---|---|
| a decomposition — one row becomes children | the sharpest moment; the split written is the split inherited |
| a goal whose name holds a number — conversion, latency, cost, spend, retention | the number IS the measurable present state |
| a `--what` that says tune, raise, cut, improve, reduce | each verb names a delta on a measurable quantity |
| you mint a row and reach for one obvious child | stop — which direction is that? what is the other? |
| a human hands you one direction | take it, and name the other, even to rule it out |
| you would write "first we measure, then decide" | that phrase IS the serialization — rarely a real gate |

## .why ALWAYS, not REQUIRE

no part of the store goes wrong when this is skipped — the row grades right, no query returns a
defect. the loss is a limit nobody sees: a goal decomposed from-bot alone converges on whatever
the extant structure affords and stops, with no signal a limit was hit; from-top alone ships a
hypothesis that cannot be graded. neither failure has a column to catch it — the only evidence
the consideration ran is that the turn said so. the moment also matters: at decomposition time
you already hold the goal, its parent, its peers, its measurement; a later sweep pays to reload
all of it.

## .what the turn owes

one line per decomposition that states what the two directions returned:

```
"both minted — from-bot instruments the flow in repo A, from-top declares the offer
 structure in repo B. parallel, no gate: the instrument grades a from-top change, it
 does not start one"

"from-top only — the flow does not exist yet, naught to measure"

"from-bot only for now — fundamentals are settled and written down in <brief>"
```

a considered-and-declined direction is still a finding and must be stated — silence reads the
same as a consideration that never ran.

## .the test

"does this goal have a measurable present state AND a declarable ideal?"

- both → mint both halves, default parallel
- no measurable state → from-top alone, say why
- no declarable ideal → from-bot alone, say why
- neither → not a change-a-number goal, rule does not apply

## .bound

mandates consideration, never a mechanical split. a both-halves split on a goal with only one
real direction mints a container and a peer that holds naught — pure ceremony. to consider is
mandatory; to split is a judgment, and the judgment belongs in the `--why`. a hunt over the goal
you touched, never a re-walk of the whole store.

## .enforcement

- a change-a-number goal decomposed with no direction stated = **blocker**
- a decomposition into one direction, no reason the other doesn't apply = **blocker**
- a gate between the two halves with no OUTPUT dependency named = **blocker**
- a direction considered and declined, stated in one line = ✅ correct, the common case
- a mechanical both-halves split where only one direction is real = **nitpick**
- a decomposition that stalls into a full-store re-walk = **nitpick**

## .see also

- `define.decomposition.from-bot-and-from-top.md` — the concept
- `rule.always.hunt-the-serialization-when-you-rank.md` — the peer mandate, fired by the same act
- `howto.find-the-serialization-a-rank-hides.md` — the method; why children default to parallel
- `define.eco.decomposition-vs-orchestration.md` — when a fold should become children at all
- `rule.forbid.fabricated-opines.md` — a new half needs a human-authored grade
- `rule.always.prioritize-never-supervise.md` — the consideration ends at a seed

---

written by human + beaver 🦫
