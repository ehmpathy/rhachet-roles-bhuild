# domain.term.choice.reason: park

## .etymology

**`park`** is borrowed from its ordinary sense — a vehicle brought to rest, on purpose, in a
place meant for it, by its own driver, with every expectation that it moves again. each clause
maps, and it maps exactly rather than loosely:

| the car | the clone |
|---|---|
| brought to rest **on purpose** | the clone chose the stop |
| in a place **meant for it** | at a declared gate, never mid-work |
| by **its own driver** | self-imposed; nobody parked it |
| and it **moves again** | a park is temporary and reversible |

🔴 **the connotation that carries the load is the one nobody states: a parked car is not broken.**
that is precisely what parts this word from every neighbour a supervisor might reach for, all of
which carry fault. a park is *correct behavior* — a clone that parks at a gate it may not open is
obedient to `rule.forbid.self-grant-human-gates`, not defective.

the alternatives, and why each fails:

| word | why it is forbidden |
|---|---|
| `idle` | 🔴 **already taken.** `term=down` declares `idle` a forbidden synonym OF `down`. to reuse it here would collide two glossary entries. and it asserts no work exists, where a parked clone has work it cannot reach |
| `stuck` | names a defect. a park is the correct act, so the word would grade the clone's obedience as a fault |
| `wait` | 🔴 the genus, not the differentia. every state in this glossary waits. the word must name *why* and *by whose choice* (`rule.require.enumerate-before-you-name`) |
| `pause` | implies an external agent paused it. a park is self-imposed, and that is the whole distinction from a wedge |
| `stall` | collides with `term=grove.saturation.stall`, which names time WAITED on a resource — a machine measure, not a decision. `term=false-report._.choice.reason.md:1206` already demands a HALT be parted from a STALL |
| `freeze` | the poll's `🧊 frozen` is an OBSERVATION between two reads. park is what the clone knows; frozen is what the instrument sees |
| `block` | the **route's** status word (`blocked:on-human`, `blocked:on-defect`). a clone parks; a route blocks. different subjects, and both are needed in one sentence |

⚠️ **`halt` is deliberately NOT forbidden.** a halt is the DECLARATION a driver makes
(`--as blocked`); a park is the posture that follows it. they co-occur constantly and name
different moments — `fix-node-pty-install` said *"Halt stands. No drives, no repairs. Resting."*
in one breath, and both words earn their place in it. do not collapse them.

## 🔴 .why a word in ~30 files went undeclared this long

this is the part worth a record, because the cause is not neglect and it will recur.

a `grepsafe` over `.agent/repo=.this/role=any/briefs` returned **124 lines across roughly thirty
files** — a rule filename, fifteen term clusters, four howtos, and the software's own stdout.
by any frequency test it was the most-used undeclared word in the repo. two mechanisms hid it,
and **both are forms of camouflage rather than oversight:**

### 1. it was promoted into a RULE FILENAME

`rule.require.nudge-parked-clones` has existed for weeks. a word in a rule's *name* reads as
settled vocabulary — the rule is cited, the word rides along, and no reader asks whether the
noun in the title has a home. **the promotion IS the camouflage.** a word that appears in prose
invites the question *"is this a term?"*; a word in a filename answers it, wrongly.

### 2. it was examined closely, and the examination ended in a FORBID

`term=duct.box.quiet._.choice._.md` lists `parked` under `term.synonyms.forbidden`, and its
`.reason` records the test that put it there:

> *"**`parked`** — asserts the clone chose to wait. true for two of four rows, false for the two"*

⇒ that is a **real discrimination, correctly run, and it stopped one step early.** the author
established that `parked` names what `quiet` does not — and then filed it as a forbidden synonym
and moved on. a forbid feels like a terminus. it closes the question *"may i use this word
here?"* and never opens *"then where does it belong?"*

🔴 **the generalization, and it is owed to more than this word:**

> **when you forbid a word as a synonym, ask whether it names ANOTHER concept.**
> a forbid that is right about the collision may be only half the work.

a synonym is a word for the SAME concept, and a rejection on the grounds that it *"asserts"*
what the canonical word does not is, by construction, a find that it names a DIFFERENT concept.
`duct.box.quiet` recorded that find in the one place where it reads as a dead end.

## .the evidence

### instance 1 — the software says it, unprompted

`feat-thinker-notes-overflow/mechanic`, verbatim from its scrollback:

```
● One thousand two hundred twenty-fifth run. Unchanged.
  🦉 parked on 1.vision. 🍵
```

