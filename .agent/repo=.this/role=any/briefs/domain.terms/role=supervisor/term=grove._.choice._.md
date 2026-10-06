# domain.term: grove

term.chosen   = grove
term.kind     = noun
term.synonyms.forbidden:
- box
- host
- machine
- instance
- node
- server
- remote
- runner

## .what

the **machine a tree's crew runs on**.

```
local                      this machine
cloud://<groveslug>        a remote grove, as the --grove flag writes it
duct://<groveslug>/…       the same grove, as a duct uri writes it
duct:///…                  local — an EMPTY authority means this machine
```

🔴 **the pair above splits on the WRONG AXIS.** it conflates *"is it this machine?"* with *"who owns
it?"*, and that holds only while every non-local grove is rented. corrected 2026-09-13, and **not
yet implemented** — see `term=grove.house`.

the axis is a **flat triple** — three peers, no subtypes, no aliases:

```
LOCATION                                                         spoken / flag
─────────────────────────────────────────────────────────────────────────────
local        the machine you are at — monitor, keyboard,       →  `local`
             the supervisor's own session
house        the house owns and operates it; reached over      →  `house`
             a wire
cloud        the house rents it                                →  `cloud`
```

⚠️ **a machine the house owns, reached over a network, is neither `local` nor `cloud`.** with no word
it files under `cloud://` and the vocabulary then asserts a vendor holds the machine — false, and
acted on for disk custody, 3am recovery, and what a cancellation costs. that machine is `house`.

🔴 **the triple has TWO seams, and that is why a pair could never hold it:**

- `local` ↔ `house` differ on **reach** — a wire, a credential, a tunnel that can drop
- `house` ↔ `cloud` differ on **custody** — the disk, 3am hands, what a cancellation costs

⇒ `local` earns its own word for the first seam: **it is the one grove with no reach layer** — no
ssh, no tunnel, no tailnet, no cross-network identity. every custody property it shares with
`house`.

⇒ the flag and uri above still take two values today. **the words exist ahead of the parser**, and
how `house` spells its authority is deliberately unsettled — see
`term=grove.house._.choice.reason.md`, which records **four** resolved disputes: the two that
retired `close` and then `touch` as overloaded, the one that refused `blind` as a flag value, and
the one that tried a subtype nest and dropped it.

## .grove is a COORDINATE, not a rung

every other word in this stack sits on a ladder: a crew is on a tree, a tree holds ducts, a fleet
spans crews. **grove sits beside all of them** — it answers *where*, never *what*.

| layer | what it names | grove's relation |
|---|---|---|
| fleet | every crew, every tree | a fleet may span groves |
| crew | the clones on one tree | a crew runs ON a grove |
| tree | one worktree = one branch = one pr | a tree lives on a grove |
| duct | one addressable keyboard | a duct's uri authority IS its grove |

so a crew is the same crew on `local` or on `cloud://grove-ehmpathy-v20260811`. the grove changes
where it runs and naught about what it is.

## .a grove NAME carries a date, and is rebuilt rather than mutated

the shape is `grove-<org>-v<date>`. `declastruct-aws` owns the resource, and its design is that a
rebuild takes a **NEW name** rather than a mutation in place — so a replaced box cannot inherit its
predecessor's ssm key-track path, and a fixed-width date cannot prefix another (where an ordinal
could: `grove-ehmpathy-1` prefixes `grove-ehmpathy-10`).

**the consequence binds every reader:** a grove instance written into prose is stale within a day by
construction. cite the **shape**; read the **registry** for the instance.

## .a grove is NOT

- **a tree, a crew, or a duct** — those are what runs; a grove is where
- **a camp** — a **camp CONTAINS groves**, and that relation is now settled rather than suspected:
  a camp is *"an elastic container of groves — one aws account that holds a variable set of grove
  work-boxes plus the shared services they need."* elastic = the grove count is not fixed; a camp
  grows a grove-N on demand, and each hibernates itself when idle
  ⇒ ⚠️ **FOREIGN** — the cluster lives in `ahbode/infrastructure`, never here. read it with
  `rhx git.repo.get lines --in ahbode/infrastructure --paths '.agent/**/term=camp._.choice._.md'`
  ⚠️ this bullet read *"appears to BOUND … `camp` is not yet itemized"* until 2026-09-06. it was
  itemized the whole time, one repo over — see this rule's `.reason` for the `partial audit` that
  hid it
- **reachable ≠ at work** — a grove can be up, ssh-reachable, and hold only a bare shell. the duct
  layer cannot part *"the box is down"* from *"the box is up and idle"*

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `work/crewwork.sh` — `--grove local | cloud://<groveslug>` on every crew verb
- `git.crew.open.sh` · `git.crew.boot.sh` · `git.crew.stop.sh` · `git.crew.show.sh` ·
  `git.crew.hide.sh` — each takes `--grove`
- `work/ductwork.sh` — the duct uri, whose **authority** is the grove
- `define.work-primitive-hierarchy.md` — grove as a coordinate beside the stack
- `rule.require.speak-at-the-supervisor-layer.md` — grove as one of the four supervisor-layer words

## .reason

see `term=grove._.choice.reason.md` — etymology, the OPEN dispute over its two written forms, and
the evidence.

---

written by human + beaver 🦫
