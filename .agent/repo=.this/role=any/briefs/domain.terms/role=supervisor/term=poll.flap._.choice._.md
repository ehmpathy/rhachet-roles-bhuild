# domain.term: poll.flap

term.chosen   = flap
term.kind     = noun
term.boundary = poll
term.synonyms.forbidden:
- flake
- jitter
- flicker
- race
- churn
- nondeterminism

## .what

a **verdict that alternates across polls while its subject holds still.**

```
the subject does not change  ->  and the verdict moves anyway
```

## 🔴 .a flap is a property of a SERIES. every neighbour is a property of ONE READ

that is the whole of the word, and it is the discriminator that earns it a home apart from
`false-report`:

| | what it names | how many reads to see it |
|---|---|---|
| `false-report` | **this report** is wrong | **one** |
| `partial-audit` | **this instrument** narrowed its subject | **one** |
| `phantom` | **this row** outlived its subject | **one** |
| `🧊 frozen` | two reads **agree**, and the subject is still | two |
| 🔴 **flap** | 🔴 two reads **disagree**, and the subject is still | 🔴 **two, minimum** |

⇒ **one read can neither establish a flap nor refute one.** a flapped verdict, caught once, is
indistinguishable from an honest one — so the defect is invisible to exactly the read a
supervisor takes.

⚠️ **and `frozen` is its formal twin, not its opposite.** both compare two reads of an unchanged
subject. `frozen` is what you see when the instrument is faithful; a flap is what you see when it
is not. **the subject is identical in both.**

## 🔴 .the word names the OBSERVATION, never the MECHANISM — deliberately

`race` was the first candidate and is forbidden. the favored mechanism for the measured instances
below is a **capture race** — the pane sampled mid-repaint, so a partial frame is graded — and
that mechanism is **favored, never settled**.

⇒ a word that names an unproven mechanism dies with the hypothesis. this repo already paid for
that lesson once: `rule.require.bound-grove-concurrency-by-saturation` named an axis that binds
in advance, and the grove inverted it two days later. **name what you can see.**

## .measured 2026-09-05

| the subject | its verdicts, in order | did the subject change? |
|---|---|---|
| `fix-grepsafe…/foreman` | `❔unread` → **classifies** → `❔unread` | 🔴 **no** — pane read byte-identical all three times |
| `feat-telepath-role` | `unread` → `inflight` → `frozen` → `inflight` → `unread` | 🔴 **no** — one husked mechanic, `💥143` at a fixed timestamp throughout |
| the 🙋 tally | 7 · 7 · 7 · 4 · 5 | 🔴 **no** — zero grants issued, no route advanced |
| the `❔unread` tally | 13 · 10 · 11 · 14 · 14 | — |

🔴 **row 1 carries the weight.** the pane was captured three times and compared byte for byte; it
did not differ. only the verdict did.

⚠️ **row 3 is the costly one.** on one tick the poll reported `ducts moved — 3 changed` while the
🙋 count fell by three and the `❔unread` count rose by three — **and the trees that entered and
left were not the three that moved.** the tally moved further than the fleet did.

## .what a flap OBLIGES

| the reflex | why it fails under a flap |
|---|---|
| *"read the number"* | 🔴 the number is **one draw**, never a census. keep a **maintained inventory** and reconcile per subject |
| *"it changed, so the subject moved"* | a change in verdict is no evidence of a change in subject |
| *"it is unchanged, so it is stable"* | you may have drawn the same face twice |
| *"I fixed it — the verdict improved"* | 🔴 the sharpest trap. a flap **rewards any intervention about half the time**, so it manufactures false cures |

🔴 **the last row is the one that corrupts a repair loop.** a flap makes an inert remedy look
effective on the read that follows it. the only sound test is a **series**, and the series must
be long enough that a coin would not have produced it.

## 🟢 .the antidote sits on the SAME LINE — `still Nm` does not flap

a flap is not a reason to distrust the whole poll. **the age counter is stable where the verdict
is not**, and the two are printed side by side.

