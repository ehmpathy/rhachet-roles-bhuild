# rule.forbid.fabricated-opines

## .what

a clone never **authors** a human's `sev` or `urg` — not in the store, not in an example, not
in a default, not in a suggested command.

when a row needs one, a clone **asks the human outright and proposes its own read**, with the
argument beside it. the ban is on the **verdict**, never the **proposal**, never the
**question**.

`define.invariant.eco.quant-informs-opine` says the store decides naught. this closes the gap
that invariant leaves open: a clone that fills the blank has decided on the store's behalf.

> **use the values the human gave you. where you have none, ASK — and say what you would pick,
> and why. never write a number they did not say.**

## 🔴 .why — a suggested opine IS an opine

a clone that writes

```sh
rhx eco.priority set --slug grepsafe-glob-basename --sev p1 --urg 1w …
```

has made a claim about how much this matters and by when. once run, the record carries a `p1`
indistinguishable from a judged one — same column, same sort position, same authority over
every row beneath it.

⇒ the same class as a fabricated cash figure, already a blocker (`howto.read-eco-priority-flags`)
— and more dangerous, because `sev` outranks every quant by construction.

⚠️ a caveat does not cure it: "sev and urg are yours" beside a copy-paste command that carries
`p1` is a lesson even so. the prose is read once; the command is run.

## 🔴 .and a DEFAULT is the strongest suggestion there is

a default in a `--help` block, a worked example, and a tool's empty-rank nudge once all carried
the same concrete `--sev p1 --urg 1w`. per `rule.prefer.defaults-match-common-case`
(ehmpathy/ergonomist), a default IS the common case as far as a human reads it — so the tool
taught `p1` as the default severity, on a fibonacci ladder whose whole purpose is to force a
deliberate pick between rungs. a ladder every row starts halfway up is not a ladder.

## .the test

> **"did a human say this number, or did I pick it?"**

- they said it → use it verbatim
- you picked it → 🔴 it may not be **written**. it should be **proposed out loud**, argument
  attached, question asked. the artifact carries `<yours>`; your message carries your read

| when… | then… |
|---|---|
| you write an example `set` command | 🔴 `--sev <yours> --urg <yours>`. always |
| you write a nudge, a prompt, a `--help` line | same — it reads as a recommendation because it is one |
| you'd default `sev`/`urg` in code | 🔴 no defensible default exists. the ladder forces the pick |
| the human named a `sev` | use it exactly, don't round it |
| which `sev` is *obviously* right to you | ✅ say so, as a proposal — then ask |
| you have evidence for the `sev` | ✅ surface it cell by cell, propose a rung, ask them to grade it |
| 🔴 a row needs a `sev` and your turn is about to end | **ASK.** a blank with no question reads as finished work |
| you wrote `--sev <yours>` and stopped | 🔴 the placeholder is correct; the silence is not |
| the human says "just add it" with no grade | ask once, proposal attached. one sentence, never a halt |
| a quant is involved (`gain.cash`, `asks`) | different rule — a quant is measured; you may fill one |

## ✅ .what to do instead — ASK, and PROPOSE

three parts, all owed:

**1. lay the evidence out, cell by cell** — checkable, where a guessed `p1` is not:

```
| bears on `sev`                                  | bears on `urg`               |
|-------------------------------------------------|------------------------------|
| silent failure — `0 matches`, exit `0`           | 3 asks over 15 days          |
| one wrong verdict already on record              | no date stated by anyone     |
| ❔ no cash measured, and I will not invent one    | a workaround exists          |
```

**2. 🔴 ASK**, outright, as a question: *"what sev and urg?"* — a table is not a question.

**3. 🔴 PROPOSE your own read, marked as yours:** *"I would say p2 · 1m — the silent-failure
mode is real but a workaround exists, and no one has named a date. that is my read, not a
grade. say the two and I run it."*

| a PROPOSAL | a FABRICATION |
|---|---|
| said to the human, unrun | written into the store, an example, a default, a `--help` line |
| marked as yours, with the argument | indistinguishable from a judged value once it lands |
| dies unless they say it back | outranks every quant beneath it, forever |

⇒ the discriminator is the SURFACE, never the number. `p2` spoken to a present human is a draft
they can strike; the same `p2` in a command settles into fact.

## 🔴 .silence is also a failure

a pure "never write a number" instruction, obeyed to the letter with no question asked, once
left a row ungraded and the work stalled — the human did not know a value was owed, because no
question was asked, and read the silence as a finished turn.

⇒ the gate here is real — only a human grades a sev — but it is a *question*, never a *halt*.
steer the queue; do not park it on a false human-only gate.

## .enforcement

- a `sev`/`urg` value authored by a clone and written to the store = **blocker**
- a concrete `sev`/`urg` in an example, `--help` line, nudge, or prompt = **blocker**
- a code default for `sev` or `urg` = **blocker**
- a human's stated `sev` rounded, nudged, or "corrected" by a clone = **blocker**
- 🔴 a row left ungraded with no question asked = **blocker**
- 🔴 an evidence table with no proposed rung = **nitpick**
- a proposed rung stated in conversation, marked as the clone's, unrun = ✅ correct
- that same rung written to the store/example/default/`--help` before the human said it back =
  **blocker**

## .see also

- `define.invariant.eco.quant-informs-opine.md` — the store decides naught; this closes the
  clone-shaped hole in that claim
- `rule.require.a-gain-cell-behind-every-sev.md` — what a clone CAN supply: the basis
- `howto.read-eco-priority-flags.md` — the cash twin: never invent a figure
- `rule.require.distinguish-prefilled-from-suggested.md` (role=supervisor) — the same hazard
  one layer down
- `rule.prefer.defaults-match-common-case` (ehmpathy/ergonomist — foreign) — why a default is
  the strongest suggestion a surface can make

---

written by human + beaver 🦫
