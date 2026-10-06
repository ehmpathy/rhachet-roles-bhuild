# domain.term.choice.reason: house

## .etymology

the concept was coined by the wisher 2026-09-13, mid-conversation, while a supervisor priced grove
hardware. the **word** took three rounds to settle — `close`, then `touch`, then `house` — and each
loser is recorded as a forbidden synonym below.

> *"close groves is probably the best word for the triple; local, close, cloud"*
> *"close = close to you, close to home, you own and operate it"*

> *"local = the visible machine; house = a machine you own in your house or 'the house' as in the
> organization / community, or a house you have access to maintain server; cloud = cloud as usual"*
> — the wisher, 2026-09-13, the round that settled it

**`house` reads two ways at once and both are meant.** the place (a laptop in your house) and the
establishment (*in-house*, as against rented in). the second is the industry idiom for precisely
this custody axis, and the first is where most of our instances physically sit.

⇒ the idiom does real work rather than decoration: *house band* · *house rules* · *house wine* ·
*in-house*. each one says **it belongs to the establishment, never bought in**. the word arrives
pre-loaded with the exact sense the axis needs, so no reader has to be taught it.

## .the rejected synonyms, and why each fails

each was weighed against the one question the term must answer — *"who holds this machine?"*

| candidate | why it fails |
|---|---|
| **touch** | 🔴 **overloaded, 103+ times.** a live verb in this repo's own skills and rule names — see the dispute below |
| **close** | 🔴 **overloaded.** already a live domain verb here for *terminate* — see the dispute below |
| **home** | 🔴 **collides with `$HOME`.** and it is narrower than `house`: `home` carries no establishment sense, so an office or a friend's basement reads as a stretch. ⇒ `house` inherits neither defect, which is the whole reason it survives where `home` did not |
| **onprem** | industry jargon, and it names a **premises** — an enterprise frame that fits a datacenter and reads absurd for a laptop on a couch. also fails `rule.forbid.shouts` in its usual `on-prem`/`On-Prem` renderings |
| **self-hosted** | 🔴 **describes the wrong subject.** it is a property of *software* (who runs the service), never of a *machine*. a `cloud` grove is also self-hosted in that sense — we run the clones on it |
| **owned** | 🟡 the closest miss on sense, and wrong on **grammar** — a past participle where the axis wants an adjective. `house` says the same and reads as a compound noun (`a house grove`) |
| **near** | 🟡 clean grammar, no collision, and **thin** — it carries proximity and drops ownership. 🔴 refuted outright by `house://localhost`, which is maximally near and is not `local` |
| **edge** | a term of art for compute near the *end user*, which is a claim about latency to a customer. our grove serves clones, never users. it would import a whole distributed-systems frame that does not apply |
| **private** | names an **access** property, not custody. a `cloud` grove in a VPC is private. it would collide with the security vocabulary on the very axis meant to be about who owns the box |

## .the enumeration that settled the sense

per `rule.require.enumerate-before-you-name`, the instances the word must cover were listed before
the candidates were judged:

| the machine | a house grove? |
|---|---|
| a laptop in your house | ✅ — the place sense |
| a desktop in a closet | ✅ |
| a spare box at a friend's place you administer | ✅ — the wisher's third clause: *"a house you have access to maintain server"* |
| a second unix user on the supervisor's own box | ✅ — `house://localhost`, and blind |
| the machine the supervisor runs on | ✅ — house, and specifically `local` |
| a dedicated server you RENT from Hetzner | ⛔ `cloud` — the house operates it and does not own it |
| an EC2 you rent | ⛔ `cloud` |
| a server you BOUGHT and racked in a vendor's DC | 🟡 **the boundary case.** filed `cloud`, and it does NOT follow from the word — see the say file |

🔴 **row 6 is why `owned` and `self-hosted` both lose.** the house operates that box day to day, so
every word keyed on *who runs it* returns the wrong answer. only a word keyed on *who owns it*
sorts row 6 correctly.

⚠️ and **row 8 is the one soft cell, stated rather than hidden.** *in-house* in the establishment
sense would admit it; the verdict excludes it on a reach argument the word does not carry. zero
instances today, and the verdict is written into the say file so it is not re-derived.

## 🔴 .why the word names CUSTODY and not REACH

