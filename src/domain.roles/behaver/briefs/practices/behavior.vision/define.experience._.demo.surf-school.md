# define.experience._.demo.surf-school

## .what

a **canonical worked example** of experience demonstration, for a small wish: *"a surfer can
book a surf lesson at a seaturtle surf school."* it walks **all four quadrants** of the
**feel × care** grid — one realistic case each — so the two axes, how they differ, and how they
combine are intuitive:

|  | **happy** (glides to success) | **sharp** (hits an edge that can cut) |
|--|-------------------------------|----------------------------------------|
| **critipath** (no workable fallback) | **case 1** — book my spot + tide | **case 2** — book a closed spot → graceful "no" (must fail safe) |
| **alterpath** (a workable fallback) | **case 3** — take the nearest open slot | **case 4** — mistype a spot → "did you mean…?" |

each case is rendered twice (narrative + bdd `[tn]`). reference this when unsure what a worked
experience surface looks like. the frame is `define.experience`; the method is
`howto.experience.enumerate`; this brief is the worked result.

---

## the wish (abbreviated)

> a surfer books a lesson at a seaturtle surf school. they pick a spot, or take the nearest open
> one; the school holds the slot and confirms. a spot may be closed; a spot name may be
> mistyped. the site reflects open slots in **realtime**, so two surfers never grab the same
> slot off a stale view.

---

## `1.vision.experience.case=_.md` (the catalog)

the catalog is a **small, linked index** — one row per experience, each **linked** to its own
`case=N` file, with a feel and care named. it holds pointers, not the demos; the demos live in the
companion files. **feel** = what the actor feels (happy / sharp). **care** = if the path broke,
is there a workable fallback? (critipath = no → required, blocker if absent · alterpath = yes →
bonus, nitpick).

| case | experience | actor | feel | care | one-line |
|------|------------|-------|------|------|----------|
| 1 | [book-my-spot](./1.vision.experience.case=1.book-my-spot.md) | surfer | happy | critipath | names an exact spot + tide, the school holds it — the route it lives on |
| 2 | [book-a-closed-spot](./1.vision.experience.case=2.book-a-closed-spot.md) | surfer | sharp | critipath | picks a closed spot, gets a graceful "no" that names the fix |
| 3 | [take-the-nearest-slot](./1.vision.experience.case=3.take-the-nearest-slot.md) | surfer | happy | alterpath | skips the spot name, takes the nearest open slot; a convenience over a named pick |
| 4 | [mistype-a-spot-name](./1.vision.experience.case=4.mistype-a-spot-name.md) | surfer | sharp | alterpath | fat-fingers the spot name, gets a "did you mean…?" and recovers |

> **critipaths (1, 2) are required** — each must have a case, and the sharp one (2) must prove
> it fails safe. **alterpaths (3, 4) are a bonus** — demoed here because they strengthen the
> picture, but their absence is a nitpick, not a blocker.
>
> a cell left empty is answered aloud, never blank — e.g. "the admin has no sharp critipath
> here — a re-close of an already-closed spot is an idempotent no-op."

---

## `1.vision.experience.case=1.book-my-spot.md` — happy critipath

**narrative**

kai wants *his* session: mavericks, dawn, the tide he can make. he runs
`booklesson --surfer kai --spot mavericks --time 6am`. the school holds his exact pick and
confirms. kai glides straight to success. this is the route the school lives on: surf is
time-and-place specific, so if specific-book broke, an auto-assign to a random cove on the wrong
tide is no workable fallback — kai cannot get the session he came for.

**bdd `[tn]` timeline**

```
given a surfer "kai" and an open spot "mavericks" at 6am
  when [t0] kai runs `booklesson --surfer kai --spot mavericks --time 6am`
    then kai sees "🐢 booked kai at mavericks, sat 6am" — his exact pick, held
  when [t1] kai runs the same command again
    then kai sees the same held slot returned — no second slot taken (idempotent)
```

---

## `1.vision.experience.case=2.book-a-closed-spot.md` — sharp critipath (fails safe)

**narrative**

kai tries pipeline — closed for the winter swell. a real surfer *will* hit a closed spot; you
do not know until you try. so this rejection is on the critical path, and a safe handler for it
is what keeps kai's session alive. instead of a stack trace or a silent no-op, the school answers
**fast** (at the boundary, no partial hold), **loud**, and **teaches the fix** — it names why
pipeline is closed and hands kai an open spot to try. kai is not cut by the edge.

```
🐢 bummer dude — "pipeline" is closed for the season

  why: winter swell shut pipeline until march
  fix: pick an open spot —
    booklesson --surfer kai --spot trestles
  see open spots:
    booklesson spots --list --open
```

**bdd `[tn]` timeline**

```
given a surfer "kai" and a closed spot "pipeline"
  when [t0] kai runs `booklesson --surfer kai --spot pipeline`
    then kai sees a fast "no" — the pick is rejected at the boundary, no partial hold
    and  the message states why: "pipeline is closed for the season"
    and  the message names the fix: an open spot + how to list open spots (loud, teaches)
```

> the fail-safe proof a **sharp critipath** owes: **fast** (rejected at the boundary), **loud**
> (no error swallowed), **teaches the fix** (names the next move). why is this a *critipath*, not
> an alterpath? because a broken closed-spot rejection dead-ends the search — kai does not know
> to try trestles, and the "catch a session" journey stalls with no workable fallback. contrast
> case 4, a sharp path whose failure leaves an obvious recovery.

---

## `1.vision.experience.case=3.take-the-nearest-slot.md` — happy alterpath

**narrative**

