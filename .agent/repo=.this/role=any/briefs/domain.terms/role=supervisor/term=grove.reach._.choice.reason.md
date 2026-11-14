# domain.term.reason: grove.reach

## .etymology

`reach` is the word every verb here already used for the act — "reach a grove", "the wake
reaches it", `__grove_reach_of`. the noun names what that act needs: host, port, user.

rejected:

- **endpoint** — a network word with no user in it; a reach as `ground` and a reach as `camper`
  to one host:port are two reaches, one endpoint
- **address** — reads as host alone, or host:port; drops the user the same way
- **target** — already loaded in this role (a tree target, a crew target)
- **dest** — an ssh option name (`-o` style), so it would read as config, not as the domain fact

## .evidence

- the vision split a grove along two axes, power and reach, so a hetzner box and an ec2 box
  differ only in power (`1.vision.yield.md`, the outcome world)
- the reader emits exactly these three fields after power, and every caller pins exactly
  these three on the ssh argv (`__grove_reach_ssh_opts`, `GROVE_HOST`/`GROVE_PORT`/`GROVE_USER`)
- the list `--json` contract carries `reach{host,port,user}` as its own field, apart from `power`

## .invariants

- reach is read from the row alone; no verb derives it from the alias
- a loopback host is an ssm-era relic, so it reads as absent, and its port with it
- an alias is converged ⟺ ssh, asked for it, dials the row's host, port, and user. an alias equal
  to its host is no exemption: with no entry, ssh dials as the local user