⚠️ **a clone chose this word for itself, in its own status line.** no brief told it to. that is
the strongest evidence available that the word already belongs to the domain rather than to one
observer (`def.domain-discovery`: the ground truth is how folks actually talk).

### instance 2 — a rule is named for the act

`rule.require.nudge-parked-clones`, and its route table sorts a parked clone by the OWNER of its
stall — which is coherent only if `park` names a state with an owner, distinct from the acts
(`nudge`, `steer`, `escalate`) aimed at it.

### instance 3 — the two-of-four test, 2026-09-05 and earlier

four quiet boxes, two parks. recorded in `term=duct.box.quiet._.choice.reason.md:26` and its
per-tree table at :43–44. **the discrimination pre-dates this cluster and is not mine.**

### instance 4 — the activity split, measured 2026-09-05

two clones parked at the same gate on the same day. `feat-behavior-route-upgrades` spent 299m
productively — a queue read, an enumeration that overturned its own rule, a glossary debt paid.
`feat-thinker-notes-overflow` spent its park on 1,225 stop-hook runs and died of them.

⇒ **this is the instance that shaped the definition rather than confirmed it.** before it, the
natural read of `park` was *"a clone that has stopped"* — inert, safe, and in wait of a grant.
one of these two rows is that; the other is a clone at its best work. **so the word had to be
narrowed to the POSTURE and explicitly stripped of any claim about ACTIVITY**, and the say file
now carries that as a warn rather than a footnote.

### instance 5 — the owner misclassification, 2026-09-05

`fix-node-pty-install` parked and relayed three levers as human-only. one — `keyrack unlock` —
is the supervisor's, and `keyrack status` showed the session already live with 308m left.
⇒ a park is honest about the STOP and carries no authority about the OWNER
(`rule.require.trust-but-verify`).

## ⚠️ .the boundary question, left OPEN on purpose

`rule.require.boundary-qualified-terms` runs one test: **"$word, of WHAT?"** — and the answer
here is one word, *a clone*. so the term wants the boundary `clone.park`.

🔴 **it is paved FLAT anyway, and the reason is mechanical.** that rule also grades *a boundary
that names no declared term* as a blocker, and **`clone` has no cluster.** `park` sits flat
beside `nudge`, `steer`, `escalate`, and `spiral` — every other supervisor-layer verb — until the
subject it qualifies is itself declared.

⇒ the arrear: **`clone` is owed a cluster**, and when it lands, this term is owed a
re-qualification check. recorded rather than guessed, per
`rule.require.domain-discovery-for-term-proposals`.

## 🔴 .the strongest counter-argument, stated fairly

> *"124 hits prove the word is COMMON, never that it is TECHNICAL. `park` is ordinary English
> used ordinarily. a glossary that itemizes every frequent word it happens to use will bloat,
> and a frequency test passes for `read`, `send`, `tree`, and every other plain word in the
> corpus. what earns a slot is a concept the domain cannot express otherwise — and every one of
> those 124 lines reads fine as plain English."*

this is the right objection and it is not fully answered by the count. what parts this word from
a merely frequent one is a sharper test than frequency:

> **has aught ever been DECIDED on the basis of this word?**

for `park`, three times, by three parties, none of them this author:
- a **rule** was named for it, and routes a clone by it
- a **forbid** was issued against it, on the grounds that it asserts what another word does not
- a **clone** printed it in its own status line, with no brief that told it to

⇒ a common word is used. **a term is used to decide.** the three above are decisions.

⚠️ **what is left unanswered:** instances 4 and 5 are both mine, both from one day, on one fleet —
the same one-observer weakness `term=spiral` carries. instances 1–3 are foreign to this round and
predate it, which is what keeps the count honest.

⇒ **what would overturn it:** a re-run of the two-of-four test that finds `parked` and `quiet`
interchangeable with no consequence — that is, a fleet where every quiet box is a park and every
park is quiet. that would show the discrimination was an artifact of four rows, and with it the
reason this word earns a slot apart from `duct.box.quiet`.

## .see also

- `term=duct.box.quiet._.choice.reason.md` — the forbid that stopped one step early, and the test
  that made this cluster owed
- `term=duct.pane.husk._.choice._.md` — what a park decays into
- `term=spiral._.choice._.md` — the parked-clone death spiral, whose entry condition is a park
- `term=nudge._.choice.reason.md` — the act a park does NOT earn, and why
- `rule.require.enumerate-before-you-name` (bhrain/learner — **foreign**) — the rule that rejected
  `wait` as the genus

---

written by human + beaver 🦫