jo is easy — she just wants in the water saturday, does not care where. she skips the spot
entirely and runs the bare `booklesson --surfer jo`. the cli takes the nearest open — trestles,
7am — and confirms. she glides to success, same as kai in case 1 — but this route is a
*convenience*, not a lifeline: if auto-assign broke tomorrow, jo would just name a slot herself
(`--spot trestles`), same as the case 1 route. a workable fallback (case 1) remains, so its
absence is a nitpick.

**bdd `[tn]` timeline**

```
given a surfer "jo" and open spots, the nearest is "trestles" at 7am
  when [t0] jo runs `booklesson --surfer jo`
    then jo sees "🐢 booked jo at trestles, sat 7am" — the nearest open slot, held
```

> case 3 and case 1 are **both happy** (both glide to success) — the feel is identical. they
> split on **care**: case 1 (specific-book) has no fallback (critipath), case 3 (auto-assign)
> falls back to naming a slot — the case 1 route (alterpath). hold feel constant, and the care
> axis stands alone.

---

## `1.vision.experience.case=4.mistype-a-spot-name.md` — sharp alterpath

**narrative**

jo fat-fingers the spot: `--spot mavriks`. she hits a **sharp** edge — an invalid input, a
rejection. but the failure is gentle: the school says "no spot 'mavriks' — did you mean
mavericks?", and jo recovers in one step. this suggestion is a *nicety*: even if the "did you
mean" broke, a plain "no such spot: mavriks" still leaves jo an obvious recovery — retype it.
so the fallback is trivial, and the enhancement is gravy. sharp, but an alterpath.

**bdd `[tn]` timeline**

```
given a surfer "jo" who mistypes the spot as "mavriks"
  when [t0] jo runs `booklesson --surfer jo --spot mavriks`
    then jo sees "no spot 'mavriks' — did you mean mavericks?"
  when [t1] jo retries `--spot mavericks`
    then jo's slot is held — she recovered in one step
```

> case 4 and case 2 are **both sharp** (both hit a rejection edge) — the feel is identical. they
> split on **care**: a broken closed-spot rejection (case 2) dead-ends the search with no
> fallback (critipath); a broken typo-suggestion (case 4) still leaves "retype it" as a workable
> fallback (alterpath). hold feel constant, and the care axis stands alone.

---

## how the quadrants differ — and combine

**two independent axes.** every experience is one point on a 2×2:

- **feel** — what the actor *feels* as they walk the path. **happy** = glides to success.
  **sharp** = hits an edge that can cut (a rejection, a limit, a bad handoff).
- **care** — what happens if the path *broke*. **critipath** = no workable fallback, a core
  usecase fails. **alterpath** = a workable fallback remains, the actor still reaches the goal.

they are independent — hold one constant and the other still varies. this demo proves it with
four held-constant pairs:

| hold this constant | the pair | what varies |
|--------------------|----------|-------------|
| **feel = happy** | case 1 vs case 3 | care: no fallback for "my spot + tide" (criti) vs falls back to a named slot (alter) |
| **feel = sharp** | case 2 vs case 4 | care: dead-ends the search (criti) vs "retype it" (alter) |
| **care = critipath** | case 1 vs case 2 | feel: names his spot, glides (happy) vs hits a rejection edge (sharp) |
| **care = alterpath** | case 3 vs case 4 | feel: takes the nearest, glides (happy) vs mistypes a spot (sharp) |

**each quadrant carries a different obligation:**

|  | happy | sharp |
|--|-------|-------|
| **critipath** | demo **required** — show the common case just works | demo **required** and prove it **fails safe** (fast, loud, teaches the fix) — the load-critical quadrant |
| **alterpath** | demo is a **bonus** — show the convenience | demo is a **bonus** — a plain rejection already suffices; the nicety is gravy |

- **feel sets the obligation** — a *sharp* path must prove it fails safe; a happy one need not.
- **care sets the severity** — a *critipath* blocks if absent; an alterpath is a nitpick.

**and they combine.** the quadrants are not separate demos forever — a single realistic journey
crosses several at once (kai books his spot → hits a closed one → grabs the last slot → pays,
declined → pays again). that boundary-dense walk is the highest-value and highest-risk demo — see
`define.experience._.metric=boundary-density`. the quadrants are the vocabulary; a dense journey is the sentence.

---

## what this example demonstrates

- **all four quadrants, one realistic case each** — happy critipath (1), sharp critipath (2),
  happy alterpath (3), sharp alterpath (4).
- **the axes are independent** — held-constant pairs (1↔3, 2↔4, 1↔2, 3↔4) isolate each axis so
  the difference is intuitive, not asserted.
- **feel ≠ care** — a *sharp* path can be criti (case 2) or alter (case 4); a *critipath* can be
  happy (case 1) or sharp (case 2). sharpness is not criticality.
- **the load-critical quadrant is sharp critipath** (case 2) — it must be demoed and prove it
  fails safe. that is the whole reason to surface experiences at the vision.
- **they combine into dense journeys** — the quadrants are the blocks; boundary-density is how a
  vision centers the richest walk.
- **empty cells answered aloud** — a skipped path is a declared choice, not an oversight.

## .see also

- `define.experience` — the feel × care frame this fills in
- `define.experience._.axis=feel.path=happy-vs-sharp` — the feel axis deep dive (more seaturtle examples)
- `define.experience._.axis=care.path=criti-vs-alter` — the care axis deep dive (the one test: workable fallback?)
- `define.experience._.metric=boundary-density` — how the quadrants combine into a dense journey
- `howto.experience.enumerate` — the method that produced this catalog
- `rule.require.experience-coverage` — the rule this example satisfies
- `code.test/frames.behavior/howto.write-bdd` (mechanic) — the `[tn]` form each case uses
