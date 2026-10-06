# domain.term: duct

term.chosen   = duct
term.kind     = noun
term.synonyms.forbidden:
- session
- tmux session
- pane
- terminal
- tab
- channel

## .what

an **addressable channel to one worker's keyboard**, named by a uri:

```
duct://<host>/<tree>/<role>     a remote duct
duct:///<tree>/<role>           a LOCAL duct — note the three slashes
duct:///<name>                  a human's own shell, one segment, NOT a dispatch duct
```

a duct is what a supervisor sends to, reads from, and polls. it is the unit the whole
`duct.*` family operates on.

## .the two parts a duct is made of

this is the distinction the word most needs, because every failure mode lives in the gap
between them:

| part | what it is | where it lives |
|---|---|---|
| **row** | the registration that says this duct exists | `~/.ductwork/ducts/<tree>/<role>.json` |
| **session** | the substrate that actually serves it | a tmux session |

`duct.open` writes both. `duct.stop` removes both. naught reconciles them, so they can drift:

- a **phantom** = a row whose session is gone → `duct.poll` reports `💥 malfunction`
- a **duplicate** = two rows for one session → the fleet count exceeds the live count

neither part IS the duct. the row is its registration; the session is its substrate.

## .refs

declared across the `duct.*` skill family at `.agent/repo=.this/role=any/skills/`:

- `duct.open.sh` · `duct.stop.sh` — write and remove BOTH parts
- `duct.list.sh` — enumerates **rows** (from cache, never from tmux)
- `duct.poll.sh` — derives its fleet from rows, then reads each **session**
- `duct.read.sh` · `duct.send.sh` — address a **session**
- `duct.reboot.sh` — respawns the session's **pane**, keeps the duct
- `duct.refresh.sh` — repaints attached **terminals**, touches neither part
- `term.audit.sh` — joins live ducts against the kitty registry

implementation: `~/.bash_aliases.ductwork.sh`

## .reason

see `term=duct._.choice.reason.md` — etymology, the r44 claim this corrects, and the
evidence.
