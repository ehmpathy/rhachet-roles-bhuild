# define.eco.goal-slugification

## .what

how to shape the **path** half of a goal uri — the part after the root slug.
`define.eco.rock-lifecycle-and-treestruct` settles the scheme (which kind) and the authority (the
root slug, the trace); this brief settles what the path's segments are made of.

```
subrock://sandpine/entool/coachbook/wt1.1-cert-ingest/entool/sql-dao-generator-gate-a
          └─ root ─┘ └─ slice ──┘ └─ the work it funds ─────────┘
           WHO owns  WHEN it runs  WHAT it paid for
```

## 1. a goal path records PROVENANCE, never LOCATION

> the path answers "where did this need come from, who funds it?" — never "which repo does the
> work happen in?"

a slice can surface upstream defects whose fixes land in repos it does not own. the fund
boundary is the real boundary: a repo boundary is an implementation detail of where source files
sit, a fund boundary is a decision about what a budget buys — only the second is a fact about
priority.

| path records LOCATION | path records PROVENANCE |
|---|---|
| one row per repo touched — the slice fragments across N roots | one subtree, one owner, one budget |
| rollup answers "what lives in repo X" — git already answers that | rollup answers "what does this slice still need" — no other instrument does |
| a fix that serves two repos has no home | hangs under whoever paid to discover it, until a second payer appears |

the store already has a field for location: `--ref-tree`. the goal uri that holds it too would be
a second, drifting copy.

## 2. stamp an ordinal slice with its ordinal, at the front

when a rock decomposes into slices that run in ORDER, the slug leads with the ordinal —
`wt1.1-cert-ingest`, never `cert-ingest` — because the rendered list sorts alphanumerically
and a reader who scans it should see the sequence with no second lookup.

the ordinal is **borrowed, never coined** — from the decomposition that minted the slices. an
ordinal invented at the keyboard records no real order and sorts by accident.

⚠️ applies to ORDERED slices only. genuinely parallel parts get no stamp.

## 3. work you FUND but do not OWN nests under `<slice>/entool/`

an upstream fix your slice needs, in a repo your slice does not own, hangs under an `entool`
container inside the slice that pays for it:

```
wt1.1-cert-ingest/
├─ dao-type-reverts        ← OUR code, a plain child
└─ entool/                 ← the fund boundary
   ├─ sql-dao-generator-gate-a
   └─ domain-objects-metadata-open-issues
```

test: whose repo does the edit land in? ours → plain child. someone else's → under `entool/`.

### the promotion path — what makes law 1 safe

objection: if a second consumer hits the same upstream defect, it files its own row, and the
store can no longer say "one release unblocks two objectives." true — and not a reason to
pre-empt. **a second consumer is the signal to promote, not a reason to structure for one that
does not exist** (`rule.prefer.wet-over-dry`). the reversal is cheap: `goal.mv` cascades over the
whole subtree in one command, and `--gates`/`--gated-by` key on slug rather than goal, so every
dependency edge survives a promotion untouched. that is why `entool` is one container per slice,
not one per tool — the promotable unit is "the tool debt this slice funded."

## 4. every rung above must exist as a row

`asSurgoals` returns the immediate parent only, and the store enforces it — the destination's
parent must already be declared. so depth costs rows, and each row costs a human-authored
sev/urg (`rule.forbid.fabricated-opines`); a container has no independent severity, so its opine
is a placeholder. keep the tree shallow: put the discriminator in the LEAF slug, not in another
rung — `entool/sql-dao-generator-gate-a` costs one container, `entool/sql-dao-generator/gate-a`
costs two and buys only a tidier split.

## 5. `entool` means two things by position — unsettled

| position | what it is | may it be a row? |
|---|---|---|
| after the org root — `sandpine/entool/coachbook` | a **concern** that splits an org's rocks | never — the org's own root-kind list forbids it |
| mid-path — `wt1.1-cert-ingest/entool/…` | a **fund boundary** owned by one slice | must be, or the FK refuses |

one word, two senses. the senses are genuinely different concepts and position disambiguates
mechanically, but this is a fulcrum taken under time pressure, not a settled call. rejected
alternatives: drop the segment (loses the named fund boundary); coin a distinct word (`funded/`,
`upstream/` — unambiguous, but a new term to defend). repair, if overturned: one `goal.mv` plus
this section.

## .enforcement

- a path segment that names a repo rather than a slice or fund boundary = **blocker** (`--ref-tree`'s job)
- an ordered slice with no ordinal stamp = **nitpick**
- an invented ordinal, not borrowed from the minting decomposition = **blocker**
- upstream work filed as a peer of the slice that funds it, not under its `entool/` = **nitpick**
- a container row minted at a depth its own leaves did not need = **nitpick**
- a duplicate upstream row under a second consumer, with no promotion = **blocker**

## .see also

- `define.eco.rock-lifecycle-and-treestruct` — the scheme and authority halves this completes
- `sandpine-notebook`'s `define.eco.rocks.sandpine` — the root that forbids `entool` as a row (out-of-package)
- `define.invariant.eco.quant-informs-opine` — why a container's opine is a placeholder
- `rule.forbid.fabricated-opines` — the cost of every extra rung
- `rule.prefer.wet-over-dry` (ehmpathy/architect) — wait for the second consumer

---

written by human + beaver 🦫
