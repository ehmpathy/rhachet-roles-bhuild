# domain.term.choice.reason: duct.box.inflight

## .etymology

`inflight` is **not a coinage — it is a reuse.** the word is already in this domain's mouth, and
`git.crew.poll` prints it on every tick:

```
✋ tree: in flight — work uncommitted, no commit yet
```

so the first read of my own use was that i had **overloaded** a word — one term, two concepts,
which `rule.forbid.domain-term-ambiguity` forbids outright in a contract, and i had just put mine
in a contract-grade table row.

⚠️ **that read was wrong, and the correction is the whole reason this file exists.** run the two
senses side by side:

| the subject | what `in flight` says of it |
|---|---|
| a **tree** | work exists, and is **not yet committed** to the branch |
| a **duct.box** | text exists, and is **not yet submitted** to the clone |

⇒ **that is ONE concept, over two subjects**: *a unit of work exists, in an intermediate state, not
yet committed to its destination.* it is not an overload at all.

and `rule.forbid.domain-term-ambiguity` predicts exactly this outcome: *"where the two senses
differ by CONTEXT rather than by concept, the repair is a **boundary**, never a second word."* so
the repair was `rule.require.boundary-qualified-terms`, applied mechanically:

> **"$word, of WHAT?"** — `in flight, of what?` → a **tree**, or a **duct.box**. two subjects, one
> concept, two boundaries.

hence `duct.box.inflight`, which slots beside the extant `duct.box.unread` with no friction.

### what it beat

- **`typing` / `mid-typing`** — names the human's act, not the box's state. every other member of
  this enum names the box (`empty`, `queued`, `unread`), so this would have broken the set's shape.
  it is also a gerund
- **`partial`** — already spoken for. `term=partial-audit` uses `partial` for an instrument whose
  subject set is incomplete; to reuse it for a box would be the genuine overload this term avoided
- **`draft`** — implies the human intends to revise later. they do not; they intend to finish in
  the next few seconds
- **`unfinished`** — true, and it describes the TEXT. the operative fact is about the **author**:
  they are still there. `inflight` carries the motion; `unfinished` carries only the shortfall

## .evidence

**2026-09-04**, `test-fns.beav.feat-tempdir-autoprune/mechanic`, on a raw read taken because the
sweep read `📬queued`. the capture is verbatim:

```
❯ ESC[38;5;231m ok make that fix            ← 48;5;237 highlight bg — QUEUED, already sent
❯ ESC[39m and have you dogfooded ESC[7m ESC[0m   ← live box, NORMAL intensity, cursor after
✢ Proofing… (running stop hooks… 0/2 · 1m 11s)  ← the clone is mid-turn
```

the extant rule's table held three states and prescribed **`--keys Enter`** for this one. that key
would have relayed `and have you dogfooded` — a question cut off mid-sentence, under the human's
name.

### why the three prior states could not catch it

each of them assumes the human **left**:

| state | what it assumes of the human |
|---|---|
| suggested | irrelevant — no human ever typed it |
| prefilled | typed, then walked away |
| queued | typed, submitted, walked away |
| **inflight** | **still there** |

⇒ the colour axis parts *real from ghost*. the box-position axis parts *sent from unsent*. **no
axis in the extant set asks whether the author is DONE** — so the state was not merely absent from
the table, it was unreachable by the table's own tests.

### the SECOND instance — one tick later, a different tree, a different human

**2026-09-04**, `rhachet-roles-bhuild.beav.feat-behavior-route-upgrades/mechanic`, on the very
next sweep after this cluster was paved. the poll read `✍️prefilled`:

```
❯ ESC[48;5;237m ESC[38;5;231m right we should also pull in the explicit instruction to offload
  some of the info, like groundage, into dedicated separate files too. e.g., next to the
  experience files, 1.vision.groundage.md          ← QUEUED, highlight bg, already sent
─────────────────────────────────────
❯ and is it super clear we need to only include .yield.md files from the $route/ ESC[7m ESC[0m
                                                   ← live box, NORMAL, cursor, FRAGMENT
```

byte-identical in shape to the first: a queued row above, a fragment below, cursor in it.

⇒ **n went from 1 to 2 within the hour, across two repos and two separate humans.** the first
instance could be read as a habit of one person on one night. the second cannot — and it landed
before the ink was dry, which is the strongest form of corroboration a fresh term can get.

⚠️ **and the poll called it `✍️prefilled` both times.** so the instrument's verdict is not merely
short of a state — it actively names the wrong one, and the name it gives is the one whose
prescribed act (`--keys Enter`) is the harmful one. that is worse than an absent verdict: an
absent verdict prompts a read, and a confident wrong verdict does not.

### a THIRD candidate — caught by a TALLY DELTA, not by a pane read

**2026-09-07**, a babysit tick. two full fleet polls ran ~60 seconds apart with **no act between
them** — no key sent, no steer, no boot:

| | poll A | poll B |
|---|---|---|
| ✍️`prefilled` | **1** | **0** |
| ❔`unread` | 18 | 12 |
| 🙋 await approval | 6 | 5 |

⚠️ **state its bound first: the subject was never named.** neither poll renders which tree holds a
`prefilled` box, so no pane was read and no attribution is possible. this is **not** a verified
third instance, and it must not be counted as one.

🔴 **what it DOES supply is a discriminator the first two could not** — both of those were caught
by a pane read, so neither could say what the state does over TIME:

| the state | what it does across two polls, absent any act |
|---|---|
| `prefilled` — typed, then walked away | 🔴 **persists.** that is what the word means; the covered-box cluster records one at `still 513m` |
| `inflight` — the human is still there | ✅ **clears on its own**, the moment they hit Enter |

⇒ so a `prefilled` verdict that **vanishes with no act taken** is, by the state's own definition,
not a `prefilled`. it is an `inflight` that finished, or a misread — and either way the instrument
named the wrong state, which is the same failure the two verified instances record.

✅ **and this detector is free at the tally layer.** the prior two needed a pane read plus the
queued-row/fragment join the classifier cannot do. this one needs only the same number, twice:
**a `prefilled` count that falls with no act is a wrong verdict, and no drill-in is required to
know it.** that is a cheaper clamp than the join, and it runs on data every tick already emits.

⚠️ the honest limit: it detects the wrong verdict, never which state was right. `inflight` is the
likeliest candidate because it is the one member of the set that clears unaided — but a
capture-race misread produces the same delta, and the same session saw ❔`unread` move 18 → 12
across those very two polls with no act either.

## .the invariant it adds

> **a target that exists is not thereby a target that is ready.**

the rule already carried *"before you send a key, name what it lands on."* every failure on its
record aimed a key at a target that was **absent** — a ghost with no buffer, a late `--keys` after
the modal cleared, an Enter into an empty box beneath a queued row. this one aims at a target that
is **present and unfinished**, which passes that test cleanly.

so the maxim is now: **name what it lands on — and whether that target is still in motion.**

## .the gap this term makes visible

`git.crew.poll` emits `empty`, the ghost verdict, `prefilled`, `queued`, and `unread`. it does
**not** emit `inflight`, and cannot: the discriminator is a queued row above a non-empty live box,
which the box classifier does not currently join.

⇒ so this term is paved **ahead of its instrument**, which is the inverse of the lag recorded on
`rule.require.distinguish-prefilled-from-suggested` — where the instrument knew a state the brief
had not written down. here the brief knows one the instrument cannot yet report.

**both are the same defect class, and the same cheap detector settles it:** hold the doc's state
set against the instrument's verdict set, in both directions. a mismatch either way is a gap by
arithmetic, before any evidence is gathered.

---

written by human + beaver 🦫
