# domain.term: crew.status

term.chosen   = status
term.kind     = noun
term.boundary = crew
term.synonyms.forbidden:
- health
- condition
- phase
- verdict
- disposition

## .what

**whose move it is.** one word per crew that names the party who owes the next act, and
therefore what a supervisor does with the row.

```
🚦 status — 8 inflight · 5 blocked:on-human · 2 blocked:on-defect · 12 frozen
```

## 🔴 .it is NOT `crew.state` — the two answer different questions

this is the distinction the word exists to hold, and the one a reader will collapse if it is not
stated first:

| term | asks | values |
|---|---|---|
| `crew.state` | **is a clone alive?** | `at work` · `down` · `asleep` · `phantom` |
| **`crew.status`** | **whose move is it?** | the six below |

⇒ a crew can be `at work` and `frozen` at once, with no contradiction: a clone is alive and
nobody waits on it. so `status` is **not** a rename of `state`, and neither may stand in for the
other.

## .the value set — five, plus one non-status

| value | who acts | what it means |
|---|---|---|
| `inflight` | nobody | at work — mid-turn, or a lane in review |
| `blocked:on-supervisor` | the supervisor | a modal. **one keystroke** |
| `blocked:on-human` | a human | stone approval, commit quota, release auth, a credential |
| `blocked:on-defect` | the supervisor | the driver's ✋ — converge, or let it stand terminal with a record |
| `frozen` | the supervisor | still, and nobody waits on it — a husk, an orphan, a drift |
| `unread` | — | 🔴 **we could not look.** not a state claim at all |

## 🔴 .why `blocked` alone is forbidden — the OWNER is the whole content

`blocked` names a halt and says naught about the cure, and the cures have **different owners,
two of whom are different people.** a fleet row that reads `blocked` sends every halt to one
queue, where the supervisor-owned ones stall behind the human-owned ones.

⇒ so the qualifier is not a refinement of `blocked`. **it is the term**; `blocked` is the genus.

## ⚠️ `unread` is a claim about the READ, and must never fold into `frozen`

an unreached grove never had its activity measured, so to call it idle asserts a fact from a
failed read. that is the exact false report `term=asleep` exists to refuse, and this enum would
re-import it under a new word.

⇒ `unread` is carried in the set so the reader is never handed a total that silently excludes
what the sweep could not see (`term=partial-audit`).

## 🔴 .the `👋` glyph cannot decide the owner — the WORD must

the stone renders `👋` for two unrelated halts:

| the stone says | who clears it |
|---|---|
| `judge, approved? 👋` | **a human** — no supervisor lever touches it |
| `l3@iNNN, exhausted 👋` | **the driver** — converge, or record what was tried and let it stand |

so `exhausted` is tested **before** `👋` in the derivation, or a spent budget renders as a human
gate and waits on a person who cannot clear it.

🔴 **and since 2026-09-15 the poll no longer PASSES that `👋` through.** the table above describes
what the **route** prints — the derivation's input — and that is unchanged. what changed is the
render: `__crew_stone_owner_glyph` (crewwork) re-assigns the halt glyph from its OWNER, so
`exhausted 👋` reaches a reader as `exhausted 🌙` while `approved? 👋` passes untouched.

⇒ the two halves now agree. the **status** was routed by the word (the row above); the **glyph** a
reader actually sees was not, so a correct status sat beside a marker that pointed at a human for a
lever no human owns (task #88 — the measured case is `feat-prescribed-brain-per-stone`, whose
driver had already spent the lever the 👋 asked a human for).

⚠️ 🌙 is no coinage — it is the form the route itself already prints for a spent lane, so the
render adopts an extant glyph rather than one we mint.

⚠️ **the cure in that second row changed on 2026-09-07; the DERIVATION ORDER did not.** it read
*"`rhx route.guard.budget --for review --add N`"* until a top-up was forbidden to bots
(`rule.forbid.budget-top-ups`).

⇒ the argument for the order survives intact, and it earns one line: it never rested on the cure's
CHEAPNESS, only on the cure not belonging to a human. an exhausted lane is still no human gate —
it is now a lane that converges or stands terminal — so a row that renders it `blocked:on-human`
still parks it on a person who cannot clear it.

⇒ the glyph is owed a split. until it gets one, the word settles the owner.

## .the fail-safe direction

every derivation leans to **show**: an unparsed age, an unknown state, or a crew with no motion
data all render. a hidden row and an absent row read identically
(`rule.forbid.clipped-sweeps`), so doubt must never land on silence.

## .refs

- `git.crew.poll.sh` — the derivation, the render, and the `🚦 status` tally
- `term=crew._.choice._.md` — the subject this is a property of
- `term=asleep._.choice._.md` — why `unread` is carried rather than folded
- `rule.always.spend-own-levers-before-escalation.md` — the misread `blocked:on-defect` prevents
- `rule.forbid.clipped-sweeps.md` — why the prune must be declared

## .reason

- `term=crew.status._.choice.reason.md`

---

written by human + beaver 🦫
