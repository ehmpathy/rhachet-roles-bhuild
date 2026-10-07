# domain.term.choice.reason: grove

## .etymology

`grove` was already this repo's word before this file. it is live in `crewwork.sh` as a flag on
every crew verb, live in the duct uri as an authority, and named in
`define.work-primitive-hierarchy.md` as *"the machine a tree's crew runs on"*. so this cluster
records a term already in real, load-carrying use — never one coined at a keyboard.

the word extends the garden metaphor the dispatch pair already set (`sprout` / `seed`). a grove is
where trees stand — so a machine that hosts trees is a grove, and the relation needs no gloss. it
was not chosen to complete a metaphor; it fits one already in place, which is the cheapest kind of
fit a term can have.

## .why the forbidden synonyms distort

| ⛔ synonym | why it distorts |
|---|---|
| `box` | slang, and it names the tin rather than its role. a grove is defined by what it hosts |
| `host` | already taken twice over — a uri authority is a *host* in rfc terms, and the ssh config calls its entries `Host`. to make it the domain word would overload one term across two layers |
| `machine` | generic, and it invites the reader to picture hardware. a grove may be a vm, a container, or this very laptop under the name `local` |
| `instance` | aws's word for an ec2 resource. a grove is the DOMAIN concept; its ec2 instance is one way to realize it, and the two must be able to disagree |
| `node` | cluster jargon, and it implies membership in a scheduler that does not exist here |
| `server` | implies it serves requests. a grove hosts work; naught calls it |
| `remote` | names one VALUE of the term, not the term. `local` is a grove too, and a word that excludes the common case is not the word |
| `runner` | ci jargon (`gh` runners), and it implies ephemerality. a grove is long-lived and holds ducts across sessions |

## .the evidence

### it is a COORDINATE, and the stack proves it

`define.work-primitive-hierarchy.md` lists grove apart from the ladder, with the note that it is
*"orthogonal to the stack — it is where a tree's crew runs, not a rung on the ladder."*

the mechanism corroborates that: `--grove` is a flag on every crew verb rather than a layer any of
them compose. `crew.boot --grove cloud://X` boots the same crew that `crew.boot --grove local`
would; the verb, the roles, and the tree are unchanged. a rung would change what the verb does. a
coordinate changes only where.

### the NAME shape, and what settled it — 2026-08-13

`declastruct-aws` renamed the resource on 2026-08-10, and its reasons belong to it rather than to
us. two of them bear on the term:

- **a rebuild takes a NEW name.** a replaced box cannot then inherit a predecessor's ssm key-track
  path — an incident cited in that repo: a track param keyed on a stable exid survived a rebuild,
  and reconcile decided KEEP on a box whose disk had been wiped.
- **a date cannot prefix another.** an ordinal can: `grove-ehmpathy-1` is a strict prefix of
  `grove-ehmpathy-10`, so a prefix match over ordinals is a latent collision.

so the shape is `grove-<org>-v<date>`, and **a grove instance has a half-life of about a day.**

this glossary learned that the hard way. `term=crew._.choice.reason.md` carried the instance name
`v20260810` for rounds, plus an OPEN question about a `.ground` suffix and an org mismatch. on
2026-08-13 the live registry read `grove-ahbode-`**`v20260811`** — a THIRD name. the org mismatch was
a comparison of a source `declaration` against a live state; and the ordinal had moved, because a
rebuild is a rename by design.

**the rule that follows:** cite the SHAPE in prose, read the REGISTRY for the instance. a name
written down is a fact with a one-day half-life, and this file will not repeat that.

### ⚠️ the suffix is REAL — and it corrects the rule above the same day

the paragraph above once read *"the suffix was a transcription error of mine"*. it was not. a glob of
`~/.ductwork/` holds **four** host registrations —

```
grove-ahbode-v20260810.json          grove-ahbode-v20260811.json
grove-ahbode-v20260810.ground.json   grove-ahbode-v20260811.ground.json
```

— and the live duct's own json names `grove-ahbode-v20260811.ground`, suffix included. so the fleet
carries **two names per date for at most two machines**, which is a synonym in a host registry and a
real defect (see `term=crew._.choice.reason.md` for the full account).

**how the wrong claim was reached, and why the rule above is insufficient:** `duct.poll` and
`duct.list` print ONE name per duct — the `host` field of a live row. neither can print a host
registration that no duct points at, so three of four sat outside the read by construction. *"read
the REGISTRY"* is what i did; it misled me because i read what the registry PRINTS rather than what
it HOLDS.

**so the rule takes one more clause:** cite the SHAPE in prose, and read the registry's **files** for
the instance. a tool that prints one name cannot tell you it is one of four.

