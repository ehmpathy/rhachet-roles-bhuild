## .what

new rule `rule.require.glyph-standards` in ergonomist `cli/`:

- **contrast**: a glyph reads on both dark and light terminals. no black glyph (📞 is invisible on dark). no glyph whose dominant color is red unless it signals an error (☎️ reads as alarm)
- **one space**: exactly one space after the glyph run, never a column pad
- **one layer per glyph**: each glyph fills one layer and does not collide with another glyph's layer in the same role
  - voice (🐢 mechanic, 🦫 bhuild)
  - role mark (💧 dispatcher)
  - device / event (🎙️ radio, 🔔 phone receipt)
- **a registry**: each role records its glyph assignments in one brief, so the next surface reuses them and does not guess

## .why

no glyph rule exists. in one vision pass the human rejected a smartphone (📱), a red phone (☎️), and a black receiver (📞, "we need contrast"), then picked 🔔. the human also had to say:

- "why so many spaces between emoji and words here?": the radio's three-space pad was copied blind
- "dont the phone skills live under dispatcher?": 💧 is the dispatcher role mark, so the skill header should carry it, and 🔔 marks only the receipt

## .provenance

`rhachet-roles-bhuild` @ `beav/feat-phone-text`, stone `1.vision`, fulcrum F8.

## .the forbid pairs — ship them all

a forbid bites faster than a require: a reviewer greps for a forbidden shape, but must reason to spot an absent one. one twin per standard:

| twin | 👎 forbidden | 👍 instead |
|---|---|---|
| `rule.forbid.low-contrast-glyphs` | 📞 (black), ☎️ (red) on a non-error line | 🔔 |
| `rule.forbid.glyph-pads` | `🦫🔔   text` (column pad) | `🦫🔔 text` (one space) |
| `rule.forbid.glyph-layer-collisions` | 🔔 on a skill header where the role mark belongs | 💧 header, 🔔 receipt only |
| `rule.forbid.unregistered-glyphs` | a glyph in output that the role's glyph registry does not list | add it to the registry first |

## .enforcement (proposed)

- a black or dominant-red glyph on a non-error line = nitpick
- a glyph that collides with another layer in the same role = blocker
- more than one space after a glyph run = nitpick
