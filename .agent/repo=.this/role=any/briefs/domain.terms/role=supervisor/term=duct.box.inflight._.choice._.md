# domain.term: duct.box.inflight

term.chosen   = inflight
term.kind     = adj
term.boundary = duct.box
term.synonyms.forbidden:
- typing
- mid-typing
- partial
- draft
- unfinished

## .what

the box holds text a human has **not finished** — a fragment, with the cursor still in it and the
human still at the keyboard.

it is normal-intensity (so not `suggested`) and it sits in the live box (so not `queued`), which
means the two axes that part every other box state both read it as `prefilled`. it is not:
`prefilled` names text a human typed **and left**. `inflight` names text a human is **still on**.

⇒ the difference is not what the text looks like. it is whether its author is done.

## .the discriminator

a **queued message above a non-empty live box**. nobody submits a message and then abandons a
half-sentence beneath it, so that queued row is a presence stamp: the human was at this keyboard
seconds ago.

two weaker corroborators: the text ends mid-clause with no terminator, and the clone is mid-turn
— which is *why* they type, the same habit that makes the `queued` state one message earlier.

## .the peer states

`empty` · `suggested` · `prefilled` · `queued` · **`inflight`** · `unread`

`git.crew.poll` emits five of the six **box** states. **it does not emit this one** — that is the
gap this term names, and the reason the state was invisible until a `--raw` read met it.

⚠️ **a grep for `inflight` in `git.crew.poll.sh` nonetheless HITS** — `crew_status="inflight"` at
line 1375 sets a **crew** status, a different boundary over a different subject (`term=crew.status`,
*"at work — mid-turn, or a lane in review"*). so the sentence above is true of the box enum, and a
reader who greps it against the file will read it as false.

⇒ the word is a **reuse across boundaries, never an overload** — one kernel, *in motion and not yet
done*, over three subjects: `duct.box` · `crew.status` · and `tree.inflight`, owed and already
logged in `term=duct.pane.husk._.choice.reason`.

## .refs

- `rule.require.distinguish-prefilled-from-suggested.md` — the table row and the section
- `term=duct.box.unread._.choice._.md` — the peer cluster this one matches in shape

## .reason

- `term=duct.box.inflight._.choice.reason.md`

---

written by human + beaver 🦫
