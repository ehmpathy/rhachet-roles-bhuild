# domain.term: duct.box.ghost

term.chosen   = ghost
term.kind     = adj
term.boundary = duct.box
term.synonyms.forbidden:
- placeholder
- hint
- shadow text
- greyed
- phantom text

⚠️ **`suggested` is NOT on that list, deliberately — it is an OPEN dispute.** see `.reason`.

## .what

**the input box holds text the clone never typed** — a shell or readline autocomplete
suggestion, drawn dim, which the next keystroke replaces rather than extends.

```
❯ ␛[2mcatch a dream for the meter cluster + s07 invariant␛[0m
```

the `␛[2m` is the whole tell: SGR 2 is faint intensity. typed text renders at normal
intensity (measured: `38;5;231`).

## 🔴 .why it earns a state of its own — an Enter here FABRICATES a human

the box's content reads, to every color-blind instrument, as a message a human typed and left
unsent. so the act it invites is the submit — and the submit is the defect:

> **an Enter on a ghost does not send a message. it AUTHORS one, in the human's voice, out of a
> suggestion the shell offered to nobody.**

⇒ that is the fabrication class `rule.require.distinguish-prefilled-from-suggested` exists to
prevent, and the same class as a co-author signature over an artifact no human shaped
(`rule.require.co-author-signature`).

## .how it is told apart

| | what the row holds | the SGR | an Enter |
|---|---|---|---|
| **prefilled** | text a human typed and left | normal (`38;5;231`) | sends their message — usually right |
| 🔴 **ghost** | an autocomplete suggestion | **faint (`[2m`)** | **fabricates a message** |

🔴 **a plain read cannot part them** — it strips the escape codes, so both render as plain text
on a `❯` row. **`--raw` is the only read that answers**, which is why the babysit protocol names
it before any submit.

## ⚠️ .the check that catches it does NOT catch its neighbour

`rule.require.distinguish-prefilled-from-suggested` parts **white from gray** — live text from a
ghost. it has no opinion about **live vs historical**, which is the axis `duct.box.covered` lives
on. so a ghost check that passes clears one hazard of two (`term=duct.box.covered`).

## .what a supervisor does with it

**naught.** a ghost is inert — it is the shell's offer, not a clone's state, and it vanishes on
the clone's next keystroke. it blocks no work and hides no gate.

⚠️ measured 2026-09-05: the crew that carried one was healthy and at work throughout
(`5.3.verification, review.peer, l3@i006 🔍`), mid-turn on genuine self-correction. **the ghost
was a fact about the box, never about the clone.**

⇒ so it belongs to the same family as `quiet`: a row that invites an act, and whose correct
answer is to leave it alone.

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `duct.poll.sh` — the classifier arm and its `👻ghost` render
- `git.crew.poll.sh` — the join that carries it to the fleet row, as `👻ghost × N`
- `duct.read.sh` — `--raw`, the only read that parts it from `prefilled`

leaned on, undeclared until now, at:

- `term=duct.box.covered._.choice._.md` — its comparison table cites `👻ghost` by name and
  glyph, and states its verdict (*"dim text · is refused — the check catches it"*)
- `rule.require.distinguish-prefilled-from-suggested.md` — the guard, and the source of the
  disputed word

## .reason

see `term=duct.box.ghost._.choice.reason.md` — the OPEN dispute against `suggested`, and the
🔴 **`👻` glyph collision with `phantom`**, both measured 2026-09-05.

---

written by human + beaver 🦫
