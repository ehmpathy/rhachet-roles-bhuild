# lesson: experience vocabulary — term choices & rejected candidates

## .what

the name decisions behind the **experience** vocabulary in the behaver role's
`behavior.vision` practice (`define.experience` and its deep-dive briefs). this is a
curation lesson for whoever tends that vocabulary — it records what we chose, what we
rejected, and why, so the choices are not re-litigated.

it is a this-repo author's note, not a shipped brief. the consumer-side definitions live in
`src/domain.roles/behaver/briefs/practices/behavior.vision/`.

## .the vocabulary we chose

an **experience** is an actor's lived encounter with a behavior. it sits on **two independent
axes**, plus one evaluation metric:

| concept | term | pole values / form |
|---------|------|--------------------|
| axis 1 — what the actor feels | **feel** | happy · sharp |
| axis 2 — how much we care | **care** | critipath · alterpath |
| evaluation metric (not an axis) | **boundary-density** | dense · sparse |

- **feel**: `happy` (glides to success) vs `sharp` (hits an edge that can cut).
- **care**: `critipath` (high severity — a core usecase leans on it) vs `alterpath` (low
  severity — a break is cheap to absorb). care is **computed**, not vibed: `severity = freq ×
  cost` (how often × the per-incident recovery cost). the file names the **axis** and its two
  **paths** — `define.experience._.axis=care.path=criti-vs-alter` — with severity as the engine
  discussed inside, not the axis name.
- **boundary-density**: how many of the behavior's boundaries one experience exercises — a
  metric to prioritize demos, deliberately *not* a third axis.

## .the cell verdicts — a refinement of the architect's three

when the decomposition walks the product, each cell gets a **verdict**. the architect's
`howto.dimensional-decomposition` offers three (`filled` / `gap` / `forbidden`). the behaver
refines them into **four**, because the behaver cares about two things the architect's abstract
verdicts blur: **coverage** (is a real experience demonstrated, or just on record?) and **why a
non-experience can't occur** (which decides whether a guard is owed).

| architect | behaver | sense |
|-----------|---------|-------|
| `filled` | **demoed** | a real experience, demonstrated with a `case=N` (critipaths + chosen alterpaths) |
| `filled` / `gap` | **itemized** | a real experience on record in the inventory, deliberately not demoed |
| `forbidden` | **forbidden** | can't occur by **nurture** — the actor may attempt it, but the behavior rejects it → a fail-loud invariant (its rejection is often a sharp critipath to demo) |
| `forbidden` | **impossible** | can't occur by **nature** — no attempt is even possible → no experience, no guard owed |

- **`filled` is dropped.** it conflated existence with coverage. a real experience is either
  **demoed** or merely **itemized** (a demoed cell is also itemized — "both" — so we label by the
  higher coverage). the behaver's whole point is coverage, so the verdict must name it.
- **`gap` → `itemized`.** the architect's "valid but unbuilt" is, in behaver terms, just a cell
  put on record without a demo — no separate word needed.
- **`forbidden` splits into `impossible` (nature) + `forbidden` (nurture).** the distinction is
  load-central for the behaver: *nurture*-forbidden cells yield a **sharp rejection experience** to
  demonstrate (a guard the execution must hold); *nature*-impossible cells yield no experience at
  all. the architect did not split because it modeled a *feature* space, not an *experience* one.
  the behaver↔architect map lives in `howto.experience.decompose` so the lineage stays legible.

## .rejected candidates — and why

### `edge` / `edgepath` — rejected (ambiguous across *both* axes)

the load-critical rejection. "edge" reads as a value on *both* axes at once, so it collapses
the independence the feel × care split exists to protect:

| sense of "edge" | maps to | axis |
|-----------------|---------|------|
| "an edge that can cut" | sharp | feel |
| "an edge case / peripheral" | alter | care |

a reader who meets `edgepath` cannot tell which axis it names. two further traps: "edge case"
is the exact misread we reject for alterpath (an alterpath is a fallback path, not a rare
peripheral one), and "edge" smuggles in a frequency read (rare), when criticality turns on a
**fallback**, not frequency. this is `rule.forbid.ambiguous-labels` (ergonomist) — one name,
one sense.

> **note:** `boundary` legitimately means "an edge where the system's response changes" — that
> use is fine and load-central (see `define.experience._.metric=boundary-density`). the rejected use is "edge" as
> the label of a **path** or an axis value.

use instead: `sharp path` (the feel edge), `alterpath` (the care fallback path), `boundary`
(the coverage target). the "not an edge case" note ships inline in
`define.experience._.axis=care.path=criti-vs-alter`.

### `crierpath` → replaced by `alterpath`

`crier` ("a surprise failure that makes someone cry") needed a gloss on every use — opaque on
first read. `alter` is self-evident: an **alter**nate path, the *other* route, which names
*why* it is non-critical (a fallback exists). kept the `-path` rhyme with `critipath`.

### `corepath` — considered, not adopted (kept `critipath`)

`corepath` was a real contender for `critipath`: it dodges the project-management overload of
"critical path" (the longest dependency chain) and echoes our own phrasing ("a *core usecase*
depends on it"). we kept `critipath` for continuity, but `corepath` remains the fallback name
if the pm overload ever bites.

### `freq` — rejected as the care axis *name* (but it is an input)

frequency is **half** of care, not the whole of it: `severity = freq × cost`. so freq does not
*name* the axis — a critipath can be rare (a once-a-year recovery path whose break cannot recover:
low freq, but cost → ∞) and an alterpath can be frequent (a common shortcut with a costless
fallback: high freq, but cost ≈ 0). the axis is named `care` because it is the **product**, not
either factor alone. (this refines an earlier note, "fallback decides care, not freq" — closer
is: *the fallback's cost × the frequency* decides care. "escalate to support" is always a
fallback, so its cost, times how often you pay it, is what matters.)

### `positive` / `negative` / `seam` — demoted from taxonomy to hunt-aid

these name the *machine's* decision points, not the *actor's* lived encounter — engineer
vocab, not experience-native. and they straddle the axes the same way "edge" does. they
survive only as a **hunt-aid** inside `howto.experience.enumerate` (scan the rejection, the
limit, the handoff to *find* sharp paths), never as a path taxonomy.

## .the one-name principle

one name, one axis. a term that reads as a value on more than one axis is rejected, because it
collapses the independence of feel × care. when a candidate feels "tidy" but straddles (like
`edge`'s core/periphery symmetry), that tidiness is the smell.

## .see also

- `rule.require.slug-promise-format` (this repo) — the peer name convention for self-review slugs
- ergonomist `rule.forbid.ambiguous-labels` — the general one-name-one-sense rule this applies
- behaver `define.experience`, `define.experience._.axis=feel.path=happy-vs-sharp`, `define.experience._.axis=care.path=criti-vs-alter`,
  `define.experience._.metric=boundary-density` — the shipped definitions these choices produced
