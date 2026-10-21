# F15 — the ducts keep a default `DUCT_CLAUDE_MODEL`

## .the fork

`work/ductwork.sh:48` stamps `ANTHROPIC_MODEL` into every duct's tmux env, default
`claude-opus-5-5[1m]`, override via `DUCT_CLAUDE_MODEL`. peer `enroll-impl-arch-defects`
blocker 13 asks for an empty default: a fixed id overrides the consumer's choice and breaks when
the id retires.

- **A** — keep the default; the env var is the override
- **B** — default to empty; set the env only when a caller names a model

## .taken — A, and why at the time

the default is a measured cure, not a preference. `rhachet enroll` gives each clone its own
`CLAUDE_CONFIG_DIR`, whose `settings.json` names no model, so a clone took claude's built-in
default whatever the human's `~/.claude` said (measured 2026-09-28, grove v20260901). an empty
default puts that defect back, silently, on every boot, reboot, heal, and hatch.

the consumer's choice is not lost: `DUCT_CLAUDE_MODEL` names any model. the retire risk is real,
but a retired id fails loud at the clone's first turn, where an empty default fails silent on a
model the human never chose.

## .rework — clean

one default on one line; B is `DUCT_CLAUDE_MODEL="${DUCT_CLAUDE_MODEL:-}"` plus a guard on the
`tmux -e` arg.

## .confidence — 75%, and why it is low

the 2026-09-28 cure predates rhachet 1.49. if 1.49's per-actor settings now inherit the human's
model, the default is redundant and B is right. not verified on this tree.

## .where

`src/domain.roles/supervisor/skills/work/ductwork.sh:42-48`

## .verdict

open — for the council.
