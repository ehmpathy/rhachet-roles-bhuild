# define.experience

## .what

an **experience** is an actor's lived encounter *with* a behavior.

- a *behavior* is what the system does.
- an *experience* is someone who lives through that behavior — told from the actor's point of view.

they are not synonyms and not siblings. one is the deed; the other is the encounter with that
deed. so "experience" adds no synonym drift to "behavior" — it names a different concept: the
felt, first-person walk through what the system does.

## .why

prose *narrates* an implied experience ("users run it and it just works"). prose promises; it
does not demonstrate. so a gap hides in the prose, survives to delivery, and surfaces expensive —
when a demo at the vision would have caught it cheap.

a concrete experience — a walk of one actor through the behavior — makes the gap visible at
the cheapest moment. you cannot write "and then it just works" once you must show the
keystrokes and the output.

## .one behavior, many experiences

one behavior varies over many dimensions, and each combination is a distinct experience. the same
book-a-lesson behavior differs by **actor** (a surfer, an admin, a cron), by **goal** (her exact
spot vs any open slot), by **path** (specific-book vs auto-assign), by **resource state**, by
**concurrency**. actor is only the first dimension.

so you do not free-list experiences — you **decompose** the space into its orthogonal dimensions
and walk the product. the critipaths fall out of the grid, not out of memory; a free-list is a
sample that misses the paths you did not recall. this is the discovery engine — see
`howto.experience.decompose` and its mandate `rule.require.dimensional-decomposition`.

## .the two axes — feel × care

every experience sits on two axes, both native to the actor's encounter — how the path
**feels** and how much we **care** about it. they are independent: a sharp path can be a
critipath or an alterpath; a critipath can be happy or sharp.

### axis 1 — feel: happy vs sharp — *deep dive: `define.experience._.axis=feel.path=happy-vs-sharp`*

what the actor *feels* as they walk the path:

| feel | what the actor feels | example |
|------|----------------------|---------|
| **happy** | the smooth success — they get what they came for | book an open slot, see the confirmation |
| **sharp** | an edge that can cut — a rejection, a limit, a handoff gone wrong | book a closed spot; grab the last open slot; a dropped field across a handoff |

### axis 2 — care: critipath vs alterpath — *deep dive: `define.experience._.axis=care.path=criti-vs-alter`*

how much we care that the path is demonstrated:

| care | what it is | demo |
|------|------------|------|
| **critipath** | a **criti**cal path — a core usecase depends on it, so it must work | **required** — absent = blocker |
| **alterpath** | an **alter**nate path — a non-critical route with a workable fallback | **optional bonus** — absent = nitpick |

**one test** tells the two apart, independent of feel, actor, or where the path runs:

> **if this path broke, would a core usecase fail — or is there a workable route around it?**

- a core usecase fails, no easy fallback → **critipath** (blocker if absent)
- a workable fallback remains (the actor reaches the goal another way) → **alterpath** (nitpick)

so an alterpath is not "a lesser feature" or "an edge case" — it is a path with a **workable
fallback**. do not assume the plainer, fewer-arg default is the critical one. it rarely is. a
surfer books her exact spot + tide, or takes the nearest open slot — near-identical, opposite
care. lose specific-book and an auto-assign to the wrong cove is no fallback for her session
(critipath). lose auto-assign and she just names a slot herself (alterpath). the more-specified
path **subsumes** the default, so it is the critical one. an alterpath never blocks; it only
strengthens the picture. see
`define.experience._.demo.surf-school` for the worked contrast.

## .a sharp critipath must fail safe

a **sharp critipath** carries an extra obligation: you do not merely show the edge exists —
you show the actor is not cut by it. the demo must prove the edge fails **safe**:

- **fast** — the edge is caught at once, not deep in the call stack (`rule.require.failfast`)
- **loud** — the failure surfaces with context, never swallowed (`rule.require.failloud`)
- **teaches the fix** — the error names the next move, not just the symptom
  (ergonomist `rule.require.errors-name-the-fix`)
- a positive limit still **holds** — the last valid input succeeds
- a seam does not silently **drop** data — a broken handoff is loud

a sharp critipath demonstrated as *unhandled* — the edge cuts, no fail-safe shown — is itself
a gap. the whole reason to surface a sharp critipath at the vision is to prove nobody gets
cut. this is the pit-of-success lens: ergonomist `safe-by-default`, `prevent-over-correct`,
`errors-name-the-fix`.

