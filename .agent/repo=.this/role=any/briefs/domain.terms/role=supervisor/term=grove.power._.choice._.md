# domain.term: grove.power

term.chosen   = power
term.kind     = noun
term.boundary = grove
term.synonyms.forbidden:
- cloud
- provider
- platform
- host type

## .what

the **lever that switches a grove's box on**, if it has one. two values:

| power | the row holds | what it means |
|---|---|---|
| `aws` | `account` | an ec2 box. it sleeps, and `git.grove.wake` powers it up through aws |
| `none` | no `account` | a box that is always on (e.g. hetzner). there is no lever; it does not sleep |

power is one of a grove's two axes. the other is **reach** (host, port, user: how the tailnet
gets to it). the two never mix: reach is the same for every grove, and power only decides
whether a box must be switched on before reach is tried.

## .what it decides

- whether `git.grove.wake` runs keyrack, account guard, nat, and box legs (`aws`) or none
- the wake's default `--timeout`: 300s after an aws resume, 10s for `none`
- the cure for a silence (`__grove_unreached_cure`): `aws` → `wake it — rhx git.grove.wake <grove>`;
  `none` → `check the tailnet — tailscale status …, then tailscale ping <host>`. a refusal or a
  mute is no silence: its cure follows the cause, whatever the power

## .refs

- `src/domain.roles/supervisor/skills/work/grovework.sh` — `__grove_reach_of`, field 1
- `src/domain.roles/supervisor/skills/git.grove.wake.sh` — the aws legs gate on it
- `src/domain.roles/supervisor/skills/git.grove.list.sh` — `--json` carries `power` beside `reach`
- `term=grove.reach._.choice._.md` — the other axis

## .reason

see `term=grove.power._.choice.reason.md`.
