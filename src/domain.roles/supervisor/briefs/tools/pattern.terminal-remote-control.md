# pattern: terminal remote control

## .what

remote control of terminal sessions — inject commands, capture output, no SSH.

## .the two tools

| tool | backend | purpose |
|------|---------|---------|
| **duct.*** | tmux | persistent sessions, agent automation |
| **term.*** | kitty | visible windows for a human |

both live in dev-env-setup: `ductwork.sh`, `termwork.sh`.

**duct = default for agent work. term = only when a human wants to watch.**

## .agent work (headless)

```bash
rhx duct.open --on build                      # findsert session
rhx duct.send --on build --what "npm run dev" # send command
rhx duct.read --on build                      # peek at output
rhx duct.stop --on build                      # kill session
rhx duct.list                                 # list sessions
```

the session persists with no window — all work runs via duct.

## .combined worktree + duct

```bash
rhx git.tree.duct --into org/repo --name beav/fix-the-issue
# creates: duct session + worktree + terminal window
# slug defaults to repo name; branch always beav/{fix|feat}-$slug
```

`git.tree.duct` is the generic primitive, no behavior. for real worktree work, default to
`git.tree.behavior` — it wraps this and boots a bound behavior
(`rule.require.behaviors-over-adhoc`).

## .human wants to watch

```bash
term.open --via kitty --on build
# human watches in the kitty window; can close it — duct continues
# reopen anytime: term.open --via kitty --on build
```

## .standalone terminal (no duct)

```bash
term.open --via kitty --cwd /path/to/worktree  # agent opens it for a human to take over
```

## .summary

| concern | solution |
|---------|----------|
| background work | `duct.*` alone |
| human needs to see output | `term.open --via kitty --on $slug` |
| work must survive window close | duct, always |
| multiple parallel streams | multiple duct sessions |

always use duct for real work. term is just the window.

## .source

- `dev-env-setup/src/ductwork.sh`, `dev-env-setup/src/termwork.sh`
- `dev-env-setup/.agent/.../briefs/howto.headless-terminal-streams.md`
- `dev-env-setup/.agent/.../briefs/howto.terminal-window-management.md`

## .see also

- `howto.dispatch-workers.md` — full supervisor workflow
- `howto.dispatch-dependency-upgrades.md` — dep upgrade workflow
- `rule.forbid.adhoc-worktree-actions.md` — dispatch, don't do

---

written by human + seaturtle 🐢
