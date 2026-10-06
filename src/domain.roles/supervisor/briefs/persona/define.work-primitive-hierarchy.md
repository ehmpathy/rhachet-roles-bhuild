# define.work-primitive-hierarchy

## .what

four `*work` libs sit under `.agent/repo=.this/role=any/skills/work/`, and form a stack: each
layer calls the one beneath it, and is unaware of the one above.

```
   crewwork    ← a CREW of clones on one tree      (bhuild)
   treework    ← a TREE: worktree + branch + pr    (bhuild)
   ───────────────────────────────────────────────────────
   ductwork    ← a DUCT: one addressable keyboard  (bhrowser)
   termwork    ← a TERM: one window a human reads  (bhrowser)
```

## .why the line is there

| half | answers | owner | knows about |
|------|---------|-------|-------------|
| below | how do I reach a keyboard, and show it to a human? | bhrowser | tmux, kitty, sockets, panes |
| above | what work is underway, and who is on it? | bhuild / dispatcher | trees, branches, prs, roles, wishes |

`ductwork`/`termwork` are substrate — true for any human with no clone dispatched; neither
holds an opinion about branches, roles, or work. `treework`/`crewwork` are bhuild's domain
concepts: a tree is one worktree = one branch = one pr (`rule.require.one-pr-per-worktree`); a
crew is the clones that work that tree, standard crew = mechanic + foreman
(`rule.require.duct-name-pattern`).

## .the layers, in full

| layer | unit | what it is | verbs |
|-------|------|------------|-------|
| **fleet** | every crew, every tree | what a supervisor sweeps | `duct.poll`, `git.crew.list` |
| **crew** | the clones on ONE tree | mechanic + foreman | `crew.boot/stop/show/hide` |
| **clone** | one worker | a role: mechanic, foreman | — (addressed via its duct) |
| **tree** | one worktree | = one branch = one pr | `git.tree.behavior`, `git.tree.del` |
| **duct** | one keyboard | a tmux session, addressable | `duct.open/send/read/stop` |
| **term** | one window | a kitty tab a human reads | `term.open/stop/audit` |
| **grove** | one machine | local, or `cloud://<name>` | — (a coordinate, not a verb) |

grove is orthogonal to the stack — where a tree's crew runs, not a rung; every layer takes it
as a coordinate.

## .the composition rule

a layer may call down. it must never call up. `crew.boot` calls `duct.open` and `term.open`;
neither may ever call `crew.*` — unaware a crew exists, which keeps them reusable
(`rule.require.directional-deps`, applied to shell libs).

## .the order crewwork owns

1. **tree** — the worktree must exist; its path is found first
2. **duct** — the tmux session per role, findserted with an explicit `--cwd`
3. **term** — the kitty tab per role; the first role takes the window's base tab

step 2 must precede step 3: `term.open` findserts a duct of its own, and a tab opened against
an absent session creates that session in the caller's directory — a reclaimed mechanic then
opens outside its own worktree. a caller who composes `crewwork` cannot get this wrong; that
is the layer's whole value.

## .the two axes crewwork adds

| axis | turn on | turn off | reversible? |
|------|---------|----------|-------------|
| **work** (ducts) | `crew.boot` | `crew.stop` | ⛔ no — a stopped clone loses its conversation |
| **view** (tabs) | `crew.show` | `crew.hide` | ✅ yes — free both ways |

each verb has an exact inverse, and the pairs never cross — the safe act (hide) is never a
flag on the destructive one (stop) (`rule.require.safe-by-default`).

## .where these libs eventually live

all four ship in `rhachet-roles-bhuild` first — one unit, exercised daily, seam already
drawn here so a later split is a move, never a rewrite. `crewwork`/`treework` stay (bhuild
concepts); `ductwork`/`termwork` eventually move to `bhrowser`, since bhrowser already knows
how to reach and watch a web surface and these two hand it the same pair for a unix terminal
(reach = a duct, watch = a term).

the test for whether a lib belongs below the line: can you describe what it does with no
tree, crew, or pr in the sentence? `crewwork`/`treework` fail that test on purpose — they
stay. which bhrowser role eventually owns the ejected pair is that repo's call
(`rule.forbid.prescribe-how-on-dispatch`).

## .why they live beside the skills, not in `~/`

```bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/ductwork.sh"
```

never `source ~/.bash_aliases.ductwork.sh` — a global copy is one reinstall from erased, and a
conditional load can silently keep an older ambient copy once a shell rc has sourced one.
source unconditionally, by path, so the repo's copy always wins and the eject stays clean — a
lib plus the skills that call it move as one unit.

## .the tmux seam

`DUCTWORK_TMUX_SOCKET` names the tmux SERVER ductwork talks to. `tmux -L <name>` gives each
socket its own server with a separate session namespace, so a test can create, drive, and
kill ducts with no path to the live fleet. threaded through every tmux invocation (18 local
via `__duct_tmux`, 13 remote via `__duct_tmux_cmd`) — completeness is the guarantee, since one
missed call is one path for a test to reach live work (`rule.require.hermetic-tests`).

three properties to hold:

| property | what it means |
|----------|---------------|
| a pane inherits the seam | a `duct.*` call from inside a duct lands on the SAME private server |
| `__duct_tmux_cmd` is a prefix | emits its own tail space; a lost space over ssh yields `tmuxhas-session` |
| an unlinked socket ≠ a dead server | tmux reaches a server through its socket path; unlink a LIVE server's socket and it hides, not stops. converge on the process table, never on reachability |

## .the clamps

| file | subject | substrate |
|------|---------|-----------|
| `work.surface.*.integration.test.ts` | the TEXT of every skill + lib, by subject | none |
| `crewwork.*.integration.test.ts` | crewwork's ORDER + args, via injected fakes | none |
| `ductwork.verbs.integration.test.ts` | the duct verbs against REAL tmux | tmux, private socket |
| `ductwork.pane.integration.test.ts` | what a pane IS — husk, crash, picker | tmux, private socket |
| `ductwork.signal.integration.test.ts` | what a pane SAYS — caps, turns, queues | tmux, private socket |

`termwork` has none — it drives kitty, which needs a display; named in both seeds rather
than left to be found. each clamp ran red against the un-fixed code before it was trusted
(`rule.require.clamp-edge-cases`).

## .the two seeds that carry this out

seeded (radio push — `define.sprout-vs-seed.md`): `ehmpathy/rhachet-roles-bhuild#315` (adopt
all four libs, keep the seam intact) and `ehmpathy/rhachet-roles-bhrowser#8` (the later eject
of `ductwork` + `termwork`). wish bodies: `src/stream/2026.Q3/2026-08-09.dispatch.repo=*.wish.md`.

## .see also

- `pattern.terminal-remote-control.md` — duct vs term, the substrate layer
- `rule.require.duct-name-pattern.md` — `$tree/$role`, and why the role suffix is required
- `rule.require.one-pr-per-worktree.md` — why a tree is 1:1:1 with a branch and a pr
- `term=duct._.choice._.md` — a duct is a row + a session, and they drift
- `rule.require.directional-deps` (architect) — the call-down-never-up rule this applies
- `rule.require.safe-by-default` (ergonomist) — why hide/stop are separate verbs

---

written by human + beaver 🦫
