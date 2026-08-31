# define.experience._.axis=care.path=criti-vs-alter._.demo.catalog=freq-x-cost

## .what

the **worked catalog** of the severity law: `severity = frequency × cost`. every combination of
the two factors, one row each, with a real example plugged in — so an author can find their path
in the table and read the care straight off.

read it after `define.experience._.axis=care.path=criti-vs-alter` (the law) and its
boundary demo (`…_.demo.boundary=shoetie-on-carbumper-at-75mph`). this brief is the worked grid.

## the catalog

each row is a `(cost, frequency)` cell → its care, with a domain example:

| # | per-incident cost | frequency | severity = freq × cost | → care | example |
|---|-------------------|-----------|------------------------|--------|---------|
| 1 | **∞** — no recovery, goal destroyed | any nonzero | **high** | **critipath** | `grove restore` with **no snapshot** — support cannot rebuild; each corrupt grove is lost |
| 2 | **high** — support hand-fixes each | **rare** (blue-moon) | tolerable | **alterpath** | `grove restore` **from snapshot** — rare corruption, support rebuilds by hand |
| 3 | **high** — support hand-fixes each | **common** (constant) | **support drowns** | **critipath** | `grove open` — every beaver, each dawn; a hand-load per beaver does not scale |
| 4 | **~0** — costless self-serve alt | any freq, even constant | **≈ 0** | **alterpath** (demo richly for *priority*) | surf `--sort by wave height` — if it broke, scan the default list; costless either way |
| 5 | **∞** — no recovery | **zero** — never walked | **0** (`0 × ∞`) | **not an experience** | tie your shoes on the bumper at 75mph — nobody ever does |

## how to read it

- **rows 1 & 3 are critipaths for *different* reasons.** row 1: the cost per incident is
  unbounded (no fallback reaches the goal). row 3: the cost per incident is bounded, but the
  frequency multiplies it past tolerance. either factor, pushed high enough, makes a critipath.
- **rows 2 & 4 are alterpaths for *different* reasons.** row 2: a costly fallback, but rare
  enough to absorb. row 4: frequent, but the fallback is costless. either factor, low enough,
  makes an alterpath.
- **row 5 is the boundary.** infinite cost, but zero frequency zeroes the product — not critical,
  not even an experience. (the shoe-tie boundary demo.)

## the two traps the catalog disarms

- **a cost-only read** (rows 1 vs 5): "this would be catastrophic → critipath!" — no. check the
  frequency. a catastrophe nobody walks (row 5) is a shoe-tie.
- **a frequency-only read** (rows 3 vs 4): "everyone hits this → critipath!" — no. check the
  cost. a common path with a costless fallback (row 4) is an alterpath; you demo it richly for
  *priority* (`define.experience._.metric=boundary-density`), but its absence is a nitpick.

## .see also

- `define.experience._.axis=care.path=criti-vs-alter` — the law this catalog fills in
- `define.experience._.axis=care.path=criti-vs-alter._.demo.boundary=shoetie-on-carbumper-at-75mph`
  — row 5, the `0 × ∞` boundary, in full
- `define.experience._.metric=boundary-density` — the *priority* lens row 4 defers to
- `define.experience._.demo.surf-school` — the four-quadrant feel × care catalog
