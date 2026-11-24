# howto.experience.demonstrate

## .what

produce a vision's **experience** artifacts: **decompose** the experience space, **itemize**
every cell, then **demonstrate** each critipath. this is the end-to-end method the vision stone's
`## the experiences` section runs.

## .why — discover, do not free-list

**demonstrate every critipath the wish implies — but first discover them.** a free-list is a
sample: it drops the paths you did not recall, and those hide the uncaught critipaths. you
cannot claim you *considered* the critipaths unless you walked the product of the dimensions.

## .the three steps

do these in order:

1. **decompose** — factor the experience space into **orthogonal dimensions** (actor, goal,
   path-variant, feel-trigger, resource-state, concurrency, …) and take their product. write the
   dimensions to the decomposition artifact. this is the most important step: you cannot claim
   you *considered* the critipaths unless you walked the product.
   → `howto.experience.decompose` (the method) · `rule.require.dimensional-decomposition`
     (the mandate + how a reviewer grades it)
2. **itemize** — walk every cell into the inventory: a small table, one row per cell,
   verdicted **demoed** / **itemized** / **forbidden** / **impossible** (forbidden + impossible
   cells state their *why*; forbidden ones are rejection invariants). name each real experience's
   **feel** (happy / sharp) and **care** (critipath / alterpath, where care = `freq × cost`). rank
   by boundary-density; center the densest. always write the inventory — a pure internal refactor
   declares "no experiences — internal only".
   → `define.experience._.axis=feel.path=happy-vs-sharp` (feel) ·
     `define.experience._.axis=care.path=criti-vs-alter` (care = freq × cost) ·
     `define.experience._.metric=boundary-density` (how to rank)
3. **demonstrate** — write one demo per **critipath** plus each **chosen alterpath**: a
   **narrative** (actor's pov) + a **bdd `[tn]` timeline**. each demo opens with its actor and goal,
   right under its `## case=` header:

   ```md
   > **who** — kai, a surfer who knows the break and tide he wants
   > **came for** — his exact spot, at his exact time, held
   ```

   for a **sharp** critipath, show it fails safe — fast, loud, teaches the fix. verdict every cell.
   demo only the critipaths + the worthwhile few.
   → `define.experience._.demo.surf-school` (a worked catalog + cases) ·
     `rule.require.experience-coverage` (what blocks) · mechanic
     `code.test/frames.behavior/rule.require.given-when-then` (the `[tn]` form)

## .the inventory reads as one bullet per cell

each bullet says what the experience **is**, from the actor's side, tagged and suffixed:

```
🌴 happy — smooth passage; no edge to guard  ⭐ critipath — failure INTOLERABLE (`freq × cost`)
🌵 sharp — an edge the behavior must guard   🌙 alterpath — failure DEFERRABLE

- [🌴,⭐] surfer — names an exact spot + tide, the school holds it · case=001.$slug.md
- [🌵,⭐] surfer — picks a closed spot, gets a "no" that names the fix · case=002.$slug.md
- [🌴,🌙] surfer — skips the spot name, takes the nearest open slot — itemized; fallback: $what
```

a bullet that ends in a `case=…md` is **demoed** · one that ends in `— itemized` names its
**fallback** · `— impossible` means no attempt is possible, so no guard is owed.

🟡 **feel is set by the EDGE. the outcome does not set it** — a sharp path often succeeds (the
`limit` case is "the successful edge": you get the last open slot, one step from a double-book).

🟡 **those actors belong to the surf-school demo.** discover your own wish's actors — a `wisher`,
a `driver`, or a `lane` are actors of a *route*, and most wishes have none of them.

🔴 **a `⭐` bullet with no `case=…md` suffix is an absent critipath.** that grep is the coverage
check, and it must return zero hits.

🔴 **never point one cell at another cell's demo.** a driver reaches for the pointer only when a
critipath has no demo — and such a cell either owes one, or was never a critipath.

## .the three artifacts

| step | artifact | holds |
|------|----------|-------|
| decompose | `1.vision.yield.appendix.experience.dimensions.md` | the dimensions + the walked product |
| itemize | `1.vision.yield.appendix.experience.case=_.md` | the inventory: the matrix, every cell verdicted + named — the coverage contract |
| demonstrate | `1.vision.yield.appendix.experience.case=NNN.$slug.md` | one demo per critipath + chosen alterpath |

link them from `1.vision.yield.md`; never inline them — each carries its own content.

## .the caveat

the `[tn]` demos are **illustrative sketches**, not verified proof — no code exists yet. use
sketch commands, not committed flags; they show *intended* behavior, and feed `2.1.criteria`.

## .see also

- `define.experience` — the frame: an actor's lived encounter, on a feel × care grid
- `howto.experience.decompose` — step 1 in full
- `howto.experience.enumerate` — the actors × feel grid, the two-dimension special case
- `rule.require.experience-coverage` — the rule the coverage review enforces
- `rule.require.zero-padded-case-index` — the `case=NNN` filename width, cited from bhrain's `asStoneGuardCounter`