### ⚠️⚠️ the suffix is real AND the row ALTERNATES — 2026-08-13, the mechanism found at source

the section above says *"the live duct's own json names `grove-ahbode-v20260811.ground`, suffix
included."* a direct read of that same file one round later says:

```json
{ "host": "grove-ahbode-v20260811", "createdAt": 1786647412000 }
```

**unsuffixed.** and in the SAME sweep, minutes apart, one instrument printed both forms:

| the read | what it said |
|---|---|
| `duct.poll --brief` | `duct://grove-ahbode-v20260811/main/mechanic` |
| `duct.poll --brief --changed`, minutes later | `duct://grove-ahbode-v20260811`**`.ground`**`/main/mechanic` |
| the duct's own json, read directly | `grove-ahbode-v20260811` |

the earlier instinct — *"one of us misread"* — is **wrong in both directions.** the mechanism is in
`work/ductwork.sh` and it makes the row genuinely unstable:

1. `duct.list --refresh` enumerates the hosts dir with `find` and calls `__duct_refresh_host` once
   per registration
2. `__duct_refresh_host` lists that host's sessions and **writes a duct row per session, keyed under
   the host it was enumerated from**
3. two registrations point at ONE machine, so both yield the same `main/mechanic` — and the row is
   **last-writer-wins, with `find` order deciding**

so r98 and this round each read a true value of a field that alternates. neither misread.

> ⚠️ **stated at the confidence obtained.** steps 1–3 are read from source. that a refresh actually
> ran between the two polls is **not** verified — a plain `duct.list` reads cache. so the mechanism
> is established; the trigger for this particular alternation is not.

#### corroborated two days on — and it CORROBORATES rather than sharpens

2026-08-15, across three consecutive babysit ticks: t29 read the row **unsuffixed**, t30 read it
**suffixed**, t31 held the suffix. so the alternation is not a one-day fluke — it survived a
machine-day boundary, unrepaired, and it is still last-writer-wins.

it earns its lines for one reason only: **a defect seen once may be a fluke; seen again two days
later it is stable**, and this one is recorded-not-repaired, so a reader needs to know the record
has not gone stale. it buys naught else — my own first instinct was that a tick-apart observation
*sharpened* the "minutes apart" bound above, and it does not. three ticks span ~45 minutes; the
2026-08-13 read caught both forms inside ONE sweep, which is strictly the tighter bound.

recorded because the instinct was wrong, and a later round may reach for the same one.

#### what this adds — a registry synonym CORRUPTS, where a prose synonym merely confuses

`rule.forbid.domain-term-synonyms` indicts a synonym for the clarity it costs a reader. that framing
undersells this case by a wide margin:

| where the synonym lives | what it costs |
|---|---|
| prose, a contract, a brief | a reader disambiguates — friction |
| **a REGISTRY that is enumerated** | **every pass rewrites one subject under a different key — the state itself is nondeterministic** |

the second is not a naming wart. it is a data defect wearing a naming wart's clothes, and it will not
be found by anyone who reads the registry once, because a single read always returns one honest
value.

#### the irony worth recording

`declastruct-aws` moved groves from ordinals to dates for a stated reason: *"a fixed-width date cannot
prefix another, where an ordinal could — `grove-ehmpathy-1` is a strict prefix of
`grove-ehmpathy-10`."* the rename removed that hazard at the naming layer.

`grove-ahbode-v20260811` is a strict prefix of `grove-ahbode-v20260811.ground`. **a suffixed variant
reintroduces, one layer down in ductwork's host registry, precisely the collision the date scheme was
adopted to eliminate.**

**recorded, not repaired.** which form is canonical belongs to ductwork's owner and to
`declastruct-aws`, which mints the name. what is owed alongside the pick: a sweep of the hosts dir, so
the loser's registration is removed rather than left to win the next `find`.

### reachable ≠ at work — the distinction the duct layer cannot draw

for ~90 rounds a babysit prompt carried *"`duct://grove-*` is a hibernated remote and reports 💥
every tick — known, not actionable."* on 2026-08-13 the row flipped to `🌊 changed` and read a live
pane: a bash prompt at `camper@ip-10-20-2-97`, a scrollback of backgrounded provision commands, and
no claude session anywhere.

so all three clauses of that line were wrong except its verdict:

| the claim | the verdict |
|---|---|
| hibernated | **refuted** — the box is up |
| 💥 every tick | **refuted** — it reads clean |
| not actionable | **upheld, for a NEW reason** — a bare shell, no clone, naught to act on |

that is the property the term must carry: **a grove has a liveness axis and a work axis, and they
are independent.** up-and-idle, up-and-at-work, and down all matter to a supervisor, and the duct
layer renders the first and third identically until the box answers.

