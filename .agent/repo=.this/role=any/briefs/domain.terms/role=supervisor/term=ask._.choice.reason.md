# domain.term.choice.reason: ask

## .etymology

**ask** is old english `āscian` — to seek an answer. it is the plainest word in english for the
act, it is one syllable, and it is already the word this fleet uses in prose without a second
thought: *"the ask and the halt are two things"*, *"escalated without the ask first"*.

so this cluster **coins naught**. it itemizes a word the vocabulary had already settled on and
leaned on 26 times across 10 files, with no definition behind it — the exact state
`rule.require.domain-term-itemization` grades a blocker.

it also inherits `poll`'s precedent: the noun and the verb are one word. *an ask*, *to ask*.

## .the rejected words

| ⛔ word | why it distorts |
|---|---|
| `question` | too wide. every clarification, every rhetorical aside, and every `--help` is a question. `ask` names the narrow case where an **answer is owed back** |
| `request` | asks for an **act**, not a thought. *"please run X"* is a request and is a steer or a nudge; it is not an ask |
| `query` | database jargon. it also implies a **structured** form with a known answer shape, which an ask rarely has |
| `prompt` | 🔴 TAKEN twice — the harness's permission modal (`🚧 PROMPT`, a first-class poll verdict) and the text handed to a brain. one word, three concepts |
| `inquiry` | formal, and implies an **investigation** rather than one message |
| `poke` | forbidden as a synonym of `nudge` already (`term=nudge`). it names motion, not thought |
| `favor` | prices the act as optional. an ask that may be disregarded is not an ask; it is a remark |

## .the evidence — measured 2026-09-02/03, on the author of this cluster

the term was paved off a failure, and the failure was mine.

a supervisor diagnosed a tmux colour defect and needed the human to run one command. across
**three consecutive messages** the ask was authored inside prose — correct, terse, each under
its own header. the human's replies, verbatim:

> *"im not going to do anything."*
>
> *"you fix it is the point"*

⇒ **three asks, zero actions.** what that measures is not that the asks were wrong. it is that
**an ask is a distinct kind of passage and was not treated as one** — it looked like the analysis
around it, so the reader priced the whole message as analysis and stopped.

that incident is dispatched as `ehmpathy/rhachet-roles-bhrain#407` (*star the ask*), which owns
the **presentation** half. this cluster owns the **taxonomy** half: what counts as an ask at all.

### the second half of the same incident

the human's second reply is the sharper one, and it names the boundary this cluster draws:

> *"you fix it is the point"*

⇒ the message had contained an ask where **no ask was owed**. the work was mine; the ask
transferred it to the reader. so the economics section is not a nicety — an ask spent where a
default exists is a round trip, and an ask spent where the **work** was yours is a handoff in a
question's clothes.

## .the precedent for the economics claim

`rule.require.clarify-radio-push-vs-pull` mandated an ask on a bare *"dispatch"*, and was then
**superseded** by `define.sprout-vs-seed`. its own words:

> *"this REPLACES the question ... the answer is known, so the question is a round trip that
> buys naught."*

that is the only recorded case in this repo of an ask that **expired** — a question that was
correct while neither answer was known to be safer, and became a defect the moment a safe
default was established.

⇒ so an ask is not merely priced; it **decays**. a question worth an ask today may be a round
trip tomorrow, and the tell is that a default has since been paved.

## .disputes

### dispute: the scope against telepath's generic sense — raised 2026-09-03 — status: OPEN

- raised.by = beaver
- claim = `ehmpathy/rhachet-roles-bhrain#407` defines an ask for the **telepath** role as *"an act
  the reader must perform, a decision they must render, or a datum they must supply"* — three
  kinds, of which only the third is thought. this cluster defines it as **thought only**, and
  routes the other two to `steer` and `escalate`
- counter = the two definitions serve different layers. telepath governs **any** message to a
  human, where all three kinds arrive in one channel and must be equally unmissable. this fleet
  governs **supervisor→clone** traffic, where the three kinds take three different actions and
  must be parted
- resolution = unsettled. the risk is real: one word, two senses, at two layers — which is the
  `--mode` overload's exact shape. if #407 lands with the wide sense, this cluster's narrow one
  may need a boundary qualifier (`term=duct.ask`) or a rename. **do not paper over it**; the
  dispute stays open until #407 returns

⚠️ note the honesty cost: i authored **both** senses, hours apart, and did not notice they
disagreed until this file. that is `term=partial-audit`'s subject-KIND mechanism at authorship —
each definition was complete over its own layer, and neither was checked against the other.

## .the filename — flat, deliberately

`rule.require.boundary-qualified-terms` mandates a full boundary ancestry in the filename. this
cluster is **flat** regardless, and the reason is local convention rather than an exemption:

its three peers — `term=nudge`, `term=steer`, `term=escalate` — are all flat. a prefix on the
new one alone would be a partial rename, which that rule's own no-mass-rewrite clause grades
worse than a consistent extant set. so the four move together or not at all.

⚠️ **recorded, not repaired.** and the open dispute above may force the question: if #407's wide
sense lands, `term=duct.ask` is one of the two candidate repairs.

## .evidence of the gap

measured 2026-09-03, before the pave:

```
rhx globsafe --pattern '.agent/repo=.this/role=any/briefs/domain.terms/term=ask*'
   └─ 0 files

rhx grepsafe --pattern 'an ask|the ask' --path '.agent/repo=.this/role=any/briefs' --glob '*.md'
   └─ 26 lines, across 10+ files
```

the hits that carry the load:

| where | what it says |
|---|---|
| `term=nudge._.choice._.md:52` | *"why can't you get l3 to agree with you?"* → ⛔ **an ask** |
| `term=nudge._.choice._.md:59` | *"an ask — a question hands the clone the work of an answer"* |
| `term=steer._.choice._.md:55` | *"**the ask and the halt are two things**"* |
| `term=steer._.choice.reason.md:181` | *"**before you relay a clone's ask, part the ASK from the HALT.**"* |
| `rule.require.nudge-parked-clones.md:141` | *"escalated without the ask first"* = **blocker** |
| `rule.require.clarify-radio-push-vs-pull.md:50` | the economics claim, verbatim |

⇒ a **blocker-severity** enforcement clause and a bolded rule stated **twice** in two files, over
a word with no definition anywhere. that is the strongest possible case for a pave, and it needs
no replication gate — the distinction is **recorded** rather than invented (`term=replication`,
*"the gate blocks an INVENTED distinction, never a RECORDED one"*).

---

written by human + beaver 🦫
