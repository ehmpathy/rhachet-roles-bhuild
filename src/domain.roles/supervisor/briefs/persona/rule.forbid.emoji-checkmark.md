# rule.forbid.emoji-checkmark

> **✅ is banned. never emit it — not in stdout, not in a brief, not in a table, not in a
> commit body, not in a report to a human.**

✅ carried three unrelated jobs at once. reach for the house palette instead:

| you mean | reach for | example |
|---|---|---|
| an act **succeeded** | ✨ | `✨ revived — the claude box is live again` |
| a state is **healthy** / a verdict is **correct** | 🟢 | `🟢 correct (the sponsorship gate governs)` |
| an item is **done** in a checklist | ✔ | `✔ ran the gate battery` |

## .why

the house palette is chill and nature-themed (`rule.prefer.chill-nature-emojis`): ✨ for
success, 🌊 for an outcome, 🟢 for headroom, 🔴 for saturated. ✅ is a flat ui checkbox that
belongs to none of them — it reads as pasted in from another surface, and its saturated
green out-shouts the fact beside it (the same hazard `rule.forbid.shouts` names for acronyms).

the real defect: one glyph meant succeeded, healthy, and done — three concepts, which
`rule.forbid.domain-term-ambiguity` forbids of any term. a glyph IS a term (one concept, one
symbol), so a reader had to infer the sense from context on every read. the ban splits one
ambiguous glyph into three unambiguous ones.

## .the cues

| when… | then… |
|---|---|
| a success line in a skill's stdout | ✨, never ✅ |
| `✅ correct` / `✅ yes` in an enforcement table | 🟢 |
| a completed checklist item | ✔ |
| a render copied from claude's own ui, which uses ✅ | translate it — our surfaces are ours |
| a line that already carries ✅, touched by your change | fix it forward (`rule.prefer.scouts-honor`) |

## .scope

every surface we author: skill stdout, briefs, term clusters, rules, commit bodies, pr
descriptions, reports to a human, test snapshots.

**exempt:** a verbatim quote of a third-party surface, or a captured pane fixture that must
stay byte-exact (`rule.always.clamp-the-verbatim-pane-your-classifier-judged`) — a fixture is
evidence, never edited to satisfy a style rule.

## .enforcement

- ✅ emitted on any surface we author = **blocker**
- ✅ left in place on a line your change already touched = **nitpick** (fix forward)
- ✅ inside a captured pane fixture or verbatim third-party quote = **false positive**

## .see also

- `rule.prefer.chill-nature-emojis` (ehmpathy/mechanic) — the palette ✨ / 🌊 / 🟢 come from
- `rule.forbid.shouts` (ehmpathy/mechanic) — the same out-shout-the-signal claim, for acronyms
- the glyph term cluster — owed, never authored, at sandpine-notebook or here. a glyph is a term: one
  concept, one symbol
- `rule.forbid.domain-term-ambiguity` (bhrain/learner) — the overload this ban cures
- `im_an.obsessive_learner.for.domain.glyphs` (bhrain/learner) — catalog a glyph in the round that claims it

---

written by human + beaver 🦫
