# rule.always.read-stars-as-sponsored-priorities

> **when a human asks about "stars" — "how are our stars", "the stars" — they mean the ⭐
> SPONSORED priorities. answer from `rhx eco.priority get`, the ⭐-topped rows. NEVER a fleet
> crew-poll of high performers.**

⭐ is the glyph for a sponsored priority (`define.prioritized-vs-sponsored`). "star" is the
human's word for that mark — a row they committed budget to. "how are our stars" asks how the
funded work fares, answered by the prioritizer, never the crew poll.

## .why

| the read | answers | tool |
|---|---|---|
| 🔴 wrong: fleet performers | which crews progress? | `git.crew.poll --stones` |
| ✅ right: sponsored priorities | how does the FUNDED work fare? | `rhx eco.priority get` |

a crew poll ranks by route progress — a claim about MOTION, not worth or funded budget.

## .the measured miss

2026-09-14: asked "how are our stars", a crew-poll fleet read reported the furthest-along
trees as "our stars". corrected: *"dont you have a brief that teaches you that when someone
says 'how are our stars' they mean the sponsored, starred priorities?"* — there was none. this
is it.

## .the cues

| when the human says… | then… |
|---|---|
| "how are our stars" / "our starred work" | 🔴 `rhx eco.priority get` — the ⭐ rows |
| "star this" / "sponsor this" | an `eco.priority --sponsor` toggle, never a crew act |
| "how's the fleet" / "what's stuck" | THAT is the crew poll |
| about to answer "stars" with a crew poll | 🔴 stop — the crew poll has no ⭐ |
| a specific tree named | read that crew; "stars" with none named is the sponsored SET |

## .the test

> **"does the word STAR / ⭐ appear? the subject is the sponsored set — `eco.priority`, never
> `crew.poll`."**

## .enforcement

- "how are our stars" answered with a `git.crew.poll` fleet read = **blocker**
- "star this" / "sponsor" read as a crew act = **blocker**
- a crew-poll answer to a genuine fleet question = **false positive**

## .see also

- `define.prioritized-vs-sponsored.md` (prioritizer) — the ⭐ this word names
- `define.eco.priority-glyphs.md` (prioritizer) — the status flags beside ⭐
- `rule.always.render-priorities-as-treestruct.md` (prioritizer) — the render this reads
- `term=eco.sponsored._.choice._.md` — the word in the glossary
- `rule.require.speak-at-the-supervisor-layer.md` — answer in the question's own units

---

written by human + beaver 🦫
