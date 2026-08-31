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
   **narrative** (actor's pov) + a **bdd `[tn]` timeline**. for a **sharp** critipath, show it
   fails safe — fast, loud, teaches the fix. do not demo every cell — verdict all, demo the
   critipaths + the worthwhile few.
   → `define.experience._.demo.surf-school` (a worked catalog + cases) ·
     `rule.require.experience-coverage` (what blocks) · mechanic
     `code.test/frames.behavior/rule.require.given-when-then` (the `[tn]` form)

## .the three artifacts

| step | artifact | holds |
|------|----------|-------|
| decompose | `1.vision.experience.dimensions.md` | the dimensions + the walked product |
| itemize | `1.vision.experience.case=_.md` | the inventory: the matrix, every cell verdicted + named — the coverage contract |
| demonstrate | `1.vision.experience.case=N.$slug.md` | one demo per critipath + chosen alterpath |

link them from `1.vision.yield.md`; never inline them — each carries its own content.

## .the caveat

the `[tn]` demos are **illustrative sketches**, not verified proof — no code exists yet. use
sketch commands, not committed flags; they show *intended* behavior, and feed `2.1.criteria`.

## .see also

- `define.experience` — the frame: an actor's lived encounter, on a feel × care grid
- `howto.experience.decompose` — step 1 in full
- `howto.experience.enumerate` — the actors × feel grid, the two-dimension special case
- `rule.require.experience-coverage` — the rule the coverage review enforces
