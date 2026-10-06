# define.eco.rock-taxonomy

## .what

work rolls up into a small set of **mainquest roots**, one per org-level objective. each root is
an `org.rock` slug (dot-joined); initiatives nest beneath it as subrocks (a slash-joined path).

| root | drives | org | pattern |
|---|---|---|---|
| `sandpine.decost` | cost **down** | sandpine (the product) | **de**-cost |
| `sandpine.ensell` | revenue **up** | sandpine (the product) | **en**-sell |
| `rhachet.entool` | the tool **up** | rhachet (the tools) | **en**-tool |

`de-` cuts, `en-` builds.

## .the org split is the point

`decost`/`ensell` are **sandpine** — the product business. `entool` is **rhachet** — the tools
that build every business. a tool improvement is not sandpine product work; it belongs to the
tool's own org. the root's org prefix answers: whose objective does this serve — the product, or
the tools that build it?

## .how work nests

root → initiative → build piece, as a subrock path:

```
bigrock://sandpine.ensell                                           the revenue mainquest
subrock://sandpine.ensell/book-a-lesson                              an initiative under it
subrock://sandpine.ensell/book-a-lesson/spot-forecast-widget     a build piece
```

root is dot-joined; path is slash-joined — the boundary a rollup needs to split root from child
(`define.eco.rock-lifecycle-and-treestruct`).

## .kind is per-root, and flips

a root wears a kind — bigrock (mainquest) or altrock (sidequest) — a state, not an identity; it
flips over the rock's life. `sandpine.decost`/`sandpine.ensell` are bigrock now; `rhachet.entool` is
usually altrock, a sidequest to the product. a subrock names its root's SLUG, never its KIND, so
a promotion is one edit on the root row.

## .the route-efficiency case — an altrock that blocks a timeline

`subrock://rhachet.entool/route-efficiency` is, by decomposition, an altrock — a tool sidequest
off the product main line. but it currently gates every bigrock: the grove is
concurrency-capped by token budget, and this work cuts the spend that caps it — until it lands,
no bigrock runs at full concurrency.

that is an orchestration edge, never a rootstruct promotion. route-efficiency is not *part-of*
decost or ensell; it **gates** them. it stays an altrock in the tree; its p0 opine reflects its
current blocker-to-concurrency status, not a change of kind — a rhachet altrock that gates
sandpine bigrocks, an edge decomposition can never draw since a piece belongs to exactly one whole.

the built `--gates`/`--gated-by` edge doesn't fit here — the block applies to concurrency (a
global cap), not any one row it must precede, and no slug stands for "every bigrock's grove
presence." so the block stays expressed as the p0 opine plus `--why` prose on each
route-efficiency row, and relaxes back to the altrock's natural sev once the cap lifts.

## .see also

- `define.eco.rock-lifecycle-and-treestruct` — the root/path shape, and the kind lifecycle
- `define.eco.decomposition-vs-orchestration` — the two structures this case lives in
- `define.invariant.eco.quant-informs-opine` — the rank a root filter narrows, never reorders

---

written by human + beaver 🦫
