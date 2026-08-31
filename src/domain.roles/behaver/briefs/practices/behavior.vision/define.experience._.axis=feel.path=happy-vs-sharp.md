# define.experience._.axis=feel.path=happy-vs-sharp

## .what

**happy vs sharp** is the **feel** axis of an experience — what the actor *feels* as they walk
the path.

- a **happy path** — the smooth success. the actor gets what they came for, no snag.
- a **sharp path** — an edge that can cut. a rejection, a limit, a handoff gone wrong — a place
  the actor can get hurt if the behavior does not handle it well.

this is one of the two axes an experience sits on (see `define.experience`). the other is
**care** (critipath vs alterpath — see `define.experience._.axis=care.path=criti-vs-alter`). they are independent:
a happy path can be criti or alter; a sharp path can be criti or alter.

## .why the feel axis matters

a vision that walks only happy paths hides its sharp edges — and sharp edges are where defects
live. the actor who hits an unhandled sharp edge does not get a graceful "no"; they get a stack
trace, a silent no-op, a double-charge, a stranded slot. **feel** forces the author to name the
edges *before* execution, at the vision, where a sharp edge costs a paragraph to handle instead
of a rebuild.

## .a sharp path must fail safe

a happy path just needs to work. a **sharp path carries an extra obligation**: the demo must
show the edge is handled so the actor is **not cut**. a sharp path fails safe when it is:

- **fast** — caught at once, at the boundary, not deep in a call stack
  (`code.prod/pitofsuccess.errors/rule.require.failfast`)
- **loud** — surfaced with context, never swallowed
  (`code.prod/pitofsuccess.errors/rule.require.failloud`)
- **teaches the fix** — the error names the next move, not just the symptom
  (ergonomist `rule.require.errors-name-the-fix`)
- **holds the limit** — at a positive edge, the last valid input still succeeds
- **drops no data silently** — at a seam, a broken handoff is loud, never a quiet data loss

a sharp path demonstrated as *unhandled* — the edge exists, no fail-safe shown — is a gap. the
whole reason to surface a sharp path at the vision is to prove nobody gets cut. this is the
pit-of-success lens: ergonomist `safe-by-default`, `prevent-over-correct`, `errors-name-the-fix`.

> a **sharp critipath** is the load-critical case: a sharp edge a core usecase depends on. demo
> it, and prove it fails safe. a **sharp alterpath** (a sharp edge with a workable fallback) is
> a bonus — name it, but its absence is a nitpick.

## .where sharp edges hide — the hunt

sharp edges do not announce themselves. scan three places to surface them (a finding-aid, not
a taxonomy — the axis is *feel*, not "where"):

| where | the sharp edge | seaturtle example 🐢 |
|-------|----------------|----------------------|
| **rejection** | the first invalid input, the "no" | book a spot that is closed for the season |
| **limit** | the successful edge, the last valid input | grab the *last* open slot before it is gone |
| **seam** | a handoff where one part's output is another's input | the book → realtime site-index update fails mid-book |

## .examples — at the seaturtle surf school 🐢🌊

each goal has a happy path (smooth success) and a sharp path (an edge that can cut). the sharp
path's demo must show it fails safe.

| goal | happy path | sharp path | fails safe by… |
|------|------------|------------|----------------|
| catch a session | book an open slot → confirmation | book a **closed** spot → graceful "no" | naming why + an open spot to try |
| catch a session | book a mid-day slot | grab the **last** open slot → limit holds | the site drops it at once, no double-book |
| pay for the lesson | card charged, receipt shown | card **declined** → clear next step | fast fail + "try another card" |
| sync to the site | book updates the open-slot list | site-index **unreachable** mid-book | book fails loud, no stranded stale slot |
| upload a wave clip | valid clip uploads | file **too large** → named limit | states the max + how to compress |

## .feel is independent of care

do not conflate the axes:

- a **sharp path can be an alterpath** — "search a spot with a typo → did-you-mean". if the
  suggestion breaks, the surfer just retypes. sharp, but a workable fallback exists → alter.
- a **happy path can be a critipath** — "book my spot + tide" is smooth *and* the core route the
  school depends on (an auto-assign to the wrong cove is no fallback for it) → happy critipath.

feel sets the **obligation** (a sharp path must fail safe); care sets the **severity** (a
critipath blocks if absent, an alterpath is a nitpick). you name a feel and a care on every experience.

## .see also

- `define.experience` — the parent frame (feel × care) these two briefs deepen
- `define.experience._.axis=care.path=criti-vs-alter` — the other axis (how much we care)
- `define.experience._.metric=boundary-density` — the metric to prioritize demos by (the guardrail here protects its
  fail-safe requirement inside dense journeys)
- `define.experience._.demo.surf-school` — the worked catalog + cases (a sharp critipath that fails safe)
- ergonomist `def.frictionless`, `def.ergonomic`, `rule.require.errors-name-the-fix` — the
  pit-of-success lens a sharp path must prove
- mechanic `rule.require.failfast`, `rule.require.failloud` — fast + loud, the first two proofs
