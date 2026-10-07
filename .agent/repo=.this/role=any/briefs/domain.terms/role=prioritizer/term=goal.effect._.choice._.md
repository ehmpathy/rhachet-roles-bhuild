# domain.term: goal.effect

term.chosen   = effect
term.kind     = noun
term.boundary = goal
term.values   = solve | clamp
term.synonyms.forbidden:
- kind          (TAKEN on a goal — big / alt / sub is the rock kind)
- type          (`rule.prefer.kind-over-type`, and `kind` is taken anyway)
- category
- phase
- stage

## .what

**what a goal does to the gain.** every goal is exactly one of two:

| value | it | the gain |
|---|---|---|
| **solve** | stands between you and the money | **creates** it |
| **clamp** | stands behind the money, holds it shut | **keeps** it |

```
solve   the work you must finish BEFORE the gain arrives
clamp   the work you spend AFTER it, so it does not leak back
```

## 🔴 .why it is a stored dimension and not a note

**the two divide by different denominators**, so a store that cannot tell them apart cannot
rank. this is the whole reason the word exists:

```
work.to-gain(goal) = work.own + Σ work.to-gain(child)   over SOLVE children only
work.total(goal)   = work.own + Σ work.total(child)     over ALL children
```

⇒ **the ⚖️ flag divides by `to-gain`.** it asks whether the cash-rate outranks the sev you
gave — and a clamp's hours are not in that race, because they are not what you wait through.
`work.total` answers a different question: what does this line cost me in full.

⚠️ **charge a clamp's hours to `to-gain` and you understate the rate; omit the clamp from
`total` and you understate the bill.** both figures are owed, and one column cannot be both.

## .the measured case

`twilio-tune`, 2026-09-13. own 3h (the template repairs) · a **solve** child at 5h (the audit
that finds them) · a **clamp** child at 8h (the alert that holds them).

| denominator | value | $/hr on USD 1200 | rank |
|---|---|---|---|
| own work only — what the store rendered | 3h | 400.00 | **#1** ⚖️+2 |
| all children summed | 16h | 75.00 | tied last |
| 🔴 `to-gain` — own + solve children | **8h** | **150.00** | **#2** |

the first was the store's **first ever ⚖️ flag**, and it was a false positive: the denominator
lacked 13h of the row's own decomposition. the second over-corrected — it charged the clamp.
only the third answers the question the flag asks.

⇒ and the error direction is the dangerous one. an absent rollup always makes a parent look
**cheaper than it is**, so a decomposed goal inflates its own ratio — and a goal is decomposed
precisely when someone has thought hardest about it. **the better-understood a row is, the
more the render flatters it.**

## ⚠️ .`solve` is WIDER than "repairs"

the wisher's phrase was *"solves = repairs immediately"*. that read leaves the twilio **audit**
unclassifiable: it measures where the waste is and repairs naught.

⇒ so `solve` is settled by **position**, never by act: *is this work on the path to the gain?*
a scout that finds the defect is on that path as surely as the repair that closes it. you
cannot fix what you have not found.

| the goal | repairs? | on the path? | effect |
|---|---|---|---|
| the twilio **audit** — finds the waste | no | ✅ | **solve** |
| the twilio **tune** — drops the emoji | ✅ | ✅ | **solve** |
| the twilio **alert** — catches the next emoji | no | no | **clamp** |

🟡 **open: does `scout` earn a third value?** find / fix / hold is a real three-step and the
store may want it. it earns no value today because the **arithmetic needs two buckets** and a
scout's hours sit in the same one as a repair's. left wet (`rule.prefer.wet-over-dry`) until a
reader needs the split for a question the two cannot answer.

## .the test

> **"if this goal never happened, would the money still arrive?"**

- **no** — the gain does not exist without it → **solve**
- **yes, and then it would leak back** → **clamp**

⚠️ the test is about the **gain**, never about the artifact. a CI check is usually a clamp and
sometimes a solve — a check that unblocks a stuck release is on the path.

## 🔴 .a clamp's gain is a RANK signal and never a TOTAL

a clamp holds money somebody else freed. so it inherits that figure for the purpose of
**order** — a clamp on a USD 1200 line genuinely outranks a clamp on a USD 12 one — and to add
it into a portfolio total double-counts the same money.

⇒ the same discipline `define.invariant.eco.gain-propagates-down-and-sums` open question 2
already imposes on every propagated figure. a clamp is the sharpest instance: its `gain.own`
is **zero by construction**, so every cash figure on it is inherited.

## .the boundary relation to `term=clamp`

`term=clamp` (this repo, flat) declares *"a **test** whose job is to hold a repaired defect
shut"* — a species. this is the same concept at the **goal** grain, and it is wider: the twilio
alert delivers a CI check (a `test.clamp`) **and** a runtime raise, which that cluster
explicitly rejects as *"a canary."*

⇒ one concept, two boundaries — never an overload. the genus/species question is open and filed
as a dated dispute in `term=clamp._.choice.reason.md`, 2026-09-13.

## .refs

- `.agent/repo=bhuild/role=prioritizer/skills/work/ecowork.sh` — the store this dimension lands on
- `src/stream/2026.Q3/2026-09-13.dispatch.repo=svc-notifications.behavior=twilio-waste-alert.wish.md`
  — *"this row does not ADD to it — it **holds** it"*: the concept, found in prose before it had a word

## .reason

see `term=goal.effect._.choice.reason.md` — the rejected `kind`, the name fulcrum, and the
wisher's words verbatim.

---

written by human + beaver 🦫
