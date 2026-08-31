# define.experience._.axis=care.path=criti-vs-alter._.demo.boundary=shoetie-on-carbumper-at-75mph

## .what

the **boundary case** of the severity axis: the corner where the `severity = frequency × cost`
product goes degenerate. it teaches the one point a cost-only read of criticality gets wrong —
that a total loss of capability is *not* critical if nobody ever walks the path.

read it after `define.experience._.axis=care.path=criti-vs-alter`. that brief gives the
law; this demo walks its edge.

## the boundary

> tie your shoes on the bumper of your car, at 75mph.

no product grants this capability. so it is, strictly, a **true loss of behavior** — an act the
actor cannot do. the cost-only instinct screams *critipath*: the per-incident cost is **infinite**
(you die).

but severity is a **product**, not the cost alone:

| term | value | why |
|------|-------|-----|
| per-incident cost | **∞** | a fall at 75mph is total ruin |
| frequency | **0** | nobody ever tries — *because* the cost is ruinous |
| **severity = freq × cost** | **0** | `0 × ∞ = 0` — no expected burden |

so it is **not critical**. we do not demo it, do not build for it, do not even name it an
experience. a capability whose path is never walked carries no expected loss, however catastrophic
one imagined incident would be.

## why the product resolves `0 × ∞`

it looks like the indeterminate form, but severity is the **expected** burden — a sum over
incidents of `frequency × cost`. the expectation of an event with probability zero is zero,
whatever its cost. no walk, no incident, no burden. the frequency gates the cost.

## the two boundaries it sits between

hold this next to its neighbors on the frequency axis — same infinite cost, different frequency:

| frequency | per-incident cost | severity | care |
|-----------|-------------------|----------|------|
| **zero** — never walked (shoe-tie) | ∞ | **0** | **not an experience** |
| **rare** — once a season, no recovery | ∞ | **high** | **critipath** |
| **common** — every session, no recovery | ∞ | **highest** | **critipath** |

the jump from row 1 to row 2 is the whole lesson: at exactly freq = 0 the product collapses; one
notch above zero, an unrecoverable break is a critipath. rarity saves you *only* at the boundary.

## .the tell for authors

when you catch yourself about to name a path a critipath on its **cost** alone — "if this broke it
would be catastrophic!" — stop and ask the other half: **does anyone walk it?** a catastrophe on a
path with freq = 0 is a shoe-tie: dramatic, and not your job. spend the demo budget where
`freq × cost` is real.

## .see also

- `define.experience._.axis=care.path=criti-vs-alter` — the law this demo walks the edge of
- `define.experience._.demo.surf-school` — the four-quadrant worked catalog
- `define.experience` — the parent frame (feel × care)
