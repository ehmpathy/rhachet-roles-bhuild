# define.invariant.eco.a-part-gates-its-whole

## .what

a part gates its whole, by construction. a decomposition edge IS an orchestration edge — the
store derives it, and refuses to store it.

`define.eco.decomposition-vs-orchestration` declares part-of and must-precede orthogonal —
right about direction, wrong about independence in exactly one place. where a rock sits beneath
another in the `--goal` tree, the block is already stated: `subrock://sms-tune/waste-alert` is
a PART of `sms-tune`, so `sms-tune` cannot reach `done` while `waste-alert` is open. no
human types that edge — the tree already said it.

## .kind: nature

no decision could have gone otherwise. to decompose a rock is to declare "this whole IS these
parts." a whole with an open part has open work in it — that is what "part" means, not a
policy. a store that let a parent read `done` beside an open child would not trade off a
tradeoff; it would misreport its own tree.

## .the invariant, stated

```
beneath(part, whole)  ⇒  mustPrecede(part.done, whole.done)
beneath(part, whole)  ⇒  a stored gate(part → whole) is REFUSED
beneath(part, whole)  ⇒  a stored gate(whole → part) is REFUSED   (the inverse, too)
```

derived read a caller actually sees:

```
partsOpen(R)  = { P : beneath(P, R) ∧ P.status ∈ { enqueued, inflight, held } }
ready(R)      = R.status = enqueued ∧ gatedByOpen(R) = ∅ ∧ partsOpen(R) = ∅
```

consequences: `partsOpen` is derived from `--goal`, read fresh, never stored; a hand-typed
ancestor↔descendant gate throws, both directions; `ready` conjoins `partsOpen` beside
`gatedByOpen`.

## .why derived, not stored

a fact with two homes is a fact that can drift. the tree is authoritative — retype `--goal` and
the part-of edge moves. a gate row written at decompose-time would not move, so the store would
hold two records of one fact that disagree, with no instrument to say which is right.

counter-argument: a stored edge is cheap to read (one index scan); the derived read scans every
row on every `get`, since a descendant may sit outside the caller's filter (a join over the
filtered set reports a clean parent with open children the query never saw). at today's row
count that scan is free; the repair, if it bites, is an index on `goal`, never a second copy of
the edge.

## .what would overturn it

nature, so not overturnable by taste — only by proof the domain was misread:

- `--goal` stops standing for part-of (becomes a category/tag/folder instead of a decomposition)
  — a real risk, which is why `rule.require.rock-goal-treestruct` binds the tree to
  decomposition explicitly
- a whole genuinely NOT its parts — if a rock could reach `done` independent of the work beneath
  it, "part" was the wrong word for that edge

the scan cost would NOT overturn it — that's a performance fact, never a domain claim.

## .scope

binds the `done` axis — a part holds its whole's COMPLETION beyond dispute. whether it also
holds the whole's START is a best guess: the store currently answers yes (`ready` requires
`partsOpen` empty); clean to reverse, itemized as a fulcrum.

does not bind cross-branch gates — `svc-reminders-declapract` holding `sms-waste-audit`
across two roots is a real prerequisite, stored, and exactly the case the gate table exists for.
does not claim the two relations are one relation — they remain orthogonal in general; this
invariant names the one family of pairs where one implies the other.

## .enforcement

- a stored gate between an ancestor and a descendant = **blocker**
- a `partsOpen` derived from the caller's filtered set rather than the whole store = **blocker**
- a part-of edge written into the `gate` table at decompose-time = **blocker**

## .see also

- `define.eco.decomposition-vs-orchestration.md` — the two relations this sharpens
- `rule.require.aim-a-gate-at-the-work.md` — a derived parent block means every stored gate
  belongs at a leaf
- `rule.require.rock-goal-treestruct.md` — why `--goal` stands for decomposition
- `term=partial-audit._.choice._.md` — the hazard the whole-store read avoids
- `define.invariant.eco.quant-informs-opine.md` — the peer invariant

---

written by human + beaver 🦫
