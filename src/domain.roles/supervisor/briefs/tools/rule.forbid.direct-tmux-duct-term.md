# rule.forbid.direct-tmux-duct-term

## .what

never call `tmux`, or a bare `duct.*` / `term.*` shell function, directly. every call goes
through an `rhx` skill.

for a supervisor the bar is higher: the skill must be a **crew verb** (`rhx git.crew.*`),
never `rhx duct.*`. this rule bans the raw function; `rule.always.entool-the-layer-you-drop-below`
bans the layer, and its substitution table is what you actually type.

## .why

an `rhx` skill carries what a raw call does not:

- **session name conversion** — tmux turns dots into underscores; the skill handles it
- **findsert semantics** — `open` finds an extant session or creates one
- **required `--cwd`** — a session cannot start in an invalid directory
- **argument validation** — a clear error on an absent arg, rather than a silent no-op
- **rhachet tracked** — logged, metered, observable
- **permission filter** — internal flags (`--skill`, `--repo`, `--role`) are stripped

a raw call bypasses every one of them and fails silently or confusingly.

## .the ladder

| ⛔ never | ⚠️ the substrate skill | ✅ what a supervisor types |
|---|---|---|
| `tmux has-session -t 'my.session/mechanic'` | — | `rhx git.crew.poll` |
| `duct.open --on my.session` | `rhx duct.open` | `rhx git.crew.boot` |
| `duct.send --on my.session --what '…'` | `rhx duct.send` | `rhx git.crew.send --tree <tree> --who <role>` |
| `duct.read --on my.session` | `rhx duct.read` | `rhx git.crew.read --tree <tree> --who <role>` |
| `duct.stop --on my.session` | `rhx duct.stop` | `rhx git.crew.stop` |
| `term.open --via kitty --on my.session` | `rhx term.open` | `rhx git.crew.show` |

the middle column is legitimate **only** for the three drops
`rule.always.entool-the-layer-you-drop-below` names — while you entool a crew verb, when the
substrate IS the subject, or mid-diagnosis. the left column is legitimate nowhere.

## .exception

`crewwork.sh` and its peers call the raw functions internally, with pre-converted names. that is
the implementation of the skills, not a call around them.

## .enforcement

- a raw `tmux` / `duct.*` / `term.*` call = **blocker**
- an `rhx duct.*` call typed by a supervisor, where a crew verb exists = **blocker**
  (`rule.always.entool-the-layer-you-drop-below`)

## .see also

- `rule.always.entool-the-layer-you-drop-below.md` — the substitution table a supervisor types
  from; this rule is its floor, not its replacement

---

written by human + seaturtle 🐢
