# domain.term.choice: experience

## .what

an **experience** is an actor's lived encounter with a behavior. it sits on two independent axes,
plus one evaluation metric.

```
term.boundary = behavior       # "an experience, of WHAT?" → of a behavior
```

🟡 **`behavior` is a boundary this glossary names but has not yet declared** — see the `.readme.md`
gap census. the boundary is right; its own cluster is owed.

## .the cluster

| term | kind | canonical values | what |
|------|------|------------------|------|
| `experience` | noun | — | an actor's lived encounter with a behavior |
| `feel` | noun — axis 1 | `happy` · `sharp` | is there an **edge** the behavior must guard? |
| `care` | noun — axis 2 | `critipath` · `alterpath` | `severity = freq × cost` — intolerable, or deferrable |
| `boundary-density` | noun — metric | `dense` · `sparse` | how many boundaries one experience exercises. **not** a third axis |
| the cell verdicts | noun | `demoed` · `itemized` · `forbidden` · `impossible` | the coverage verdict a walked cell carries |

## .forbidden synonyms

| forbidden | canonical | one-line |
|-----------|-----------|----------|
| `edgepath` | `sharp path` / `alterpath` | straddles both axes — see `.reason` |
| `crierpath` | `alterpath` | opaque; needed a gloss on every use |
| `corepath` | `critipath` | kept for continuity, not for correctness — a live fallback name |
| `freq` (as the axis name) | `care` | freq is **half** the product, never the whole |
| `positive` / `negative` / `seam` (as a taxonomy) | `sharp` | machine-side vocab; survive only as a hunt-aid |
| `filled` (as a verdict) | `demoed` / `itemized` | conflated existence with coverage |
| `gap` (as a verdict) | `itemized` | a cell on record with no demo |
| `hazard` (as the feel discriminator) | `edge` | 🔴 **disputed and closed 2026-09-05** — see `.reason` |

## .the one-name principle

one name, one axis. a term that reads as a value on more than one axis is rejected, because it
collapses the independence of feel × care. when a candidate feels *tidy* but straddles, that
tidiness is the smell.

## .refs

- behaver `define.experience` — the parent frame
- behaver `define.experience._.axis=feel.path=happy-vs-sharp` — axis 1
- behaver `define.experience._.axis=care.path=criti-vs-alter` — axis 2
- behaver `define.experience._.metric=boundary-density` — the metric
- behaver `howto.experience.decompose` — the behaver↔architect verdict map
- `term=behavior.experience._.choice.reason.md` — etymology, disputes, evidence