`touch` named **physical reach** and got custody by implication. `house` names **custody** and gets
reach by implication. they are mirror choices, and the table settles which mirror is right:

| the row the table holds | follows from |
|---|---|
| who holds the disk | 🟢 custody |
| what a cancellation costs | 🟢 custody |
| per-month cost — power vs rent | 🟢 custody |
| uptime guarantee — yours vs an SLA | 🟢 custody |
| remote hands at 3am | reach |
| can you read it without a tool | neither — that is the `blind` axis |

⇒ **four of the six follow custody; one follows reach.** the word that settles the most rows without
a gloss is the right word, and that is the custody word.

## 🔴 .the axis is a FLAT TRIPLE — a subtype nest was tried and dropped

`local | house | cloud`. three values, no subtypes, no aliases.

a mid-round draft nested `local` and `blind` **under** `house`, on the argument that the
supervisor's own machine satisfies every custody predicate. that argument is **true** and the nest
was still dropped — see the dispute below. the table says the same with no machinery:

| the row | `local` | `house` | `cloud` |
|---|---|---|---|
| reach layer · can you read it without a tool | 🔴 **stands alone** | agrees with `cloud` | agrees with `house` |
| disk · 3am hands · cancellation · cost · SLA | agrees with `house` | agrees with `local` | 🔴 **stands alone** |

⇒ **each neighbour pair differs on a different seam.** `local`↔`house` differ on REACH;
`house`↔`cloud` differ on CUSTODY. that is the whole structure, and a reader gets it from the table
with no taxonomy to hold in their head.

⚠️ **this is why a two-value vocabulary could never work.** `local | cloud` had to compress two
seams into one column, so any machine that crossed one seam and not the other had no cell.

## .why `local` keeps its own word

⚠️ **for a reason custody says naught about: it has no reach layer.** no ssh, no tunnel, no tailnet,
no cross-network identity. it cannot drop a tunnel, cannot be reaped, and needs no credential to
authenticate across a wire.

⇒ **a value that changes the transport earns a word**, and it is the row every dispatch verb reads.

## .`blind` survives as PROSE, and why not `headless`

a blind box has **no eyes**. no monitor to show you a stack trace, no keyboard to answer a modal at.

🔴 **the word is load-heavy, never decorative.** on a blind grove, an instrument's silence and a
machine's silence are the same bytes — which is the exact condition `term=partial-audit` and
`rule.always.read-both-crew-halves` exist to defuse. a `term.audit` that reads localhost and reports
a clean bill is a lie about **every** blind grove; at `local` you would simply look.

⇒ `headless` is the industry word and it names an **absent part**. `blind` names an **absent
sense** — and the sense is what the vocabulary is consulted for.

## 🔴 .`blind` names the ROW, never the cell — and that is its whole value

a rented EC2 has no monitor either. the two seams cross, and one cell is impossible:

```
                   │ has eyes    │ blind
───────────────────┼─────────────┼─────────────────
the house owns it  │ local       │ house
the house rents it │ —           │ cloud
```

⇒ so *"the grove is blind"* is a true sentence about `house` **and** `cloud` alike. **it is the word
that spans every grove the instrument discipline applies to**, which is exactly what
`rule.always.read-both-crew-halves` and `term=partial-audit` are about — and both of those are live
against cloud groves **today**.

🔴 **this is why `blind` must not be spent as a flag value for one cell.** it would stop to name the
row and start to name a corner of it, and the row is the useful span. ⇒ it stays first-class in
prose and takes no slot in the triple.

## .disputes

### dispute: house ↔ touch — raised 2026-09-13 — status: RESOLVED (`house` prevails)

- raised.by  = the wisher (*"lets clarify that the triple should be local|house|cloud grove"*)
- claim      = 🔴 **`touch` is a live verb in this repo, 103+ times, and the prior dispute never
  checked.** measured across `.agent/repo=.this/role=any/`:

  | the extant sense | instances |
  |---|---|
  | the verb *modify / disturb* — `never touches a duct` · `the work is untouched` · `a tree never touched` | pervasive, 40+ files |
  | **two rule NAMES** — `rule.always.entool-the-skills-you-touch` (bhrain/learner, cited in 3+ skill headers) · `rule.prefer.wickup-touched-prose` (ehmpathy/mechanic) | declared contracts |
  | the **unix command** — `touch "$SSHCFG"` in `git.grove.wake.sh:523` | executable code |

  ⇒ *"never touches a duct"* is the **identical sentence shape** as *"closes a duct"* — the very
  line cited to kill `close`. so the `touch` verdict applied a test it did not run on its own
  candidate, and the candidate fails that test **34× harder** than the word it replaced (103+
  instances against 3)
