# rule.require.a-gain-cell-behind-every-sev

## .what

every `sev` must rest on a **named cell** of `define.cost-gain-matrix`. name the row —
`time`, `cash`, or `rank` — and the direction. a `sev` that names no cell rests on taste,
and taste is not an opine; it is a mood.

> **a `sev` is a claim that this matters MORE than its neighbours. name what it buys.**

## .why

`define.invariant.eco.quant-informs-opine` makes `sev` sovereign — the rank is opine-first,
and the store overrules it never. that sovereignty is **earned by the human's judgment**,
and judgment that cannot state its own basis is indistinguishable from a preference.

⇒ so the invariant that protects `sev` from the quants is exactly what obliges `sev` to
carry a reason. **an opine that answers to no evidence AND names no basis answers to
naught.**

and the cost is real and one-directional: a rank is a **queue**, so every row promoted on
taste demotes a row with a stated basis. the harm lands on work nobody argued against.

## .the test

> **"what does this buy us, and in which row?"**

| the answer | verdict |
|---|---|
| *"it saves ~4h a week of re-derivation"* | ✅ `gain.time` |
| *"it stops a ~USD 300/mo bleed"* | ✅ `gain.cash` |
| *"a tool that returns a silent false negative taxes trust in every tool"* | ✅ `gain.rank` |
| *"it removes a gate a human waits at"* | ✅ `gain.time`, and often `gain.rank` too |
| *"it bugs me"* · *"it feels wrong"* · *"we should really…"* | 🔴 **no cell. not a `sev`** |
| *"it is obviously important"* | 🔴 no cell. **obvious** is what a basis sounds like once you stop to check it |

⚠️ **the bar is a NAMED cell, never a MEASURED one.** a gain you can name and cannot count
is fully legitimate — that is what ❔ marks, and `howto.read-eco-priority-flags` is explicit
that a figure you invent is worse than a blank. name the row; leave the number empty.

| when… | then… |
|---|---|
| you would set a `sev` and the `--why` is empty | 🔴 the cue. write the cell first, then the `sev` |
| the only case you can make is *"it annoys me"* | 🔴 real, and it is an `urg` signal at best. not a `sev` |
| you reach for `cash` and find none | ask `time` and `rank` before you demote (`rule.forbid.sev-from-cash-alone`) |
| you can name a cell and cannot put a figure on it | ✅ correct and common. name it, leave the cash blank, take the ❔ |
| you are tempted to put a figure on it anyway | 🔴 **never invent one.** a fabricated number is indistinguishable from a measured one once it is on the record |
| every row in the rank is `p0`/`p1` | the basis test has lapsed. a rank where all rows lead is no rank |

## 🔴 .the `--why` field IS the enforcement surface

`eco.priority set` carries `--why`, and this rule is what it is for. a `--why` that
restates the `--what` records naught:

```
👎  --what 'grepsafe --glob matches basename'
    --why  'it is broken'            ← restates the what. names no cell

👍  --what 'grepsafe --glob matches basename'
    --why  'gain.time — every path-glob search returns a false `0 matches`, exit 0,
            so a reader cannot part a true absence from a missed one and re-derives
            by hand. gain.rank — a tool that lies silently taxes trust in every tool.'
```

⇒ the second one is checkable by a later reader. the first one is a mood with a slug.

## ⚠️ .the bound — a basis is not a justification of the LEVEL

this rule demands a named cell. it does **not** demand that the cell justify `p0` over
`p1`. how far a given gain moves a row is precisely the judgment `sev` exists to hold, and
no rule can compute it — that is `define.invariant.eco.quant-informs-opine` at work.

⇒ so: **a cell is the floor, never the verdict.** the floor keeps noise out of the queue;
the human still ranks what clears it.

## .enforcement

- a `sev` set with a `--why` that names no cell of the 3×2 = **blocker**
- a `--why` that restates the `--what` = **blocker** (it records no basis)
- a cash figure invented to satisfy this rule = **blocker** (it enters the ⚖️ rank as though
  it were evidence — `howto.read-eco-priority-flags`)
- a named gain with no measured figure = **correct**, never a violation. that is what ❔ is for
- a rank whose rows are near-uniformly `p0`/`p1` = **nitpick** (the floor has lapsed)

## .see also

- `rule.forbid.sev-from-cash-alone.md` — the peer. that one forbids too narrow a basis;
  this one forbids none at all
- `define.cost-gain-matrix.md` (role=supervisor) — the 3×2 a cell is named from
- `define.invariant.eco.quant-informs-opine.md` — the sovereignty this rule is the price of
- `howto.read-eco-priority-flags.md` — ❔, and why a named-and-unmeasured gain is honest
- `term=eco.opine._.choice._.md` — what an
  opine is, and why it is a judgment rather than a mood

---

written by human + beaver 🦫
