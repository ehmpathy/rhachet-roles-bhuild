## .what

new rule `rule.require.skill-noun-verb-grammar` in mechanic, beside `rule.require.get-set-gen-verbs`:

- a skill is named `<noun>` (dotted, noun-only): `phone.text`, `phone.contacts`, `radio.task`
- every act is a `get | set | del` subcommand: `rhx phone.text set`, `rhx phone.text get`, `rhx phone.text del`
- no process or action verbs in the name or the subcommand: `send`, `start`, `stop`, `talk`, `list`, `add`, `remove`
- every noun with a `set` considers a `del`. "if you can set it, can you del it?" is a required question, not an optional prompt

## .why

`rule.require.get-set-gen-verbs` covers domain.operations and dao methods only. the skill surface (`rhx <noun> <verb>`) is out of its scope, and the "imperative command" exemption lets `start`/`stop`/`send` through. so a vision for a new skill family made up verbs on the fly, and the human had to say each fix:

- `phone.send` → `phone.talk set` → `phone.{text,call,contacts}`, each `get|set|del`
- `phone.get` sat outside the grammar beside `phone.text get|set|del`
- `phone.daemon start | stop | get` used process verbs (`set` finds the live daemon or starts one; `del` stops it)
- the human had to ask for `del` on texts (withdraw while QUEUED) and on contacts (revoke)

## .provenance

`rhachet-roles-bhuild` @ `beav/feat-phone-text`, stone `1.vision`. four of seventeen human corrections in one vision pass came from this gap.

## .the forbid pair — ship both

a forbid bites faster than a require: a reviewer greps for a forbidden shape, but must reason to spot an absent one. so ship the twin:

**`rule.forbid.verbs-in-skill-names`** — a skill name or subcommand that is a process or action verb is forbidden:

| 👎 forbidden | 👍 instead |
|---|---|
| `phone.send`, `phone.talk` | `phone.text set` |
| `phone.get` beside `phone.text` | `phone.text get` |
| `phone.daemon start` / `stop` | `phone.daemon set` / `del` |
| `*.list`, `*.add`, `*.remove` | `get` / `set` / `del` |

## .enforcement (proposed)

- a skill whose name holds a verb = blocker
- a subcommand outside `get | set | del` with no recorded reason = blocker
- a noun with `set` and no `del`, and no recorded reason = nitpick