- claim      = `house` carries the sense **better**, not merely more safely. the axis is CUSTODY,
  and *in-house* is the industry idiom for exactly it. `touch` named reach and got custody by
  implication; the shared-row table shows **four of six rows follow custody and one follows reach**
- claim      = `house` dodges both defects that killed `home` — no `$HOME` collision, and the
  establishment sense widens it past one residence to cover an office, a friend's basement, a
  collocated second user
- claim      = grammar is conceded to `house` outright. *"a touch grove"* was admitted awkward in
  the prior verdict; *"a house grove"* reads as an ordinary compound noun
- counter    = a third word for one concept in one session invites vocabulary churn, and each swap
  costs a rewrite of two term files, one cross-link, one dream, and four dispatched issues
- counter    = `house` appears twice in this repo's prose as *"the house pattern"* and once as the
  verb *to house* (contain). 🟢 **neither is a collision.** *"the house pattern"* says *our
  established convention* — the SAME establishment sense, so it is **precedent**; and nobody writes
  *"house the grove"* to say contain it
- resolution = **`house` prevails.** the overload finding is decisive on its own —
  `rule.forbid.domain-term-ambiguity` grades one word on two concepts a **blocker**, and `touch`
  carries three. the churn counter is real and is outweighed: the swap is still free today and
  stops being free the moment a parser reads the word. ⇒ `touch` is recorded as a forbidden synonym
- 🔴 **the durable lesson: the overload check must run on the WINNER, never only on the loser.** the
  `touch` round ran a careful grep for `close` and none at all for `touch`. a candidate that arrives
  as the remedy to an overload is the candidate least likely to be checked for one

### dispute: touch ↔ close — raised 2026-09-13 — status: RESOLVED (both now forbidden)

- raised.by  = the supervisor, at the wisher's prompt (*"close grove vs touch grove"*)
- claim      = `close` is **already a live domain verb in this repo**, for *terminate*:
  `rule.require.tree-del-before-duct-close` · *"a closed tab is a decision, never a wedge"* ·
  `git.crew.stop` closes a duct. so `close grove` puts one word on two concepts, which
  `rule.forbid.domain-term-ambiguity` grades a **blocker**. ⇒ and *"close the grove"* would be
  genuinely unreadable: shut it down, or describe it?
- claim      = second defect — `--grove clo<TAB>` yields `close | cloud`. the two share a
  three-letter prefix, which is an ergonomic own-goal for a flag value
- counter    = `close` reads more naturally as an adjective, and `local · close · cloud` alliterates
- resolution = **`close` was retired, and the argument stands** — it is still a live verb here. but
  the replacement it selected was itself overloaded, so `touch` fell to the same test one round
  later. ⇒ **both are forbidden synonyms**, and `house` passes the test neither could
- 🟢 `--grove h<TAB>` yields `house` alone. `l` · `h` · `c` are three distinct first letters, so the
  prefix defect that helped kill `close` does not recur

### dispute: blind ↔ the custody word, for the FLAG — raised 2026-09-13 — status: RESOLVED (the custody word holds the flag)

- raised.by  = the wisher (*"how about local, blind, cloud — for the groves?"*)
- claim      = `blind` is the sharper word. it names a checkable fact about the box and reads as an
  adjective
- counter    = 🔴 **the enumeration refuses it.** run the three cells:

  | the machine | `local` | `blind`? | `cloud` |
  |---|---|---|---|
  | laptop, monitor, you are at it | ✅ | no | no |
  | laptop in a closet, the house owns it | no | ✅ | no |
  | **an EC2 you rent** | no | 🔴 **✅ — also blind** | ✅ |

  row 3 is the defect. `blind` returns yes for **two of three cells**, so it discriminates neither.
  that is `rule.require.enumerate-before-you-name`'s **too wide** failure — the one that *"feels
  like generality"*
