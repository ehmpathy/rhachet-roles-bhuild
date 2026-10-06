# domain.term.choice.reason: asleep

## .etymology

the word was **already spoken in this domain before any code used it**, which is the mark
`def.domain-discovery` asks for — discovered, not invented at a keyboard.

`term=phantom._.choice._.md`, authored 2026-09-02, drew the boundary and used the word in prose
while naming the gap it could not fill:

> *"a hibernated grove is **present and asleep**; a destroyed one is gone; a network fault is
> neither. all three render as one exit code with no cause named … reach for `phantom` only where
> a **second source** says the subject is gone"*

so that section named the trap, refused `phantom` for it, and left the correct word unassigned.
`asleep` is the word it had already used to describe the state — lifted into the verdict set the
next round, rather than coined for it.

⇒ the glyph `😴` follows the word; the word did not follow the glyph.

## .the rejected synonyms

| ⛔ word | why it was refused |
|---|---|
| `unreachable` | asserts a **property of the box** — that it cannot be reached, ever. one failed call establishes no such thing. it also collides with the ssh/network vocabulary, where it names a routing fact |
| `unreached` | accurate and **passive-past** — it names what did not happen rather than a state the reader can act on. every peer verdict in the set is an adjective describing the crew NOW (`at work`, `down`), so a past participle breaks the set's shape (`rule.prefer.symmetric-term-pairs`) |
| `hibernated` | the cause, asserted outright, with none of `asleep`'s idiomatic hedge. it is also `declastruct-aws`'s own word for a deliberate act it performs — so to reuse it here would claim we know THAT act occurred |
| `offline` | taken by the network layer, and it asserts a cause (no link) that a busy or key-refusing box also produces |
| `timeout` | names the **mechanism of the measurement**, not the state of the subject. a reader cannot act on it |
| `unknown` | ⚠️ the near miss, and it is **TAKEN** — `git.crew.poll` already renders `❔unknown` for a box state it could not classify (`term=false-report`, row 14). one word, two concepts, at two layers of the same instrument = a blocker under `rule.forbid.ambiguous-labels` |
| `down` | the word the row **used to carry**, and the defect this term exists to repair. see below |

## .the evidence

### the measured case, 2026-09-02

`duct.read --on 'duct://grove-ahbode-v20260901/main/mechanic'` exited **255 with an empty error**,
and i reported it as *"`term=phantom` at the grove layer."* that was wrong, and
`term=phantom._.choice._.md` records the correction: **unreachable is what i measured; gone is
what `phantom` asserts.**

that misread is the origin. it proved the verdict set had no word for the state, so the reader —
me — reached for the nearest one and asserted a fact nobody held.

### the four unreached groves, 2026-09-03

a live sweep rendered:

```
⚠️  UNREACHED: grove-ahbode-v20260811.ground grove-ahbode-v20260810
                grove-ahbode-v20260811 grove-ahbode-v20260810.ground
```

four groves of six. the tally read `0 asleep`, because those groves carry no ledger rows — their
crews were felled. so the **arm did not fire on live data**, and its proof is structural rather
than observed. that is stated here rather than implied: the clamps in `[case26]` were each seen
red under an injected defect (`rule.require.clamp-edge-cases` step 2), which is the proof the
term rests on today.

### the ledger is what makes the word reachable at all

`asleep` needs the crew's **host**, and a crew that is not at work has no live session to learn it
from. the host comes from the crew ledger, which carries `grove` per row and outlives every
session (`term=ledger`: existence outlives liveness). absent that, an unreached grove's crews are
not merely mis-verdicted — they are **unplaceable**, and fall to `phantom` by way of a read of the
wrong disk.

⇒ so `asleep` and the ledger host-fill are one repair, not two, and `[case26]` clamps both.

## .disputes

### dispute: unread — raised 2026-09-03 — status: OPEN

- raised.by  = beaver 🦫 (the author, against its own word — recorded rather than papered over)

- claim      = **`asleep` leans on a cause it cannot know**, which is the exact defect it was
               coined to repair. an unanswered grove may be hibernated, **destroyed**, or behind a
               network fault. `asleep` asserts the first. so the say file's central claim — *"the
               only verdict that is a claim about the READ"* — is true of the GLYPH's intent and
               not strictly true of the WORD.

               `unread` carries no cause at all: it says we did not look, and naught beyond that.
               which is precisely the epistemic state.

- counter    = three, and they are not equal in weight:

               1. **the cure fails SAFELY.** `git.grove.wake` on a destroyed box errors at once
                  and cheaply. that is the asymmetry against `down`, whose `crew.boot` on an un-up
                  box fails confusingly and may half-succeed. a word that routes to a
                  fail-fast cure is defensible even where it over-claims.
               2. **hibernation is the dominant cause by construction** — `declastruct-aws`
                  hibernates groves on an idle window, by design. so the word names the common
                  case, and the rendered text carries the epistemic claim beside it:
                  `unread, NOT down`.
               3. **`unread` breaks the set's shape.** its three peers are states of the crew;
                  `unread` is a state of our knowledge, and a reader scanning a column of crew
                  states meets a word about themselves.

               ⚠️ counter 3 is the weakest, and cuts both ways — the say file's own headline
               argues that being a claim about the read is the term's *defining* virtue. so the
               shape objection and the central claim are in tension, and this dispute is the
               record of that.

- resolution = **OPEN.** the contract keeps `asleep` — it is shipped in `git.crew.poll`, declared
               in its legend, and clamped by `[case26]`, so a rename is a real diff rather than a
               judgment. per `howto.domain-term-disputes`, contracts hold the canonical term while
               a dispute is open.

               what would settle it: **one destroyed grove.** if a reader is ever handed
               `😴 asleep` for a box that no longer exists and acts on it, counter 1 has failed in
               the field and `unread` takes the word. until then this is an argument with no
               instance behind it, and an instance is what the glossary grades on.

## .see also

- `term=asleep._.choice._.md` — the term
- `term=phantom._.choice._.md` — the ⚠️ UNREACHABLE section that named this gap and left it open
- `term=down._.choice._.md` — the verdict this row was mis-assigned to
- `term=at-work._.choice._.md` — the three-state table this term extends to four
- `term=ledger._.choice._.md` — the source that makes the host, and so the verdict, reachable
- `term=partial-audit._.choice._.md` — an instrument owes its reader the subject set it could not
  reach; this term is that debt, paid on the row

---

written by human + beaver 🦫
