# define.eco.priority-glyphs

## .what

> **one glyph per row, first match wins.** the glyph names a position on **one of two
> orthogonal axes**. one symbol suffices because the two populations are **disjoint**.

```
🏔️ sandpine — p0·1m
├─ 🪨 ensell — p0·1m
│  └─ 🏔️ 1klpm — p0·1m                       ← a peak on a peak
│     ├─ 🪨 walkins — p0·1m
│     │  └─ 💤 …bert.pillar-0-walkins-p5 — p0·1m
│     └─ 🪨 signup-funnel-tune — p1·1m
│        └─ 🪨 from-bot — p1·1m
│           └─ 🌾 …bert.fix-snap-coverage — p1·1m
└─ ⛰️ rhachet — p1·1m
```

## .the two axes

| axis | grades | glyphs |
|---|---|---|
| 🏔️ **decomposition** | how prominent an objective is | 🏔️ ⛰️ 🪨 |
| 🌲 **lifecycle** | how far a deliverable has come | 💧 🌲 🌾 🌊 💤 |

🔴 **they never collide, by construction.** a row carries a tree slug or it does not
(`define.eco.strategic-vs-tactical`), so exactly one axis applies.

## .the ladder — first match wins

| # | test | glyph |
|---|---|---|
| 1 | `bigrock://` | 🏔️ |
| 2 | `altrock://` | ⛰️ |
| 3–6 | has `refTree` — `inflight` · `done` · `held` · else | 🌾 · 🌊 · 💤 · 🌲 |
| 7–9 | has `refTask` — `done` · `held` · else | 🌊 · 💤 · 💧 |
| 10–11 | `done` · `held` | 🌊 · 💤 |
| 12 | else | 🪨 |

🔴 **the order carries the claim.** the scheme test runs first: a root kind is a human
declaration, and it outranks the machinery beneath the row.

## .axis 1 — decomposition

| glyph | uri | quest |
|---|---|---|
| 🏔️ | `bigrock://` | **mainquest** — what we committed to |
| ⛰️ | `altrock://` | **sidequest** — worth the spend, off the main line |
| 🪨 | `subrock://`, no tree, no task | a **part** of a root rock |

⛰️ is 🏔️ without snow, on purpose. verbatim, 2026-09-18: *"altrocks should be mountains
without the snow. bigrocks should be mountains with the snow."*

### 🔴 a mountain at ANY depth

a `bigrock://` or `altrock://` deep in a path still renders its mountain. prominence holds
at every depth. verbatim: *"a peak on a peak … or a peak enroute to a peak. so, if
{big,alt}rock, always show mountain. only show rock for subrocks that arent trees or tasks."*

⇒ a second declaration, not a contradiction: `sandpine` says *this line matters*; `1klpm` says
*this pillar is big enough to name*. ⚠️ a rendered mountain is a promise — every rollup,
filter, and sort that keys on the root must still reach a promoted row.

### 🔴 the discriminator is a TREE SLUG, never a STATUS

verbatim: *"unless it has a tree slug, its a rock."*

| the misread | what holds |
|---|---|
| *"it has parts, so it is a rock"* | no — a tree may own rocks |
| *"it is inflight, so it is a tree"* | no — a rock rolls up `inflight` from its parts |
| *"it is deep, so it is a part"* | no — depth is not prominence |
| *"it carries a `refTree`"* | ✅ that is the whole test |

a status is a read; a tree slug is a fact about a branch. only the fact may sort the axis.

### 🟡 `refTask` keeps 💧

a row with a task and no tree is a **seed** — dispatch-ready. to render it 🪨 would hide
every sprout candidate in the store, which is what a supervisor reads the board to find.
verbatim: *"refTask keeps 💧."*

## .axis 2 — lifecycle

| glyph | state |
|---|---|
| 💧 | **seed** — a queued task, no tree |
| 🌲 | **sprouted** — a tree stands, work not begun |
| 🌾 | **underway** — `inflight` |
| 🌊 | **done** — merged |
| 💤 | **held** — parked on purpose |

⇒ 💧/🌲 is `define.sprout-vs-seed` (role=supervisor), rendered. 🌊 and 💤 also serve a rock:
*done* and *held* are the two states rocks and trees share, so a second pair would be
glyph-synonym drift.

## .the orthogonal marks — beside the glyph, never inside

| mark | says |
|---|---|
| ⭐ | **sponsored** (`define.prioritized-vs-sponsored`) |
| 🗜️ | **clamped** (`define.eco.solve-vs-clamp`) |
| 🪃 ⚖️ ❔ | evidence disagrees (`howto.read-eco-priority-flags`) |

each varies independently of both axes, so a fold would need a product of symbols.

## .why ONE glyph — the retired two-slot mark

a `[phase][status]` pair (`🌲🌾`, `💧👋`) was **retired 2026-09-14**. it assumed a row varies
on both axes at once; it does not, since the axes partition the rows. it also named a
`👋 ready` / `🪵 gated` split no code computes, and its `.enforcement` graded the correct
implementation a blocker. ⇒ a stale declaration does not merely fail to help; it prosecutes.

## .the palette

| glyph | status |
|---|---|
| 🗻 | 🔴 **forbidden** — mount fuji, a named mountain. verbatim: *"lets use a different emoji than mount figi. just use bigrock emoji there, for strategic"* |
| 🪨 | ⚠️ **double-booked** — also rhachet's `solid skill` banner glyph. read the position |

🟡 no `domain.glyphs/catalog.of=glyph._.md` exists here, so a grep proves a glyph unused,
never unclaimed (`im_an.obsessive_learner.for.domain.glyphs`, bhrain). an open arrear.

## ⚠️ .the implementation hazard — an apostrophe halts the render

the ladder lives in a **single-quoted jq program** in `ecowork.sh`. an apostrophe anywhere
in it — even a comment — closes the quote, and bash parses the rest:

```
syntax error near unexpected token 'elif'        exit 127
```

🔴 the error names a line that is fine. ⇒ reword (*"the root SLUG"*), never escape.

## .enforcement

- a `bigrock://`/`altrock://` not rendered as its mountain, at any depth = **blocker**
- a tree-slug row on the decomposition axis, or a no-tree row on the lifecycle axis = **blocker**
- a `refTask` row rendered 🪨 = **blocker** (hides a sprout candidate)
- a glyph typed into the store rather than derived = **blocker**
- a second glyph for a state this ladder names = **blocker**
- 🗻 for a rock = **blocker**
- an orthogonal mark folded into the glyph = **blocker**
- a promotion whose rollup drops the promoted row = **blocker**
- a glyph with no catalog row = **nitpick**, until the catalog exists

## .see also

- `define.eco.strategic-vs-tactical` — why the axes partition the rows
- `define.eco.rock-lifecycle-and-treestruct` — uri shapes and promotion
- `define.sprout-vs-seed` (role=supervisor) — the 💧/🌲 split
- `define.prioritized-vs-sponsored` — ⭐
- `define.eco.solve-vs-clamp` — 🗜️
- `howto.read-eco-priority-flags` — 🪃 ⚖️ ❔
- `rule.always.render-priorities-as-treestruct` — when to emit the rootstruct
- `im_an.obsessive_learner.for.domain.glyphs` (bhrain/learner — **foreign**)
- `ecowork.render.integration.test.ts` — the ladder, clamped

---

written by human + beaver 🦫