- counter    = and the false inference it plants is **operationally live**. a `blind` that `cloud`
  is not implies cloud groves have eyes. they do not — and `rule.always.read-both-crew-halves`,
  `term=partial-audit`, and the localhost-only `term.audit` gap are all about **cloud** groves
  today. the vocabulary would suggest that discipline stops at the tailnet
- 🟡 **`house` is broader than one cell too; the difference is whether the breadth misleads:**

  | the word | what it spans | the inference it invites | harmful? |
  |---|---|---|---|
  | `house` | exactly its own cell | — | 🟢 n/a |
  | `blind` | {house, cloud} | *"do cloud groves have eyes?"* | 🔴 **yes — and it is false** |

- resolution = **the custody word holds the flag; `blind` keeps its own grain.** `blind` stays
  first-class **in prose** for the row and takes no slot in the triple. ⇒ **to spend `blind` on one
  cell would destroy its best use**, which is to span every grove you cannot simply look at
- 🟢 the grammar counter that was conceded under `touch` **evaporates under `house`** — *"a house
  grove"* reads fine, so `blind`'s one advantage over the flag word is gone

### dispute: a subtype nest — raised 2026-09-13 — status: RESOLVED (dropped; the triple stays flat)

- raised.by  = the wisher, in both directions on the same day
- claim      = `local` is not a peer; it is *"a specific type of [house] grove — the one with the
  monitor and [keyboard]"*. ⇒ adopted mid-round as `house.local` / `house.blind`, with `local` and
  `house` as their aliases
- counter    = 🔴 **the wisher then struck it**: *"we can drop the local vs blind subhouse mention
  now. we can just keep it as a standard local|house|cloud triple"*
- counter    = and the nest bought naught the table does not already say. its whole payload was
  *"`local` inherits custody from `house`"* — which is **row 3–7 of the comparison table, visible at
  a glance**. a taxonomy that restates a table is machinery a reader must hold in their head to
  learn what the table shows them for free
- resolution = **flat. `local | house | cloud`, three peers, no subtypes, no aliases.** the
  structure is kept as an observation about the table rather than a hierarchy in the vocabulary:
  `local`↔`house` differ on REACH, `house`↔`cloud` differ on CUSTODY
- 🟡 **the original claim was never refuted** — the supervisor's own machine really does satisfy
  every custody predicate. what was refuted is that the fact needs a NEST to be recorded. ⇒ a true
  relation is not automatically a term-shaped one
- 🟢 `blind` survives the drop untouched. it was never a flag value under either shape, and its
  prose span — *"the grove is blind"*, true of `house` and `cloud` alike — is unchanged

## .evidence

the gap was found in practice, never in theory. `.dream/v2026_09_11.reseed.cut-grove-cost-via-flat-rate-hardware.md`
tabled three destinations for a grove and had to render the middle one as *"owned (a laptop you
have)"* — a prose phrase in a column header, precisely because no term existed. that dream's own
`rung 3` calls the choice **a fork, never a sequence**, which is a claim about a multi-valued axis
stated with a two-value vocabulary.

⇒ the extant axis is declared in `term=grove._.choice._.md` and implemented as
`--grove local | cloud://<groveslug>` across every crew verb in `work/crewwork.sh`. **so this
coinage is a vocabulary change ahead of an implementation change**, and the implementation is not
this repo's alone — `examplehuman/dev-env-setup` provisions the box, `ahbode/infrastructure` grants
its identity, `nheuron` owns the flag and the uri.

🟢 **the cost of three rounds of renames was near zero, and that follows from WHEN rather than
luck.** verified 2026-09-13: no parser, flag, uri, or ledger reads any of the three words. the whole
cost was two term files, one cross-link, one dream, and four dispatched issues — all prose.
⚠️ **that window shuts the moment a mechanic claims the work.**

🟡 one question left open deliberately: **how `house` renders in a `--grove` flag and a duct uri.**
`local` is a bare word and `cloud` carries a `cloud://<slug>` authority. a blind house grove has a
slug and is reached over a network, so `house://<slug>` is the shape symmetry suggests
(`rule.prefer.symmetric-term-pairs`) — but the flag parser, the duct uri grammar, and the ledger all
read that authority today. ⇒ that is settled at `nheuron#18`, and this cluster names a
concept rather than a wire format.

---

written by human + beaver 🦫