measured 2026-09-05, `fix-contemplation-gate…/foreman` across four consecutive ticks:

| tick | the verdict | the age |
|---|---|---|
| 1 | `👻ghost` | `still 15m` |
| 2 | `👻ghost` | `still 30m` |
| 3 | 🔴 `❔unread` | `still 45m` |
| 4 | 🔴 `👻ghost` | `still 60m` |

**the verdict alternated across three values; the age incremented monotonically by exactly one
tick, every tick.** so `still Nm` tracks the **content** of the box, and the emoji tracks a
**classification of** that content — and only the second one flaps.

⇒ 🟢 **when a verdict looks suspect, read the age instead.** *"unchanged for 60m"* is a claim
about the subject and it held across a verdict that did not. this also settles a worry raised
when the flap was first found — that the flap might reset the `still` clock and so poison the
`CLONE QUIET` and `BOX UNMOVED` heuristics. **it does not.** those two remain sound.

⚠️ the age answers *"did the subject move?"* and says naught about *"is the subject healthy?"* —
a husk's age climbs exactly like a parked clone's. pair it with a read, never with a guess.

## .a flap is NOT

- **a `false-report`** — that is one report that is wrong. a flap needs two that disagree, and
  each may be individually honest about the frame it graded
- **a `partial-audit`** — that instrument narrows its subject and says naught. a flap's
  instrument reads the whole subject and grades it differently each pass
- **`🧊 frozen`** — the formal twin. same still subject, reads that agree
- **a `phantom`** — stale data about a subject that is gone. a flap's subject is present
- 🔴 **a LAG** — and this is the twin most easily confused, because the two are **exact
  inversions** and both end in *"the tally misled me"*:

  | | the subject | the verdict |
  |---|---|---|
  | **flap** | 🔴 **holds still** | moves |
  | **lag** | moves | 🔴 **holds still** |

  ⚠️ measured 2026-09-05: `fix-contemplation-gate…/mechanic` rendered `l3@i014, blocked ✋` while
  the clone was mid-turn at **i025**, live and productive. the route had genuinely advanced; the
  stone records only **settled** transitions, so the record trailed the work.

  ⇒ **the cures are opposite.** a flap says *"take another read."* a lag says *"another read will
  not help — the record is behind, so read the SUBJECT instead."* a supervisor who treats a lag
  as a flap re-polls forever; one who treats a flap as a lag drills into a pane that was fine.

  🔴 **`lag` is NOT defined here — it is OWNED by `rule.require.report-stone-with-status.md`**,
  which measured it first (28 iterations on one tree, 11 on another), re-measured it as a roughly
  constant offset rather than a divergence, and carries its mandate: *"name the stone — and
  wherever you would act on its STILLNESS, read the pane first."*
  ⇒ this row exists **only** to part a lag from a flap. do not grow a second definition here;
  that is the braided trail (`philosophy.pavement-saves-nature`).
- ⚠️ **a `flake`** — the word is TAKEN by the ci/test sense (`cicd.deflake`), and to reuse it here
  would overload one word onto two concepts (`rule.forbid.domain-term-ambiguity`).
  ⇒ ⚠️ **and `false-report` rejected `flake` for its OWN name on the grounds that it *"implies
  nondeterminism"*** — that rejection is what proved this concept was homeless

## .refs

- `.dream/2026_09_04.unread-box-classifier-has-two-causes.dream.md` — the measured series above,
  the two mechanism hypotheses, and the retraction a flap caused
- `term=false-report._.choice._.md` — the `flake` rejection that warranted this cluster
- `term=duct.box.unread._.choice._.md` — the verdict that flaps in every measured instance
- `term=poll._.choice._.md` — the instrument whose verdict this is
- `term=substituted-criterion._.choice._.md` — how a flap gets misread as a cure

## .reason

see `term=poll.flap._.choice.reason.md` — the etymology, the rejected candidates, the enumeration
that settled the word, and the boundary question left open.

---

written by human + beaver 🦫
