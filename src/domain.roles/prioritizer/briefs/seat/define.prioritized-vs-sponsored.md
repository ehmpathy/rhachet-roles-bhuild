# define.prioritized-vs-sponsored

## .what

> **two orthogonal claims live on every priority row. PRIORITIZED = the org wants it.
> SPONSORED = a human authorized their budget on it. one is a judgment of worth; the other is a
> commitment of scarce resource — so the store names both, and sponsored TOPS the rank.**

| | 📊 **prioritized** | ⭐ **sponsored** |
|---|---|---|
| the claim | the org wants this | a human pays for this now |
| who makes it | anyone who grades sev·urg | a human, with budget to give |
| what it costs the claimant | a judgment | review time, cash tokens, compute |
| where it lives | `opine.sev` · `opine.urg` | the `sponsored` flag |
| how it ranks | sev, then urg, then the quants | **above every unsponsored row** |
| how it renders | `p0 · 1d · …` | a ⭐ prefix |

**prioritized** answers *"is this worth the work, and how soon?"* — a claim about the WORK.
**sponsored** answers *"will a human spend their budget on it right now?"* — a claim about the
RESOURCE. the two are independent: a p0 can sit unsponsored while a p2 is sponsored.

## .why they are orthogonal, not a single scale

severity grades the harm if the work never lands — a property of the problem, true whether or
not anyone funds a fix. sponsorship grades whether a human has committed the scarce input a fix
consumes, right now — a property of the moment, true whether or not the problem is severe.

⇒ a p0 stays a p0 when nobody funds it. a p2 a human funds is not suddenly more harmful — it is
merely the one chosen to spend on. fold them into one number and you lose exactly the
distinction a token-capped grove most needs.

## .why sponsored tops the rank

on a grove with a fixed token/compute budget, the scarce input is a human's authorization to
spend, not the org's opinion. a row nobody will fund cannot move however badly the org wants it.

⇒ every sponsored row ranks above every unsponsored one, regardless of sev·urg. a sponsored p2
sorts above an unsponsored p0, because the p2 is the work a human will actually pay to advance
today.

🟡 not a claim the p2 matters more — a claim about SEQUENCE: budget already committed flows
first. the unsponsored p0 stays first in the unsponsored set, ready the moment it is funded.

## .the worked pair

| row | prioritized | sponsored | what the rank does |
|---|---|---|---|
| `urgent-unfunded` | p0 · 1d | no | the org's most-wanted, no budget behind it |
| `funded-p2` | p2 · 1m | ⭐ yes | a human authorized review + tokens on it now |

the store ranks `funded-p2` first. the p0 is not demoted in worth — it heads the unsponsored
set. the ⭐ says *"a human's budget is already on this one."*

## .why sponsored earns a stored column, not a `--why` note

1. **drives the rank** — a query sorts `sponsored DESC`. prose cannot sort.
2. **a per-row toggle, flipped often** — `--sponsor` / `--unsponsor` are one keystroke beside
   `--status`; an omission preserves the prior flag. a prose note drifts.
3. 🔴 **an unmarked sponsored set reads as "the org's top N"** — without the flag, a reader sees
   the opine list and believes the top rows are what a human runs. but the top is what the org
   WANTS, not what a human FUNDED — a clone that picks off that list spends the grove's scarce
   budget on an unauthorized p0 while the sponsored p2 sits unread. the ⭐ makes *"this is the
   funded work"* queryable instead of tribal.

## .the test

> **1. how badly does the org want this, and how soon? → PRIORITIZED (sev · urg)**
> **2. has a human committed their budget to it right now? → SPONSORED (⭐)**

- yes to 2 → mark it `--sponsor`; it tops the rank
- no to 2 → leave it; it ranks on opine alone
- you cannot answer 2 → unsponsored. sponsorship is a positive act, never a default

🟡 *"it is really important"* is a PRIORITIZED claim, not a sponsored one — importance is
severity. the discriminator is whether a HUMAN put their scarce resource on it.

## .the caveat

no line here ranks sponsored work above unsponsored work in worth. an unsponsored p0 is the
org's most important problem; it simply is not the one a human funds this moment. the mandate:
say which is funded, so the grove's scarce budget flows there first, and the unfunded top of the
list is never mistaken for work in flight.

## .enforcement

- priorities displayed with the opine-sorted top read as "work in flight", no regard for ⭐ =
  **blocker** (the silent misread the flag prevents)
- sponsorship inferred from high severity, with no human act behind it = **blocker**
- a `sponsored` claim recorded in `--why` prose instead of the flag = **nitpick** (it cannot
  sort, and it drifts)

## .see also

- `rule.always.render-priorities-as-treestruct` — the ⭐ shows on every node of this render
- `define.invariant.eco.quant-informs-opine` — same shape one level down: a measured number
  informs a judgment, never overwrites it
- the **sponsored** and **prioritized** term clusters — owed, not yet authored; this file is
  the definition until they land
- `define.cost-gain-matrix` — the worth axis sponsorship sits orthogonal to

---

written by human + beaver 🦫
