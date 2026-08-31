# howto.experience.decompose

## .what

to discover the **full** set of experiences a behavior implies, factor the experience space into
**orthogonal dimensions**, take their **product**, and inspect **every cell** — not just the
handful of paths that came to mind first. each cell that survives is a candidate experience; you
name its feel and its care, and the critipaths fall out of the grid instead of out of memory.

this is the behaver's application of the architect's `howto.dimensional-decomposition` (Fritz
Zwicky's morphological box) to the **experience** space specifically. the technique is old; the
discipline is to actually walk the product.

the behaver refines the architect's three verdicts into four, so a cell's verdict names its
**coverage** or *why* it can't occur: architect `filled` → **demoed** / **itemized** (a real
experience, demonstrated vs merely on record); architect `forbidden` splits into **forbidden** (by
nurture — attemptable, the behavior rejects it) and **impossible** (by nature — no attempt is even
possible). the split matters because a nurture-forbidden path yields a *sharp rejection experience*
to demo, while a nature-impossible one yields no experience at all.

## .why this is the discovery engine — not a nicety

**you cannot claim you considered the critipaths unless you decomposed the space.** a free-listed
set of experiences is a *sample* — you wrote down the paths you happened to think of. samples miss
exactly the paths nobody thought of, and those are where the uncaught critipaths hide. the product
is complete **by construction**: walk it, and no combination can be silently skipped.

so decomposition is not one method among several. it is the **proof of coverage**. the actors ×
feel grid in `howto.experience.enumerate` is the smallest case of it (two dimensions); the real
move is to find *all* the dimensions the wish varies over.

## .the method

1. **name the dimensions.** find the independent axes the experience varies over. each is a small
   closed set of values. common dimensions:
   - **actor** — who encounters it (surfer, admin, `system` / a cron with no human — a legitimate
     value; do not invent a felt actor to fill it)
   - **goal** — what that actor came for (the *same* actor with two goals is two experiences)
   - **path variant** — which route to the goal (specific-book vs auto-assign)
   - **feel-trigger** — happy, or a sharp edge (rejection / limit / seam)
   - **resource state** — the state the behavior acts on (grove: fresh / corrupt / absent)
   - **concurrency / time** — first vs concurrent vs retried; this is the dimension that surfaces
     the non-narratable critipaths (races, eventual consistency) a happy-path list skips
   the axes must be **orthogonal** — a value on one must not imply a value on another. if two
   correlate, they are one axis; if a value spans two concepts, split it.
2. **take the product.** enumerate every tuple across the dimensions. this is the full experience
   space, by construction.
3. **verdict each cell.** every cell is one of four — two for experiences that occur (by how much
   they're covered), two for experiences that cannot (by *why* they cannot):

| verdict | sense | what to do |
|---------|-------|-----------|
| **demoed** | a real experience, demonstrated | name its feel and care; write a `case=N` — critipaths + chosen alterpaths |
| **itemized** | a real experience, on record but not demoed | list it in the inventory — a deliberate skip, not an oversight |
| **forbidden** | can't occur by **nurture** — the actor may attempt it, the behavior must reject it | record *why*; the rejection is a sharp path — demo it if critical. it is an invariant |
| **impossible** | can't occur by **nature** — no attempt is even possible | record it, then set it aside — there is no experience to demo |

4. **read the rest.** the demoed cells are the critipaths you commit to; the rest carry the
   decisions. an **itemized** cell is a path on record you chose not to demo; a **forbidden** cell
   is a rejection the behavior must enforce (an invariant); an **impossible** cell is void by
   nature — noted, then set aside.

## .the payoff — this is what "considered the critipaths" means

- **completeness of consideration** — every combination has a verdict, so a reviewer can see
  none was missed. this is the falsifiable check a free-list cannot offer.
- **the forbidden cells become invariants** — a nurture-barred path, with its reason, is a
  checkable rule the behavior must enforce (a rejection, a safety guard). an **impossible** cell
  needs no guard — nature already bars it.
- **the hidden dimension surfaces** — when a whole row or column cannot occur, two axes were not
  truly orthogonal; a latent dimension hides underneath (the surf example's `skillLevel`). that is
  a domain discovery, straight from the grid.
- **names fall out of the axes** — a cell names itself by its coordinates (`{actor}-{goal}-{feel}`)
  instead of drift ad-hoc.

## .the caveat — consider every cell, demo only the critipaths + chosen alterpaths

the matrix is for completeness of **consideration**, not completeness of **demonstration**. do not
write a demo per cell — that is over-ceremony. the discipline:

- **verdict** every cell (demoed / itemized / forbidden / impossible) — in the inventory
- **demo** only the **critipaths** (required) plus the **chosen alterpaths** (a worthwhile few)
- an itemized cell is a *decision on record*, not a demo you owe

## .where the three artifacts live

decomposition produces three vision-extension files, each with one job:

| artifact | hosts |
|----------|-------|
| `1.vision.experience.dimensions.md` | the **dimensions** — the axes discovered, their values, why each is orthogonal |
| `1.vision.experience.case=_.md` (the inventory) | the **matrix** — the product walked into cells, each verdicted + named (feel · care); forbidden cells = rejection invariants |
| `1.vision.experience.case=N.$slug.md` | one **demo** per critipath + each chosen alterpath (narrative + `[tn]`) |

## .worked example — the beaver camp 🦫

a behavior: a beaver works a grove within a camp (`local:laptop`, `cloud:ec2`). factor it:

    actor          →  {beaver, admin, system-cron}          (3)
    goal           →  {open a grove, restore a grove}        (2)
    resource state →  {fresh, corrupt, absent}               (3)

the box is 3 × 2 × 3 = **18 cells** — far more than "open" and "restore" alone. walk it:

- **demoed** — `beaver × open × fresh` (the happy critipath: every dawn, no fallback that scales);
  `beaver × restore × corrupt` (a sharp path — its care set by `freq × cost`).
- **forbidden** (by nurture) — `beaver × restore × fresh` (restore a grove that is not corrupt: the
  actor *can* run it, but the behavior must refuse to clobber a healthy grove without `--force` →
  a sharp rejection to demo; an invariant).
- **impossible** (by nature) — `beaver × open × absent` (cannot open a grove that does not exist —
  no grove is there to open; void by nature, no experience to demo).
- **itemized** — `admin × restore × corrupt` (possible; deferred — support handles admin restores
  today; on record, not demoed).
- **hidden dimension** — the `system-cron` actor row forces a `has-human?` dimension: a cron
  restore cannot prompt for confirmation, so its sharp edges differ. the grid surfaced a latent
  axis the free-list would have missed.

that latent axis is the whole point: the walk found a critipath (unattended cron restore) that no
one listed, because the *dimensions*, not the author's memory, generated it.

## .see also

- `howto.experience.enumerate` — the actors × feel grid; the two-dimension special case of this
- architect `howto.dimensional-decomposition` — the general morphological-box method this applies
- architect `def.dimensional-decomposition.history.morphological-analysis` — Zwicky's origin + citations
- `define.experience._.axis=care.path=criti-vs-alter` — how to set each cell's care
- `rule.require.dimensional-decomposition` — the mandate + how a reviewer grades the dimensions
- `define.experience._.demo.surf-school` — a worked feel × care catalog