it also supplies the term's sharpest cautionary note. the verdict was RIGHT for ~90 rounds on a
reason that was wrong the whole time, and no outcome ever contradicted it. a correct act on a wrong
reason emits no signal, so only a deliberate read finds it — and two prior audits (`ssh -G`, three
consecutive polls) each narrowed the question and never reached it. what finally settled it was the
box back up, which is an **expiry**, not a solution, and reads exactly like one.

### a grove hosts DUCTS, and that is the tie to the rest of the stack

a duct uri's authority is its grove:

```
duct://grove-<org>-v<date>/main/mechanic        a remote grove — the SHAPE, per the rule above
duct:///rhachet.beav.fix-x/mechanic             local — three slashes, empty authority
```

so `grove` is not merely a flag vocabulary bolted on the side. it is the first segment of the
address by which every remote duct is reached, which is why the two written forms below must
eventually reconcile.

## .disputes

### dispute: two written forms for one concept — raised 2026-08-09 — status: OPEN

- raised.by  = beaver, at the hour both contracts were written
- claim      = `--grove cloud://<name>` and `duct://<name>/<tree>/<role>` write one concept two
               ways, in contracts authored the same hour. that is the drift
               `rule.forbid.domain-term-synonyms` exists to catch, and it should be settled to one.
- counter    = they serve different grammars. a **flag vocabulary** takes a value with an explicit
               `local` member, and a **uri authority** takes a host with an EMPTY authority for
               local (`duct:///`, exactly as `file:///` does). to force one form on both would
               either break the uri convention or give the flag an empty value with no obvious
               written form.
- resolution = **UNSETTLED.** the sharpest form of the question: is `local` a VALUE of grove, or the
               ABSENCE of one? the flag says value; the uri says absence. both are defensible, and
               the answer decides the reconciliation rather than follows from it.

**until it is settled, both forms stand as written**, and a reader is owed the note that they name
one concept. neither is a synonym of the other in the drift sense — they are one word in two
grammars, which is why this is a dispute rather than a violation.

### dispute: grove names BOTH a machine and a registry record — raised 2026-09-03 — status: OPEN

- raised.by  = beaver, from a measured count taken as `git.grove.saturation` was authored
- claim      = `grove` is overloaded across two concepts, and the forest registry proves it
               empirically rather than by argument. it holds **four** grove records at **two**
               distinct `host:port` endpoints:

               ```
               grove-ahbode-v20260811.ground → ground@localhost:36902
               grove-ahbode-v20260811        → camper@localhost:36902     ← same endpoint
               grove-ahbode-v20260901.ground → ground@localhost:36903
               grove-ahbode-v20260901        → camper@localhost:36903     ← same endpoint
               ```

               one record per **login**, never one per machine. so `git.grove.list` prints four
               🌳 rows where two machines exist — and `choice._.md` defines a grove as *"the
               machine a tree's crew runs on"*, which those four rows contradict. either the
               definition is wrong, or the list double-counts.
- counter    = the two senses had never collided, because every extant caller of `--grove` wants
               a **login** — an ssh alias to reach — and never a machine. so a record-shaped
               grove has served every use to date. the overload stayed invisible until a caller
               appeared whose subject is a property of the HARDWARE rather than of the session:
               cpu, ram, disk, and stall read identically under either login.
- the cost   = a `false report` of forest capacity. read naively, four groves at 66% ram free
               reads as ~124G of headroom where ~40G exists. not hypothetical — the saturation
               skill emitted exactly that duplicate on its first run, and it was caught only
               because the two rows came out byte-identical.
- the shape  = per `rule.forbid.domain-term-ambiguity`, an overload hides an **absent
               distinction**. the unnamed concept here is the registry record — the
               (machine × login) pair. candidates so far: `entry`, `alias`, `berth`. none is
               discovered yet, so none is proposed
               (`rule.require.domain-discovery-for-term-proposals`).
- resolution = OPEN. contracts keep `grove` meanwhile. `git.grove.saturation` folds its records
               onto `host:port`, names the folded unit `grove` and the folded-from unit `entry`,
               and says so in its own header — a local, reversible choice, recorded here so it is
               not mistaken for a settled repo-wide split. do NOT sweep-rename `git.grove.list`
               on the strength of this entry; it is a discovery, not a verdict.

#### 🔴 amendment 2026-09-06 — the unnamed half is the MACHINE, and it is already named `box`

the entry above assumes the absent word belongs to the **record**, and offers `entry` / `alias` /
`berth` for it. **the glossary says otherwise.** a word for the *machine* half is already in
active use, and it is the very word `choice._.md:6` records as a forbidden synonym:

