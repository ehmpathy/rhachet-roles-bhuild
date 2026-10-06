# howto.find-the-serialization-a-rank-hides

## .what

hunt for work the rank runs in SERIES that could run in PARALLEL.

a rank orders work. it does not say how much of that order is real. some is a true dependency —
B cannot start until A lands. the rest is an artifact: an edge nobody re-examined, a row nobody
dispatched, or N repos folded into one slug. this is the search for the third kind.

## .why

two rows in series cost `t₁ + t₂`. the same two in parallel cost `max(t₁, t₂)`.

```
series    ├──── A ────┤├──── B ────┤        t₁ + t₂
parallel  ├──── A ────┤
          ├──── B ────┤                     max(t₁, t₂)
```

it compounds down the chain — every row gated on the pair starts at the end of the whole run, so
one needless edge delays every descendant by a peer's full duration.

the cost is invisible by construction: a serialized rank is not WRONG — every row grades right,
every gate is honest, the store reports no defect. the loss shows up only as wall-clock, which no
column holds.

## .the three serializers — only ONE is in the gate edges

a hunt that reads `gatedBy` alone finds a third of the field.

| the serializer | where it lives | the tell |
|---|---|---|
| a gate edge | `gatedBy` — declared, visible | an edge whose gated row needs the gater's CONTEXT, not its OUTPUT |
| an un-seeded gater | `refTask: []` — invisible in the DAG | two peers, same grade, one dispatched and one not |
| a folded row | inside the `--what`/`--why` prose | a sequence word: then · once · after · every · all the |

rows 2 and 3 do not appear as edges — the store renders the pair as parallel and reports them
clean, while the work runs in series anyway.

## .the queries

### 1. the un-seeded gater — peers split by dispatch

a pair the rank calls concurrent, where one half has a task and the other does not.

```sh
printf '%s' '{}' | node .agent/repo=bhuild/role=prioritizer/skills/work/ecowork.db.mjs \
  get .eco/priority.db \
| jq -r '
  .priorities
  | group_by((.goalPath // "_") | split("/")[:-1] | join("/"))
  | map(select(length > 1))
  | map(select(any(.[]; (.refTask | length) > 0) and any(.[]; (.refTask | length) == 0)))
  | .[] | .[] | "\(if (.refTask|length) > 0 then "✅" else "🔴" end) \(.opine.sev) \(.slug)"
'
```

⚠️ grade the pair, never the row — a p3 peer beside a p1 is correctly un-seeded. this hunts a
peer at the SAME grade that nobody dispatched.

### 2. the folded row — a sequence word in the prose

```sh
printf '%s' '{}' | node .agent/repo=bhuild/role=prioritizer/skills/work/ecowork.db.mjs \
  get .eco/priority.db \
| jq -r '
  .priorities[]
  | select(.what | test("(, then |HALF 1|HALF 2| and then |(every|all|each) (role|repo|package|service)s? )"; "i"))
  | "\(.opine.sev) \(.slug)\n   \(.what[0:110])"
'
```

a row whose `what` says "A, then B" is two rows in one slug, and one crew has to do both in
order. worse, "every role" / "all the repos" is N rows in one slug, forbidden outright by
`rule.require.one-pr-per-worktree` — the fold is a defect before it is a loss of wall-clock.

⚠️ the pattern is tight on purpose — a loose screen (`then|once|after|every|each` anywhere)
returns mostly ordinary prose; the tightened form returns only genuine hits. and a hit is a
screen, never a verdict: read each one — some are a real fold, some a parent already decomposed,
some a genuine sequence where serialization is real (publish, then shim, then deprecate cannot
overlap).

### 3. the edge that is not a dependency

```sh
printf '%s' '{}' | node .agent/repo=bhuild/role=prioritizer/skills/work/ecowork.db.mjs \
  get .eco/priority.db \
| jq -r '.priorities[] | select((.gatedBy | length) > 0) | "\(.slug)\n   ⟵ \(.gatedBy | join("\n   ⟵ "))"'
```

per edge, one question: does the gated row's DONE-TEST need the gater's OUTPUT, or only its
CONTEXT? output (a file, a schema, a published version, a decision it cannot make alone) → the
edge is real. context ("it makes more sense after", "we'd know more") → that's a preference, and
it costs `t₁` to hold.

## .grade a fan-out by measured share, never evenly

when a folded row splits into N children, resist the reflex to grade them alike. a role-boot
cost audit across thirteen roles found two of thirteen carried over half the total token cost —
grade all thirteen the same and the crew that pays back half the cost queues behind one that
pays back a sliver. the fan-out is the cheapest moment to rank by size, because the measurement
is what produced the children.

⚠️ the measurement must be real — a share invented to justify a rank is the same class as a
fabricated opine, and the opine it feeds outranks every quant beneath it
(`rule.forbid.fabricated-opines`).

## .bound — parallel work needs a slot

the grove is concurrency-capped by token budget
(`rule.require.bound-grove-concurrency-by-saturation`). a fan-out past the cap does not run in
parallel — it queues, and the serialization moves into the grove instead of the store, where
fewer instruments see it. before a fan-out, read `rhx git.grove.saturation`; where slots are
full, record the find, seed the highest-share child, and hold the tail.

a parallel split is not free either — N rows is N crews, N PRs, N reviews, N rebases where they
touch one file. split where the work is genuinely separable — a repo boundary is the cleanest
seam there is.

## .the worked case

two rows at the same grade, both with `gatedBy: []` (correctly parallel by the rank) — one had
tasks dispatched against it, the other had never been seeded. the clamp side moved for weeks; the
other waited on a row no crew had been asked to start — serializer #2. the un-seeded row's own
`why` also carried serializer #3: two halves in sequence, fanned across nine repos, in one slug.

## .enforcement

- a peer pair at the same grade where one half is un-seeded, found and left un-dispatched = **blocker**
- a row whose `what` names two halves in sequence, or `every`/`all the` over a repo set, left as
  one row = **blocker**
- a fan-out graded evenly where a measurement was available = **blocker**
- a share cited in a `--why` with no measurement behind it = **blocker**
- a gate edge kept for CONTEXT rather than OUTPUT = **nitpick** (say so in the `--why`)
- a fan-out past the grove cap = **nitpick**

## .see also

- `rule.always.hunt-the-serialization-when-you-rank.md` — the mandate; this is the method
- `define.invariant.eco.a-part-gates-its-whole.md` — what a gate edge actually claims
- `define.eco.decomposition-vs-orchestration.md` — when a fold should become children
- `rule.require.one-pr-per-worktree.md` (role=supervisor) — why `every repo` in one slug is a defect
- `rule.forbid.fabricated-opines.md` — the bound on the share that grades a fan-out
- `rule.require.bound-grove-concurrency-by-saturation.md` (role=supervisor) — the slot cap
- `rule.require.a-gain-cell-behind-every-sev.md` — the measured basis a fan-out rank owes
- `define.eco.seed-dispatch-body-shape.md` — what a dispatched child carries, gates included

---

written by human + beaver 🦫
