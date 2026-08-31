# define.experience._.metric=boundary-density

## .what

**boundary-density** is a metric to evaluate an experience demo by: **how many of the
behavior's boundaries it exercises in one walk.**

a *boundary* is an edge where the system's response changes — a rejection, a limit, a seam
handoff. the *point* of a demo is to **exercise those boundaries**: the experience is the
instrument, the boundaries are the target. so an experience is worth more the more boundaries
it crosses.

density is **not a third axis** of a path (those are *feel* and *care* — see
`define.experience`). it is an evaluation lens on the demo itself — how much of the behavior's
edge surface one experience puts to the test.

## .why density is first-class — value + risk

density earns its place for two reasons at once:

- **value** — a dense experience discharges many boundaries' coverage in a single realistic
  walk. one journey can cover what five sterile single-step demos would.
- **risk** — a dense experience is the one **most likely to break**, *because* it crosses so
  many boundaries. each boundary is a failure point, and their interactions compound (the
  last-slot limit races the site-index seam; a declined card lands mid-hold). defects cluster
  where boundaries pile up. the sparse single-boundary path rarely surprises; the dense journey
  is where the vision's vague prose gets exposed.

so **seek out the densest experiences and cover them best** — they are simultaneously the
highest-value demos and the highest-risk paths, so they deserve the richest demo and the
deepest scrutiny.

## .density is independent of care

a dense experience is a valuable, risky demo whether it is a critipath or an alterpath. the two
are orthogonal:

- **a dense alterpath can be your most valuable demo.** an alterpath that exercises every
  boundary a critipath proves *and more* covers the critipath's boundary set for free, then
  adds its own. its *severity* stays a nitpick (care), but its *value and risk* are high
  (density).
- **you can have both.** the densest experience can *itself* be a critipath — dense **and**
  load-critical.

care sets the **severity** (blocker vs nitpick if absent); density sets the **priority and
scrutiny** (where to spend demo effort). do not conflate them.

## .find and center the densest — do not prune

density **ranks and prioritizes; it does not filter.**

- **hunt the densest.** among all the paths the wish implies, actively seek the ones that cross
  the most boundaries in one realistic walk. give them the richest demo and the deepest review.
- **the sparse ones still count.** a single-boundary experience still earns its place in the
  catalog — it is simply lower-priority than a dense one. we want the densest *and* the rest.

## .the coverage-subsumption tell

two demos relate by **coverage-subsumption**: demo A subsumes demo B when A exercises every
boundary B does, and more. prefer the demo that subsumes — it discharges B's boundary breadth in
one walk.

this is distinct from the *care-subsumption* of `define.experience._.axis=care.path=criti-vs-alter`:

| subsumption | question | decides |
|-------------|----------|---------|
| **care** | does path A reach the goal wherever B does? | critipath vs alterpath (severity) |
| **coverage** | does demo A exercise every boundary B does, and more? | which demo to center (density) |

they can point opposite ways — a low-severity alterpath (care) can be the highest-coverage demo
(density). that is the whole reason density is its own metric.

## .the one guardrail — fail-safe stays legible

a boundary *exercised* by a dense journey is not the same as a **sharp critipath** proven to
fail safe. if a journey brushes the closed-spot rejection boundary but breezes past whether it
failed fast/loud/teaches-the-fix, the boundary is touched but the safety obligation is unproven.

so: **dense journeys for breadth, focused spotlights for each sharp critipath's fail-safe.** a
dense demo plus a couple of critipath close-ups — not one mega-path that buries the load-critical
moments.

## .a dense walk — at the seaturtle surf school 🐢🌊

one realistic session, five boundaries exercised across two surfers:

```
given a surfer "kai" and a surfer "jo" on a busy saturday
  when [t0] kai runs `booklesson --surfer kai --spot pipeline`
    then kai sees a graceful "no" — pipeline is closed — that names an open spot   # rejection boundary
  when [t1] kai retries `--spot trestles` — the last open slot
    then kai's slot holds; a confirmation, no double-book                          # limit boundary
  when [t2] kai pays; his card is declined
    then kai sees a fast, loud "try another card"                                  # rejection boundary
  when [t3] kai pays with a second card
    then kai sees a receipt — charge succeeded                                     # happy boundary
  when [t4] jo opens the open-slot list right after
    then jo sees trestles already gone — never books the slot kai just took        # seam boundary
```

one walk, five boundaries across two surfers — far denser than five separate one-boundary demos,
and the most likely to expose a real defect (the t1→t4 last-slot consistency race between kai and
jo, the t2→t3 mid-flow decline recovery). this is the experience to center. the sharp critipaths
inside it (closed-spot, decline) each still get a focused spotlight so their fail-safe stays
legible.

## .see also

- `define.experience` — the parent frame; density is the evaluation lens on top of feel × care
- `define.experience._.axis=care.path=criti-vs-alter` — the *care* axis, and *care*-subsumption (vs coverage here)
- `define.experience._.axis=feel.path=happy-vs-sharp` — the *feel* axis, and the fail-safe the guardrail protects
- `define.experience._.demo.surf-school` — the worked catalog + cases
- ergonomist `rule.require.acceptance-journey-coverage` — the delivery-stage journey rule this
  shifts left to the vision
