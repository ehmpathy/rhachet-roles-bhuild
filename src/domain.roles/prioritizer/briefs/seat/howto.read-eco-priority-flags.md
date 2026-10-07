# howto.read-eco-priority-flags

## .what

`rhx eco.priority get` puts a flag beside a row when the **evidence disagrees with your
judgment** — or when there is no evidence at all. this is how to read each one, and what it
asks of you.

a flag is never a verdict. `define.invariant.eco.quant-informs-opine` holds: a quant informs an
opine, it never overwrites one. each flag below ends the same way — re-judge it, or leave it.
the call is yours.

## .the three flags

| flag | fires when | asks you to re-judge |
|---|---|---|
| 🪃 | `asks` crossed fibonacci rung **3** — reached for 3, 5, 8, or 13 times | **`urg`** |
| ⚖️`+N` | the row climbs **N ≥ 2 places** when re-sorted by cash-per-hour | **`sev`** |
| ❔ | the row carries **no cash figure**, so it can never enter the cash rank | 🔴 no field — warns you the ⚖️ column is BLIND here |

## 🪃 — asked 3+ times

*"a priority this recurrent may have outgrown urg=1m"*

`asks` climbs on every `set` of an extant slug — *"this came up again"* is the event worth a
count.

**evidence of:** recurrence, and a record hard to find — one defect was seeded twice under two
different ids by two reaches that never found each other.

**not evidence of:** how often the defect fired. `asks` counts a human's reach for the record,
not an occurrence of the defect (`term=eco.ask`).

⚠️ fires ONCE per rung, not on every set past it — rung 3 fires at ask 3, stays quiet at ask 4.
4 asks and 5 asks say the same thing; the ladder refuses that false precision, same as the `sev`
scale.

## ⚖️`+N` — the cash rank outranks your sev

*"cash per hour of work outranks the sev you gave it"*

re-sort the opine-ordered rows by `cashPerHour`; a row that climbs two or more places gets the
flag. two, not one — a single adjacent swap is within the noise of any judgment.

**order of checks:**

1. **the inputs first** — is `--gain-for` right? a duration typed `1y` out of habit on a gain
   that lasts `3mo` inflates the total fourfold, and the flag then measures your typo
2. **what cash leaves out** — a p0 that yields little cash per hour may be p0 for a reason cash
   cannot hold: a broken guarantee, a trust cost, a human-waiting gate
3. **only then re-judge `sev`** — or leave it, deliberately

🟡 the 2-place threshold is a guess, untested past a handful of rows. if it fires constantly,
that is a defect in the threshold, not your judgment.

## ❔ — no cash measured, ⚖️ is blind here

🔴 the flag that exists because of an ABSENCE — the one most worth understanding.

a row with no cash figure never enters the cash sort, so it can never earn a ⚖️. unflagged, its
quiet ⚖️ column reads as "evidence agrees" — it means "never measured."

| the row | its ⚖️ column | reader infers | truth |
|---|---|---|---|
| cash measured, rank agrees | quiet | agrees | ✅ correct |
| **cash absent** | **quiet** | **agrees** | 🔴 **no evidence exists** |

⇒ a `term=false-report` — correct about its own question, false about the caller's. and the
bias runs one way: only cash rows can earn a ⚖️, so the mechanism can only ever PROMOTE cash
work. ❔ keeps that absence visible.

### why ❔, not ⚪ (which this repo already uses for "not measured")

| glyph | the absence belongs to | can the reader close it? |
|---|---|---|
| ⚪ `grove` | the **instrument** — no journal access, unreadable | 🔴 no, needs a privilege grant |
| ❔ `eco` | the **human** — nobody entered a figure | ✅ yes — `--gain-cash 'USD …'` closes it |

⚠️ boundary-qualified, never interchangeable — cite as `grove.⚪` and `eco.❔`.

**what to do:** usually naught. ❔ is not a demand for a figure — plenty of real priorities have
no cash story, and to invent one is worse than to leave it blank (a fabricated number is
indistinguishable from a measured one once recorded). ❔ asks only that you not read the quiet
⚖️ column as agreement.

## .the fields that feed the flags

| flag | fed by |
|---|---|
| 🪃 | `asks` — never typed; counted on every `set` |
| ⚖️ | `--gain-cash` · `--gain-per` · `--gain-for` · `--cost-cash` · `--cost-per` · `--cost-for` · `--cost-time` |
| ❔ | the absence of any of the above |

### `per` is how OFTEN · `for` is how LONG

```
--gain-cash 'USD 150.00'  --gain-per 1mo  --gain-for 3mo   →  USD 450.00
--cost-cash 'USD 40.00'   --cost-per 1mo  --cost-for 5y    →  USD 2400.00
                                                     ⇒ net   USD -1950.00
```

a rate alone cannot be totalled — `USD 150.00`/`1mo` is `USD 450.00` over three months,
`USD 9000.00` over five years. the two sides often run different lengths too; no shared window
is owed, since the net subtracts TOTALS, and whole sums compare fine however long each took.

⇒ a defaulted `--gain-for 1y` is the input most likely wrong out of habit, and it feeds ⚖️
directly. check it before you trust a ⚖️.

## .the write semantics the flags depend on

an omitted field PRESERVES. the sentinel `none` CLEARS.

```sh
rhx eco.priority set --slug svc-lessons-acu-floor      # "this came up again"
   └─ asks 1 → 2 · gain, cost, why, refs all survive

rhx eco.priority set --slug svc-lessons-acu-floor --gain-cash none
   └─ the cash is gone · its orphaned --gain-per resets to `once`
```

🔴 a full-field overwrite on the cheapest, most frequent call would delete the whole quant
family — the half that informs an opine — and every flag would fall silent on the rows a human
reaches for most.

## .when

| when… | then… |
|---|---|
| a 🪃 fires | ask whether `urg` still holds. recurrence is evidence a deadline slipped |
| a ⚖️ fires | 🔴 check `--gain-for`/`--cost-for` FIRST. a habit-typed `1y` is the likeliest cause |
| a ⚖️ fires, inputs are right | ask what cash cannot hold, then re-judge `sev` or leave it on purpose |
| a ❔ sits beside a quiet ⚖️ | read it as UNMEASURED, never as agreement |
| you want a ❔ gone | measure it, or leave it alone. 🔴 never invent a figure |
| a ⚖️ fires on nearly every row | the 2-place threshold is a guess — report it, don't re-judge every row |
| you'd re-set a slug to bump `asks` | correct — that IS the verb, and safe |
| you'd retype every field "to be safe" | unnecessary, and how a typo enters the quant family |

## .enforcement

- a flag acted on as a verdict, `sev`/`urg` changed by anything other than a human's deliberate
  call = **blocker**
- a cash figure entered that nobody measured or estimated = **blocker**
- a ❔ row read as agreement = **nitpick**
- `--gain-for` left at its `1y` default on a gain that plainly does not last a year = **nitpick**

## .see also

- `define.invariant.eco.quant-informs-opine.md` — the invariant every flag obeys
- `define.cost-gain-matrix.md` — the 3×2 the quants only partly fill
- `term=eco.ask._.choice._.md` — what `asks` counts
- `term=false-report._.choice._.md` — the family a quiet ⚖️ on a cashless row lands in
- `ecowork.quant.integration.test.ts` — every claim above, as a clamp

---

written by human + beaver 🦫
