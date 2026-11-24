# define.experience._.demo.ship-sailor

## .what

a worked example whose whole job is **the two decoys** — the misreads that catch authors most
often, one per axis:

| decoy | the truth it hides |
|-------|--------------------|
| 🌵 *"sharp means it went wrong"* | **a sharp path routinely succeeds.** feel is set by the edge, never the outcome |
| ⭐ *"no way around a break = critipath"* | **`0 × ∞ = 0`.** a break nobody can walk into is not critical, whatever it would cost |

the wish: *"a sailor charts a passage, and the ship sails it."* 🐈⛵ **captain miki** is the cat of
the peer repo `ehmpathy/rhachet-roles-ghlitch` — the ops-and-observability roles — aboard *the steady
paw*. she charts the course, watches the water, and calls the anomalies before they land. tides and
shoals make every boundary real.

|  | 🌴 **happy** — no edge to guard | 🌵 **sharp** — an edge the behavior must guard |
|--|-----------------------------------|------------------------------------------------|
| ⭐ **critipath** — failure intolerable | **case 1** — chart a passage to a named port | **case 2** — sail the **last minute** of the tide window → **she gets across** |
| 🌙 **alterpath** — failure deferrable | **case 3** — auto-pick the nearest anchorage | **case 4** — a chart in an unreadable projection |

---

## `case=001.chart-a-passage.md` — ⭐ happy critipath

> **who** — captain miki, who charts and sails *the steady paw*
> **came for** — a course to a named port, sailed on schedule

**narrative**

*"chartin course…"* miki lays a passage from havana to nassau. deep water the whole way, no shoal
within a league, tide irrelevant. the chart returns a bearing and an ETA, and *the steady paw*
sails it. no edge to guard. every voyage begins here, and if it broke there is no route around
it — the passage **is** the product.

```
given a port "havana", a port "nassau", and open water between
  when [t0] miki charts the passage
    then she sees a bearing and an ETA — "smooth sailin"
  when [t1] miki charts the identical passage again
    then the same course is returned — no second plot filed (idempotent)
```

---

## `case=002.sail-the-last-tide-minute.md` — 🌵 sharp critipath 🔴 **and she gets across**

> **who** — captain miki, who charts and sails *the steady paw*
> **came for** — across the cat cay shoal inside its tide window, to make nassau on schedule

**narrative**

the shoal at cat cay clears only on a high tide. miki times her transit for **the last minute of
the window** — one minute before the water drops under her keel.

🔴 **she gets across. the ship reaches nassau on schedule.** miki got exactly what she came for.
and the path is **sharp**: a tide table that reads the boundary minute wrong — rounds it away, or
counts it twice — puts the keel on the sand. worse, **the chart still says clear**, so nobody
learns of the error until the hull does.

it fails safe because **the limit holds**: the last safe minute still counts, exactly once, and the
plot records the tide value it used, so a second pair of eyes can check it.

```
given a shoal at "cat cay" whose tide window closes at minute T
  when [t0] miki charts a transit that clears at minute T-1 — the last safe minute
    then the transit is plotted and sailed — the boundary minute counts, exactly once
    and  the plot records "tide=+1.4m at T-1, keel clearance 0.3m" so it can be re-checked
  when [t1] the same passage is re-plotted from the same tide table
    then the identical window and clearance are produced — deterministic at the boundary
```

> 🔴 **this is the decoy.** ask *"did miki get what she came for?"* — **yes**. ask *"did it
> glide?"* — **yes**. both questions say happy, and both are wrong. ask **"is there an edge the
> behavior must guard?"** — a keel on a shoal, off a boundary the chart got wrong — and you get
> **sharp**.
>
> ⭐ critipath because the break is **silent**: a bad boundary reads exactly like a good one, so
> cost → ∞ (you cannot recover what you cannot detect), and every shoal transit walks it.

---

## `case=003.take-the-nearest-anchorage.md` — 🌴 happy alterpath

> **who** — captain miki, at dusk on open water
> **came for** — any sheltered anchorage, with no name to pick

**narrative**

dusk, and miki wants to stop anywhere sheltered. she names no anchorage; the chart picks the
nearest lee. a convenience — *"ears back"* if it broke, she names one herself off the chart, which
is the case 1 route. the **repair defers**.

```
given open water at dusk and three anchorages within reach
  when [t0] miki asks for an anchorage with no name given
    then the nearest lee is returned and the ship anchors
```

---

## `case=004.unreadable-projection.md` — 🌵 sharp alterpath

> **who** — captain miki, handed a harbormaster's chart
> **came for** — a course plotted off a chart her plotter cannot read as-is

**narrative**

a harbormaster hands over a chart in a projection miki's plotter cannot read. an **edge** — a
half-read chart would plot a *plausible wrong course*, which is far worse than a refusal. so the
plotter refuses **before it plots one leg**, names the projection it needs, and names the convert.
miki re-projects and sails in one step.

```
🐈 wet paws — that chart's in a projection i can't read

  why: the plotter needs mercator to hold a straight rhumb line
  fix: convert it, then re-chart —
    chart convert --into mercator --from ./cat-cay.chart
```

```
given a chart in an unsupported projection
  when [t0] miki charts a passage from it
    then the plotter refuses the chart before it lays any leg — no partial course
    and  the message names the projection needed and the convert to run
  when [t1] miki re-charts from the converted file
    then the passage is plotted — recovered in one step
```

> sharp, but the repair **defers**: a refused chart costs one convert, and miki keeps her passage.

---

## the second decoy: `0 × ∞ = 0`

the old cut through **dead man's strait** silted closed in 1890. no hull afloat can transit it, and
no chart in print offers it as a leg.

> **if a dead man's strait passage broke, is there a workable route around it?** **no.** the
> transit cannot be made by any vessel. cost → ∞. **the test says critipath.**
>
> **how often is that passage sailed?** **never.** `freq = 0`. `0 × ∞ = 0`. **not critical.**

⇒ it is not an alterpath either — it is **not an experience at all**, because no sailor can attempt
it. verdict: `impossible`. no guard is owed, and no demo.

🟡 contrast `case=002`, which is rare *but above zero*: a transit lands on the last tide minute now
and then, and when it does the break is silent. **rarity relaxes severity only above `freq = 0`.**

---

## what this example demonstrates

- 🔴 **`0 × ∞ = 0`** — dead man's strait has no route around a break and is still not critical.
  the "workable route" test and `freq × cost` disagree, and the product rules.
- a sharp path succeeds — `case=002` clears the shoal and lands miki in nassau on schedule.
  outcome does not discriminate the feel axis; the edge does.
- silent breaks push cost to ∞ — a wrong tide boundary reads exactly like a right one, so no
  sailor detects it, so no sailor recovers from it.
- rare ≠ alter — `case=002` is rare and critipath; the silted strait is rare *at zero* and is no
  experience at all.

## .see also

- `define.experience._.axis=feel.path=happy-vs-sharp` — the edge-not-outcome rule this demos
- `define.experience._.axis=care.path=criti-vs-alter._.demo.boundary=shoetie-on-carbumper-at-75mph` — the `0 × ∞ = 0` boundary
- `define.experience._.demo.surf-school` 🐢 — the 2×2 baseline; the axes are independent
- `define.experience._.demo.camp-beaver` 🦫 — frequency flips the care; severity is an aggregate
- ghlitch `im_a.ghlitch_cat.story=captain_whiskers` — the persona miki sails under
