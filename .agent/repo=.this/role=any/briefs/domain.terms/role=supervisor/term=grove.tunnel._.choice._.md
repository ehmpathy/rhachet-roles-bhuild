# domain.term: grove.tunnel

term.chosen   = tunnel
term.kind     = noun
term.boundary = grove
term.synonyms.forbidden:
- duct
- port-forward
- forward
- session
- link
- pipe

## .what

the **network path that carries every reach to one grove**. today it is the camp tailnet:
ssh, as `camper`, to the grove's tailnet name on `:22`.

```
camper@grove-sandpine-hetzner-v20261022:22   (over the tailnet)
```

one tunnel per grove. every ssh, every `duct.read`, every `duct.send`, and every kitty
window on that grove rides it. its address is a grove row's **reach**
(`work/grovework.sh`: host, port, user). two roads carry that one address:

| road | who rides it | its writer |
|---|---|---|
| the row, pinned on the ssh argv | `git.grove.wake`, `git.grove.list`, `git.grove.saturation`, `.spend` | the registry (`git grove set`) |
| the `~/.ssh/config` alias, `Host <grove>` | every crew and duct verb (`ssh <grove>`) | `git.grove.wake` alone — so a grove never woken from this machine has no alias, and its cure is the wake, even at power `none` |

the alias is a copy of the reach, never a second source: it is converged only when ssh, asked for
the alias, dials the row's host, port, and user (`__grove_alias_converged`).

## .the layers it sits between

a tunnel is its own layer, and it fails apart from the two around it:

| layer | what it is | how it dies |
|---|---|---|
| **box** | the machine — an ec2 instance (power `aws`) or a box that is always on (power `none`) | stopped or hibernated (aws only) |
| **tunnel** | the tailnet path to the box | this machine is not a peer · the grove left the tailnet · its tailnet name drifted |
| **crew** | the tmux sessions on that box | felled, or the box died under them |

## .the discriminator — ssh's own words name the layer

over the tailnet an offline peer **drops** the syn; it never refuses it. so:

| ssh said | the layer | the cure |
|---|---|---|
| `connect to host … timed out` | no answer: box asleep, or off the tailnet | per power: `rhx git.grove.wake <grove>` (aws) · `tailscale status`, then `tailscale ping <host>` (none) |
| `Could not resolve hostname` | the **tunnel**: not a peer, or the name drifted | `tailscale status` — find the grove's live name, then fix the row's `.host` |
| `Connection refused` | the tunnel is **up**; no sshd on the row's port | is sshd up, and is the port right? — never the tailnet checks |
| `banner exchange … timed out` | the tunnel is **up**; the box is starved | `rhx git.grove.saturation <grove>` — never a wake, whatever the power |

⇒ the per-power cure is one transformer, `__grove_unreached_cure`, so every hint names the same one.

## .what a tunnel's death does NOT touch

the crews. tmux runs on the box, so a lost tunnel takes the **view** and never the **work**.

## .refs

- `work/grovework.sh` — the reach transformer (`__grove_reach_of`), the ssh opts that pin
  `HostName`, and the no-answer cure
- `git.grove.wake.sh` — powers an aws box up, then awaits ssh over the tunnel
- `git.grove.list.sh` — probes each grove's tunnel for an ssh banner
- `git.grove.send.sh` · `duct.read.sh` · `duct.send.sh` — every remote reach rides it

## .reason

see `term=grove.tunnel._.choice.reason.md` — the etymology, the ssm era this term outlived,
and the `duct` overload this term settles.
