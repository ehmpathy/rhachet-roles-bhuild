# define.camp-mythology

## .what

the supervisor speaks a vocabulary assembled across three repos. this brief restates each
term, with its source repo named, so a reader need not check out a repo they do not hold.

⚠️ a restatement, never the declaration — where it disagrees with the source cluster named
per row, the source wins.

## .the stack

```
camp              1 aws account — the elastic container of groves + their shared services
 └─ grove         0..N hibernation-ready ec2 work-boxes; elastic, self-hibernated when idle
     ├─ camper    1 OS login — the door every crew member enters by
     ├─ ground    1 OS login — the PRIVILEGED one; where root work happens
     └─ tree      0..N git worktrees on the box
         └─ crew  the seats on one tree
             └─ clone   1 actor instance per seat
```

## .the terms

| term | it IS | it is NOT | declared in |
|---|---|---|---|
| **camp** | an aws **account** that holds an elastic set of groves + the vpc / nat / iam / cross-account reach they share | an env, a fleet, a workspace, or merely "an account" | `sandpine/infrastructure` |
| **grove** | a hibernation-ready cloud **work-box** in a camp — many git trees, durable authorized keys, hibernates itself after idle | an ec2, a vm, a devbox, a sandbox | `sandpine/infrastructure` |
| **camper** | the **OS login user** the crew ssh in as, and whose `~/.ssh/authorized_keys` the crew keys land on | 🔴 a clone. `clone-user`, `crew-user`, `grove-user`, `ec2-user`, `ubuntu`, `login-user` are **forbidden** synonyms | `sandpine/infrastructure` |
| **ground** | the **privileged** OS user — `NOPASSWD` sudo, `authorized_keys` = admin key only | the camper. two logins, and that split is the whole boundary | `sandpine/infrastructure` |
| **clone** | a live (or revivable) instance of an **actor**; shares its actor's brain, roles, config, and differs from peers only by **session** | a session, an instance, a process, a thread | `ehmpathy/rhachet` |
| **tree** · **crew** | a git worktree on a grove · the seats on one tree | — | this role (`glossary.of=supervisor.md`) |

`login-user` is forbidden because `ground` is a login user too — "the login user" would name
two logins, so it names neither.

## .the seam — the VERB is ours, the NOUN is not

a clone **camps out** on a grove — that verb is the metaphor's root. `camper` is the door it
enters by, never the worker that walks through. one camper per grove
(`CAMP_GROVE_CAMPER_USER = 'camper'`), many clones per grove — so "each clone has its camper"
is false. per-clone os users are a future state, not the current one.

## .the safety half — camper and tier are ORTHOGONAL

this is why the brief boots at `say`, not `ref` — a safety claim, not a vocabulary one.

> **IMDS (`169.254.169.254`) authenticates no caller and checks no uid.** a camper with zero
> sudo already holds the grove's entire badge — prep power, prod reader, keyrack
> read/write/**delete**, `ec2:StopInstances` on every hibernatable box — by one unprivileged
> `curl`.

| boundary | bounds | tighten it to |
|---|---|---|
| **camper** | the **box** | keep the hibernate timer and ssm watchdog tamper-proof, isolate campers from each other, make per-clone users possible |
| **the grove role's tier** | **AWS** | shrink real blast radius |

a control on one buys none of the other. a supervisor that tightens sudo and believes the
blast radius shrank is wrong. full argument: `rule.forbid.camper-sudo` in
`sandpine/infrastructure`.

## .the test

before you act on any of these words, ask "which of the six?"

- the aws account → **camp**
- the box → **grove**
- the unprivileged OS login → **camper**
- the privileged OS login → **ground**
- the worker → **clone**
- an aws permission boundary → **tier**, never camper

## .enforcement

- `camper` used to mean a clone (or the reverse) = **blocker**
- a claim that a camper control shrank AWS blast radius = **blocker** (the IMDS trap above)
- `grove` used interchangeably with `ec2` / `vm` / `sandbox` in a durable artifact = **nitpick**
- `camp` used to mean a deploy env (`test` / `prep` / `prod`) = **blocker** (a camp is a place
  clones work, never a rung)

## .see also

- `glossary.of=supervisor.md` — this role's own words: grove (purpose, tunnel, saturation), crew, tree.achievement
- `rule.require.speak-at-the-supervisor-layer` — which of these words a verdict may be about
- `sandpine/infrastructure:.agent/repo=.this/role=any/briefs/domain.terms/` — the source clusters for
  camp, grove, camper, ground, tier, reach
- `ehmpathy/rhachet:.agent/repo=.this/role=any/briefs/domain.terms/term=clone._.choice._.md` — the
  source cluster for clone

---

written by human + beaver 🦫
