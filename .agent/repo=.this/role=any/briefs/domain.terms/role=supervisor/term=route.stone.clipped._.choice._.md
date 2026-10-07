# domain.term: clipped

term.chosen   = clipped
term.kind     = adj
term.boundary = route.stone
term.synonyms.forbidden:
- unread
- truncated
- unknown
- cut
- elided
- partial

## .what

a **stone whose tail was cut by the width of the surface that rendered it** — so its verdict
word is not on the row, though the stone itself is intact at the source.

```
🙋 await approval   read to its end, the verdict is `judge, approved?`  -> surface it, once
✋ blocked          read to its end, the verdict is a halt              -> the driver's, work it
🔍 in review        read to its end, no halt verdict                    -> at work; leave it
✂️  clipped          THE TAIL WAS CUT BY THE PANE                        -> widen the pane, re-poll
```

## .the fact it asserts is about the SURFACE, not the read and not the world

three layers can fail between a stone and a reader, and each takes a different cure. `clipped`
names the middle one, which had no word until it got this bucket:

| the layer that failed | the word | the cure |
|---|---|---|
| the **read** — the capture came back empty | `unread` (`duct.box`) | re-read the duct |
| the **surface** — the pane was too narrow for the tail | **`clipped`** | **widen the pane, then re-poll** |
| the **classifier** — judged, and no arm matched | `unknown` (`duct.box`) | read the text on the row |

⇒ the source stone is whole in every `clipped` case. that is what parts it from `unread`, whose
whole claim is that no pane was judged at all.

## .why it earns a bucket rather than the catch-all

the verdict word sits at the **end** of a stone (`5.1.execution.from_vision, review.peer,
l3@i009, blocked ✋`), and the phase token sits at the front. so a narrow pane cuts precisely the
token a halt tally keys on and leaves precisely the token it does not.

a catch-all arm — `*)`, "no halt word matched" — is then true of a healthy stone AND true of one
whose halt word was cut off. the two are indistinguishable to the tally, so the clipped stone
inherits the benign verdict and the sweep reports a fleet healthier than it is
(`term=false-report`).

⚠️ **the ARM ORDER carries weight.** a stone cut *after* its verdict (`…, blocked ✋…`) is still
readably blocked, so the halt arms match first and the ellipsis arm sits between them and the
catch-all. a clipped-first ladder would launder real halts into `clipped`.

## .clipped is NOT

- **`unread`** — the boundary that costs the most, and the one this word was split from. `unread`
  asserts the capture came back **empty**, so no pane was judged; `clipped` asserts the pane was
  judged and its **tail** was lost. opposite cures: re-read vs widen. see `.reason` for the
  overload, which this repo shipped and then caught
- **`truncated`** — weighed and set aside. `truncate` reads as an operation performed **on** the
  datum, and the datum is untouched; only its render was cut
- **`unknown`** — asserts the row was held and judged and no arm matched. the text on the row is
  complete and available; here it is not
- **`asleep`** — the same three-layer question at the **crew** boundary, and a wholly different
  layer: a grove that did not answer
- **a `malfunction`** — the poll ran clean. one datum arrived short

## .the glyph

`✂️` — it names the cut. deliberately far from `❔`, which is `unread`'s and `unknown`'s: a
near-twin glyph for a different concept is a collision, and the first ship of this bucket made
exactly that mistake with `❓`.

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `git.crew.poll.sh` — the `*'…'` tally arm, the `STONE_CLIPPED` counter, the `✂️ N clipped`
  token, and the widen-the-pane hint

## .reason

see `term=route.stone.clipped._.choice.reason.md` — the overload it was split from, the
measurement that produced it, and the open question of whether the boundary is `route.stone` or
the wider `pane`.

---

written by human + beaver 🦫
