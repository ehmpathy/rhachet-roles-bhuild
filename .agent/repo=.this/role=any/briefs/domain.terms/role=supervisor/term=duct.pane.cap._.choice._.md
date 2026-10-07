# domain.term: cap

term.chosen   = cap
term.kind     = noun
term.boundary = duct.pane
term.synonyms.forbidden:
- limit
- quota
- throttle
- rate-limit
- exhausted

## .what

**the pane carries a vendor usage-limit line** — `You've hit your limit · resets <time>`, or
`You're out of extra usage · resets <time>`.

a cap asserts that the **pane holds that line**. it asserts naught about whether the clone is
capped right now, and the render says `SEEN` for exactly that reason.

```
🔋 cap    the pane holds a vendor quota line        -> join reset-vs-now + still
🙋 plea   the pane holds the clone's own grant cmd  -> join still + stone-not-already-👋
```

## .why it exists — a capped clone renders identically to a healthy one

it is the **only** fleet state that looks exactly like health. the pane keeps its last stone, the
box is empty, and no verdict anywhere says *"this clone cannot take a turn."* so a sweep reports
it idle, and a supervisor routes it by a status line that froze hours ago.

⇒ every other stall announces itself. this one is silent, account-wide, and hits several clones at
one instant — so the cost is multiplied at exactly the moment the signal is weakest.

## .the judgment is a JOIN — the term is one of three facts

no single fact is sufficient, and the term deliberately carries only the first:

> the cap was seen · the reset has **PASSED** · the duct is **UNCHANGED**

the third is the extant motion signal, and it is what parts a clone that is stopped from one that
is at work. to compose those three beats a new spinner-tense heuristic, which would be one more
fragile read of a neighbour's render.

## .cap is NOT

- **`exhausted`** — the extant term at the **review** boundary: a reviewer that spent its budget.
  a capped clone and an exhausted reviewer are unrelated, and a cap can *cause* a reviewer to
  report `malfunction`, which is a third state again
- **`limit` / `quota`** — the vendor concept beneath it, which exists whether or not any pane
  shows it. `cap` names the **line in the pane**
- **`throttle` / `rate-limit`** — assert a per-request pace. this is an account-wide wall with a
  wall-clock reset, which is a different mechanism and a different cure
- **`down` / `asleep`** — claims about a **grove**, not about a clone's ability to take a turn
- **a verdict** — the line lives in **scrollback**, so a clone resumed an hour ago still carries
  it. see `.reason` for the measured cost of the opposite read

## 🔴 .the `SEEN` suffix names a CLASS — `duct.pane.relic`

the paragraph above is this term's most reused idea, and it was written here as a fact about caps.
it is not: **a cap line is one instance of a line a pane keeps after the state it named has
passed** (`term=duct.pane.relic`).

| the residue | guarded by |
|---|---|
| a vendor cap line | 🔋 `cap SEEN` — this term |
| a clone's own grant command | 🙋 `PLEA SEEN` — `term=duct.pane.plea` |
| `⎿ Login successful` | ⛔ no guard at all, until 2026-09-08 |
| a spent oauth url | `__url_best`, ad hoc |

⇒ `SEEN` is the render half of a class this repo solved twice and named on the fourth instance.
⚠️ **and one clause above is too narrow for the class:** *"the line lives in scrollback"* holds for
a cap and fails for `Login successful`, which sits on the **visible** pane. the discriminator is
never location — it is *"does this line assert a CURRENT state, or record an event that HAPPENED?"*

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `duct.poll.sh` — the `cap` grep, the `$slot.cap` file, and the `🔋 cap SEEN` render arm
- `term=duct.pane.relic._.choice._.md` — the class this term is an instance of

## .reason

see `term=duct.pane.cap._.choice.reason.md` — the five-clone incident it was coined from, the
`git.crew.poll` join that is still owed, and why the term is a peer of `plea`.

---

written by human + beaver 🦫
