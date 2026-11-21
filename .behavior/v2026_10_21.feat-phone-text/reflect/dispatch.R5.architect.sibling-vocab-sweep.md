## .what

new rule `rule.require.peer-vocab-sweep` in architect `domain.discovery/`:

- before you coin a term, a uri shape, a glyph, or an output convention, grep the **peer roles and repos** for an extant one, and reuse it
- a borrowed convention must still pass `rule.forbid.surprises`. precedent is evidence, not a pass

## .why

`rule.forbid.term.addition.synonym` and `rule.require.ubiqlang` ban synonyms inside what the author can see. they do not make the author look outside the current role. so a vision for the bhuild phone:

- addressed peers by `<org>/<repo>[#<branch>]` when the supervisor role already speaks grove / tree / clone. the human: "isnt the point of bhuild that we work in <tree>s, not branches?" and "why even say repo"
- copied `duct:///<tree>` (triple slash for local) from the supervisor, and never asked whether it reads clearly. the human: "why tripple /// ? sus". the cure was `local`, a sentinel `git.grove.prune local` already uses
- mixed glyph layers, because the radio's glyph layers (🦫 voice, 💧 role, 🎙️ device) were never written down

## .provenance

`rhachet-roles-bhuild` @ `beav/feat-phone-text`, stone `1.vision`. five of seventeen human corrections came from this gap.

## .the forbid pair — ship both

a forbid bites faster than a require: a reviewer greps for a forbidden shape, but must reason to spot an absent one. so ship the twin:

**`rule.forbid.peer-synonyms`** — a new term, uri, or glyph for a concept a peer role already names:

| 👎 forbidden | 👍 instead (the peer's extant word) |
|---|---|
| `<org>/<repo>[#<branch>]` as an address | `<grove>/<tree>` (supervisor) |
| `box`, `host`, `machine` | `grove` |
| `///` for local | `local` (`git.grove.prune local`) |
| a fresh glyph for a role that has one | the role's extant mark (💧 dispatcher) |

## .enforcement (proposed)

- a new term, uri, or glyph with no peer sweep on record = nitpick
- a new synonym for a term a peer role already defines = blocker