| where | how `box` is used |
|---|---|
| `term=grove._.choice._.md:6` | ⛔ listed as a **forbidden synonym** of grove |
| `term=grove.tunnel._.choice._.md:32` | ✅ a **load-bearing row** — `\| box \| the ec2 instance \| stopped, or hibernated \|`, one of three layers beside `tunnel` and `crew` |
| `git.grove.wake` stdout | 🔴 `box i-0642a53a180f22a32 [KEEP] already up` — a **published contract** |

⇒ the third row is the sharp one. `rule.forbid.domain-term-synonyms` binds *"above all the
external interfaces we publish"*, and a forbidden synonym is in skill stdout right now.

⚠️ **so this dispute has its halves backwards.** the record kept the canonical name; it is the
**machine** that was shunted onto an unofficial word, because `grove.tunnel` needed to part three
layers and the glossary supplied a word for only one. that is `rule.forbid.domain-term-ambiguity`
exactly — the overload concealed an absent distinction, and an author filled the gap under
deadline with the nearest word to hand.

⇒ this **strengthens** the case that `box` was rejected for the right reason and reinstated by
necessity: `.reason.md:19` rejects it because *"it names the tin rather than its role"* — which is
precisely the sense `grove.tunnel` needs. a word rejected because it names the tin is the word you
reach for when the tin is your subject.

- what this changes = the candidate set. `entry` / `alias` / `berth` name the record, and the
  record does not need a word. what needs one is the machine, and `box` is the incumbent — either
  by promotion out of the forbidden list, or by a discovered replacement.
- what it does NOT change = still OPEN, still no verdict. `box` has an argued rejection on
  record, so its reinstatement must answer that argument rather than route around it. and the
  three uses above are cited as **evidence of the gap**, never as a license to spread it.
- the honest note = this beaver used `box` in a report to the human on 2026-09-06 (*"the case for
  a bigger box"*), for the second time. prose is exempt from the forbid; the repeat is recorded
  because a synonym one reaches for twice under no pressure is data about the gap, not merely a
  slip.

### the relation to `camp` — NOT settled, and deliberately not guessed

`rule.require.speak-at-the-supervisor-layer` names four supervisor-layer words and records honestly
that `camp` is defined by nobody. two data points bear on the grove relation, and they are recorded
as **evidence, never as a definition**:

| where | what it shows |
|---|---|
| `rhx keyrack status` lists `ahbode.camp.AWS_PROFILE`, **`env: camp`** | camp is an ENV in the keyrack vocabulary, peer to `test` / `prep` / `prod` |
| the tree slug `declastruct-aws_beav_feat-ehmpathy-camp-grove` | a grove is provisioned INSIDE a camp — so camp bounds grove, not the reverse |

together they point at a bounded estate that groves are raised in. **that is a hypothesis with two
supports, and a hypothesis is not a term.** per
`rule.require.domain-discovery-for-term-proposals`, a term is discovered rather than invented, and
to define `camp` from its sound would put a word in the domain expert's mouth. it stays owed.

## .the restraint bar

most rounds pave zero, and the bar is that a term must be **compelled** by evidence. tested:

- **a new kind?** yes — every other word in this stack is a rung; grove is the sole coordinate, and
  its `.what` cannot be said without that contrast
- **evidenced?** live in five crew verbs, in the duct uri authority, and in two extant briefs. this
  round added the name shape, the rebuild-rather-than-mutate design, and the liveness/work split
- **a victim?** ~90 rounds of a carried claim that was right for the wrong reason, plus three
  rounds of an instance name that had moved
- **ours?** yes — this repo declares `--grove` on every crew verb
- **would it be re-derived?** it already was: `rule.require.speak-at-the-supervisor-layer` named it
  a supervisor-layer word and recorded its cluster as owed, before this round

it cleared every line. `camp`, tested against the same bar this round, did **not** — and is declined
again rather than guessed.

## .see also

- `term=grove._.choice._.md` — the choice itself
- `term=grove.saturation._.choice._.md` — the child term whose authorship surfaced the 2026-09-03 dispute
- `define.work-primitive-hierarchy.md` — grove as a coordinate beside the crew/tree/duct stack
- `term=crew._.choice.reason.md` — the ~90-round carried claim, and the three-name saga, in full
- `term=duct._.choice._.md` — the uri whose authority is a grove
- `rule.require.speak-at-the-supervisor-layer.md` — grove as a word a supervisor speaks in
- `rule.require.domain-discovery-for-term-proposals` — why `camp` stays owed rather than guessed

---

written by human + beaver 🦫
