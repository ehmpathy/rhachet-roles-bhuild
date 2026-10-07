# define.eco.rock-lifecycle-and-treestruct

## .what

a **rock** is an objective a priority serves. `eco.priority --goal` holds one, as a uri:

```
bigrock://sandpine.decost                        🪨 the MAINQUEST
altrock://dev-ergonomics                       🪶 the SIDEQUEST
subrock://sandpine.decost/acu-tune               🧩 a DECOMPOSITION
subrock://sandpine.decost/acu-tune/query-audit   🧩 …nested as deep as it needs
```

two facts drive the shape:

1. a rock is a **tree** — a root, with a decomposition beneath it of any depth
2. a root rock's **kind is a state, never an identity** — it flips main↔side at any moment

## .the invariant

> **a subrock names the root's SLUG. it never names the root's KIND.**

this is not a preference — it follows from fact 2. if a child encoded its root's kind, a
promotion (a one-field edit on one row) would become a rewrite of every descendant, and the
rewrite would grow with the tree. a lifecycle expected to fire cannot cost more each time it does.

```
altrock://sandpine.decost   ──promote──▶   bigrock://sandpine.decost
  subrock://sandpine.decost/acu-tune             ← untouched
  subrock://sandpine.decost/acu-tune/query-audit ← untouched
```

one row, one field, no descendant edited, at any depth.

## .the lifecycle

| from | to | when |
|---|---|---|
| 🪶 altrock | 🪨 bigrock | a sidequest earns the main line |
| 🪨 bigrock | 🪶 altrock | a mainquest we stop to defend, but still intend |
| either | 🧩 decomposed | it grew large enough its parts deserve their own rows |

all three are cheap on purpose — a queue whose objectives cannot be re-graded lies within a
month.

⚠️ `bigrock://foo` and `altrock://foo` are the **same rock in two lifecycle states**, never two
rocks. a human who coins one slug for two objectives repeats the same error as two priorities
with one slug.

## .the treestruct

```
                bigrock://sandpine.decost              ← the ROOT. kind lives here, and only here
                         │
        ┌────────────────┴────────────────┐
subrock://…/acu-tune              subrock://…/sms-tune
        │
subrock://…/acu-tune/query-audit
```

| part | what it is | who reads it |
|---|---|---|
| **scheme** | the kind — `bigrock` · `altrock` · `subrock` | a human, to know which quest |
| **authority** | the ROOT SLUG — identical on the root and every descendant | the trace |
| **path** | the decomposition — `acu-tune/query-audit` | the tree walk |

these ride derived on every row (`goalKind`, `goalRoot`, `goalPath`) — no caller splits a
string. `goalRoot` reads the same from the root and every subrock, whatever kind the root wears
today — which is what makes the lifecycle free.

the separator is `/`, never `.` — a root slug already holds dots (`sandpine.decost`), so a
`.`-joined child could not be split back into root + path. a uri path IS the tool for this: the
authority is the root, the path is the decomposition, and a split on `/` yields the tree.

## .a filter ROLLS UP

> `get --goal <uri>` returns that goal AND every subrock beneath it.

a decomposition that does not roll up is no decomposition. an exact match on
`bigrock://sandpine.decost` would return the root alone and omit every row that does the actual
work, while a count reports complete.

the rollup keys on the root slug, never the scheme — a subrock does not know which kind its root
wears today, so a scheme-keyed match would break on the one edit it must survive by design.

## .the shapes the store refuses

| input | why |
|---|---|
| `sandpine.decost` | bare — records no KIND |
| `bigrok://sandpine.decost` | scheme outside the closed set — silently splits the goal in two |
| `subrock://sandpine.decost` | a decomposition of naught is not a decomposition |
| `bigrock://x/y` | a root that claims a path claims to be someone's child |

⚠️ the bare form is refused on the filter too: a bare filter matches no row, so it exits `0`
with an empty set — reads as "no priority serves that objective" when it means "wrong shape."

## .the kind is a LENS, never a sort key

a `p1` altrock outranks a `p2` bigrock, and that is correct — `sev` already asks "how bad if
unfixed," so a human who graded a sidequest `p1` meant it. to let a categorical label reorder
would smuggle a sort key past `define.invariant.eco.quant-informs-opine`. the goal narrows the
set; it never promotes a row within it.

## .what would overturn the invariant

- a root rock kind provably immutable — then a child could safely name it
- a store that can rewrite every descendant atomically and cheaply — weakens, never vanishes:
  a rewrite still breaks any external reference to the old uri

## .enforcement

- a subrock uri that encodes its root's KIND = **blocker**
- a goal filter that matches exactly rather than rolls up = **blocker**
- a rollup keyed on the scheme rather than the root slug = **blocker**
- a bare goal value accepted anywhere = **blocker**
- `bigrock://foo` and `altrock://foo` treated as two rocks = **blocker**
- the kind used as a sort key = **blocker**

## .see also

- `define.invariant.eco.quant-informs-opine.md` — why the kind may not reorder
- `rule.forbid.sev-from-cash-alone.md` — the goal is the axis a cash rank cannot see
- `rule.require.a-gain-cell-behind-every-sev.md` — a goal is not a basis; it still owes a cell
- `howto.read-eco-priority-flags.md` — 🪃 · ⚖️ · ❔, and what each is evidence of
- `term=partial-audit._.choice._.md` — the shape an exact-match rollup would produce

---

written by human + beaver 🦫