an **alterpath** needs no fail-safe proof — a surface demo that names it is enough; block only
when a critipath is absent.

## .the objective — declare the critipaths, then cover alterpaths as a bonus

first declare every critipath the wish implies — the happy flows and the sharp edges a core
usecase leans on — and prove each sharp one fails safe. that is the bar to pass. beyond it,
alterpaths are a **bonus**: cover as much of the surface as is worthwhile, but none of it
blocks — it only ever strengthens the picture.

## .evaluate experiences by boundary-density — *deep dive: `define.experience._.metric=boundary-density`*

the *point* of a demo is to **exercise the behavior's boundaries** — the edges where the
system's response changes (a rejection, a limit, a seam handoff). the experience is the
instrument; the boundaries are the target. so an experience is worth more the **more boundaries
it exercises** — its *boundary-density*, a first-class metric to evaluate experiences on:

- **value + risk** — a dense experience covers many boundaries at once (value) and is the one
  **most likely to break**, because so many boundaries pile up where defects cluster (risk). so
  **seek out the densest experiences and cover them best.**
- **independent of care** — a dense experience is valuable and risky whether it is a critipath
  or an alterpath. a dense *alterpath* can be your most valuable demo.
- **find and center the densest, do not prune** — density ranks and prioritizes; the sparse
  single-boundary experiences still count, just at lower priority. we want the densest *and* the
  rest.
- **the guardrail** — a boundary *exercised* by a dense journey is not the same as a sharp
  critipath *proven* to fail safe. dense journeys for breadth; focused spotlights for each sharp
  critipath's fail-safe.

see `define.experience._.metric=boundary-density` for the full treatment (value+risk, coverage-subsumption, the
worked dense walk). this is the ergonomist's `rule.require.acceptance-journey-coverage` shifted
**left** to the vision.

## .how an experience is demonstrated

each experience is rendered **twice**, so it is both felt and formal:

1. **narrative** — the felt story, from the actor's point of view (the surfer runs X, sees Y,
   feels Z).
2. **bdd `[tn]` timeline** — the given/when/then translation of that same story, with `[t0]`,
   `[t1]`… step markers (see `code.test/frames.behavior/rule.require.given-when-then`).

the narrative surfaces felt friction; the `[tn]` timeline surfaces logical holes (an absent
precondition, an unhandled `when`). at the vision stage the `[tn]` is illustrative — it feeds
`2.1.criteria` and later tests, but is not yet bound to acceptance-test citations.

**do not transliterate.** the two forms earn their keep only when each finds a gap the other
misses — the narrative catches a *felt* surprise ("wait, why did it silently do that?"), the
`[tn]` catches a *logical* one (a `given` never established, a `when` with no `then`). if your
`[tn]` is a word-for-word restatement of the narrative, you wrote one form twice — a ramble
(`rule.forbid.rambles`), and a maintenance hazard when one copy drifts. write the `[tn]` to
*test* the story, not to echo it.

## .the test — a real experience, not a restated behavior

- it is told from an actor's point of view, not the system's.
- it has a **feel** (happy / sharp) and a **care** (critipath / alterpath), each named.
- a sharp critipath proves it fails safe (fast, loud, teaches the fix), not just that the edge
  exists.
- it shows observable input and output, not "and it works".
- a wish with no user-visible experience (a pure internal refactor) declares "no experiences
  — internal only" rather than manufacture a hollow one.

## .see also

- `define.experience._.axis=feel.path=happy-vs-sharp` — deep dive on the **feel** axis (with seaturtle examples)
- `define.experience._.axis=care.path=criti-vs-alter` — deep dive on the **care** axis (with seaturtle examples)
- `define.experience._.metric=boundary-density` — deep dive on the metric to evaluate & prioritize experiences by
- `howto.experience.decompose` — the discovery engine: decompose into dimensions, walk the product
- `rule.require.dimensional-decomposition` — the mandate to decompose (grades the space)
- `rule.require.experience-coverage` — the rule that grades whether the critipaths are demonstrated
- `howto.experience.enumerate` — the actors × feel grid (the two-dimension special case)
- `define.experience._.demo.surf-school` — the worked catalog + case files
- `code.test/frames.behavior/rule.require.given-when-then` (mechanic) — the `[tn]` timeline form
- `code.test/frames.behavior/howto.write-bdd` (mechanic) — how to write the bdd translation
- ergonomist `def.frictionless`, `def.ergonomic`, `rule.require.errors-name-the-fix` — the
  pit-of-success lens a sharp critipath must prove
