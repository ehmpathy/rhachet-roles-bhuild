# howto.supervise-routes

## .what

how to observe a crew on a route (a behavior, a declapract.upgrade, any route) without an
interruption of its mechanic, and what you may send it.

## .observe through the foreman seat

the foreman is an empty seat — a bare shell, no clone. run observation commands there;
never in the mechanic's seat, where a command interrupts the worker mid-task.

| seat | purpose |
|------|---------|
| `--who mechanic` | the worker. read it; never type into it |
| `--who foreman` | your shell on the tree — diffs, status, tests |

```bash
# read the worker, with no interruption
rhx git.crew.read --tree $tree --who mechanic

# observe through the foreman seat (it opens in the worktree)
rhx git.crew.send --tree $tree --who foreman --what 'git diff --stat'
rhx git.crew.read --tree $tree --who foreman
```

## .stone approval is the HUMAN's

`route.stone.set --as approved` is a human-only gate (`rule.forbid.self-grant-human-gates`).
never send it into the foreman seat — a shell the supervisor drives is not a human.

once the human has approved, relay the fact the mechanic cannot observe, once:

```bash
rhx git.crew.send --tree $tree --who mechanic --what 'stone approved'
```

that is exception 3 of `rule.forbid.steer-a-clone-beyond-a-permission-key` — you relay the
human, never add yourself. the mechanic knows the route and resumes on its own.

## .see also

- `rule.forbid.steer-a-clone-beyond-a-permission-key.md` — the whole channel to a clone
- `rule.forbid.self-grant-human-gates.md` — why the approval is never yours to send
- `rule.always.entool-the-layer-you-drop-below.md` — why every call here is a crew verb

---

written by human + seaturtle 🐢
