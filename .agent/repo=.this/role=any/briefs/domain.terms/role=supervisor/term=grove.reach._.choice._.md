# domain.term: grove.reach

term.chosen   = reach
term.kind     = noun
term.boundary = grove
term.synonyms.forbidden:
- endpoint
- address
- target
- dest

## .what

**where, and as whom, the tailnet gets to a grove's box**: one host, one port, one user.

```
camper@grove-sandpine-hetzner-v20261022-1:22
```

reach is one of a grove's two axes. the other is **power** (whether a box must be switched on
first). reach is read the same way for every grove, whatever its power.

## .how a row yields it

| field | from | fallback |
|---|---|---|
| host | `.host`, unless it is a loopback relic (`localhost`, `127.0.0.1`, `::1`) | `.exid`, then `.name` |
| port | `.port`, unless the host was a loopback relic | `22` |
| user | `.user` | `camper` |

an empty field reads as absent. a field outside its ssh grammar, or a `type ec2` row with no
`account`, makes the row unreadable: the reader names the cause and the fix, and exits 2.

## .two roads, one reach

- the **row** road: wake, list, saturation, spend pin host, port, and user on the ssh argv
- the **alias** road: crew and term verbs ride `Host <grove>` in `~/.ssh/config`, which only the
  wake writes. the alias is converged only when ssh, asked for it, dials the reach

## .refs

- `src/domain.roles/supervisor/skills/work/grovework.sh` — `__grove_reach_of` (fields 2–4),
  `__grove_reach_ssh_opts`, `__grove_alias_converged`
- `src/domain.roles/supervisor/skills/git.grove.list.sh` — `--json` carries `reach{host,port,user}`
- `term=grove.power._.choice._.md` — the other axis
- `term=grove.tunnel._.choice._.md` — the path a reach rides

## .reason

see `term=grove.reach._.choice.reason.md`.
