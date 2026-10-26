# rule.always.hunt-the-serialization-when-you-rank

## .what

every time you rank a goal, hunt the neighborhood for work that runs in SERIES and could run in
PARALLEL — and say what you found, out loud, in the same turn.

a rank is a verdict about order. the moment you set one is the moment to ask whether that order
is real. the method is `howto.find-the-serialization-a-rank-hides`; this says when it fires, and
what the turn owes.

## .when it fires

| the act | why |
|---|---|
| `eco.priority set` on a new row | you just chose its place; peers are in view exactly once |
| a re-grade — sev, urg, or sponsorship moved | the row's position against its peers changed |
| a decomposition — one row becomes children | the sharpest moment; children default to a chain unless you say otherwise |
| a gate edge set or struck | an edge IS the serialization |
| a human asks "can these run together?" | the answer is usually already in the store |
| a seed is dispatched | un-seeded peers are the invisible serializer, cheapest to spot now |
| you'd say "and then we do X" | that phrase IS a serialization — is it real? |

## .why ALWAYS, not REQUIRE

no part of the store goes wrong when this is skipped — every row stays graded right, no query
returns a defect. the loss is wall-clock, and no column holds it. so there is no artifact to
inspect after the fact — the only evidence a hunt happened is that the turn said so. the moment
matters too: a rank is when the whole neighborhood is already loaded; a sweep run later pays to
reload all of it.

## .what the turn owes

one sentence per rank, that states what the hunt returned:

```
"the three peers are already parallel — none gated, all three seeded"
"found one: X sits at the same grade as its peer and was never dispatched. seeded,
 so both now run concurrently"
"the fold stays for now — nine rows, but the grove is at cap"
```

a clean hunt is still a finding and must be stated — silence is indistinguishable from a hunt
that never ran. a serialization spotted and left uncured is not a pass to stay quiet either: name
it and say what holds it (an absent grade, a full grove, a human decision) — that turns an
invisible loss into a queued one.

## .the cues

| when… | then… |
|---|---|
| you finish an `eco.priority set` and move on | stop — what did the hunt return? |
| you write a `--gated-by` | state whether it's an OUTPUT dependency or a preference |
| you split a row into children | default them to PARALLEL; a chain needs a reason per edge |
| a fan-out's children all get the same sev | was a measurement available? that's the defect the howto names |
| a human asks about order between two slugs | check the store first — often already parallel |
| you catch "once X lands, then Y" take shape | that's a gate edge said in prose — write it as an edge, or strike it |
| the hunt returns clean, three ranks straight | suspicious — did you check only `gatedBy`? two of three serializers aren't edges |

## .the test

"is any of the order I just wrote — or left in place — a preference rather than a dependency?"
can name the OUTPUT each edge waits on → real, say so. cannot, for some edge → it costs a peer's
full duration to hold — strike it, or record why you keep it.

## .bound

a hunt, never a sweep — fires on the neighborhood of the row touched, not a re-walk of the whole
store. and a find is not automatically a fan-out: the grove is concurrency-capped, and N
parallel rows is N crews, N PRs, N rebases. to find is mandatory; to act is a judgment, and the
judgment belongs in the `--why`.

## .enforcement

- a rank set or moved with no hunt stated = **blocker**
- a decomposition whose children default to a chain, no reason per edge = **blocker**
- a serialization found and left unstated because it could not be cured = **blocker**
- a hunt that checks `gatedBy` alone and reports clean = **blocker**
- a gate edge kept for context, reason left out of the `--why` = **nitpick**
- a rank that stalls into a full-store audit = **nitpick**
- a clean hunt, stated in one line = ✅ correct, the common case

## .see also

- `howto.find-the-serialization-a-rank-hides.md` — the method
- `rule.require.a-gain-cell-behind-every-sev.md` — the measured basis a re-grade owes anyway
- `rule.forbid.fabricated-opines.md` — a found serialization's children need a human's grade
- `rule.always.prioritize-never-supervise.md` — the hunt ends at a seed
- `define.invariant.eco.a-part-gates-its-whole.md` — what an edge claims
- `rule.require.bound-grove-concurrency-by-saturation.md` (role=supervisor) — the cap

---

written by human + beaver 🦫
