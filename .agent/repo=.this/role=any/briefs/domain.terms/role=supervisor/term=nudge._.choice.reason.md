# domain.term.choice.reason: nudge

## .etymology

`nudge` is plain english for **a small push that restores motion without a change of direction** —
an elbow, never a shove. the physical sense carries the whole distinction: you nudge someone who
was already headed the right way and merely stopped.

it was the fleet's word long before it was a term. `rule.require.nudge-parked-clones` is **named**
for it, and three further rules enforce against it.

## .the discovery — a word 19 files lean on, and one of them calls it forbidden

this term was not proposed from taste. a grep over `.agent/repo=.this/role=any/briefs/` returned
**19 files** that lean on it:

| file | what it does with the word |
|---|---|
| `rule.require.nudge-parked-clones.md` | is NAMED for it, and enforces at blocker severity |
| `rule.require.resume-quota-capped-clones.md` | grades a nudge under a live cap a nitpick |
| `rule.require.brief-a-crew-you-hide.md` | grades a nudge into a live human's pane a blocker |
| `rule.require.pause-babysit-cron-after-idle-streak.md` | counts one as a streak-resetting action |
| `term=steer._.choice._.md` | lists it as a **forbidden synonym** — and, four lines below, uses it as a live contrast |
| 5 further term clusters | reach for it in prose |

a word with its own blocker-severity rule, cited across five paved clusters, and defined in none
of them is the exact state `rule.require.domain-term-itemization` exists to end.

## .why it was paved AFTER its own neighbour

`steer` was paved first, in this same session, and on the face of it that order is backwards —
`nudge` is older, commoner, and carries a rule of its own.

the reason is worth the record: **a word in constant use draws no attention to its own absence.**
a term gets itemized when someone reaches for it and finds no home. nobody reached for `nudge`,
because everyone already knew what it meant — so it stayed load-bearing and undefined while its
rarer neighbour earned a cluster within a day of its first instance.

so `steer`'s cluster is what surfaced this one. its boundary table needed a contrast, the contrast
was `nudge`, and a contrast pointed at an empty shelf is the tell.

> the words most at risk are not the ones nobody uses. they are the ones nobody questions.

## .the rejected synonyms

| ⛔ synonym | why it distorts |
|---|---|
| `ping` | network jargon, and it names a LIVENESS CHECK. a ping asks *"are you there?"*; a nudge presumes the answer is yes and says *"go"* |
| `poke` | carries the push and drops the outcome. it says naught about what the clone does next, which is the whole content of this act |
| `prod` | ⚠️ a hard collision — `prod` is an ENVIRONMENT in this org's vocabulary (`test → prep → prod`, per `prefer.env_access.prep_over_dev`). one syllable, two concepts, and one of them ships software |
| `wake` | implies the clone slept. a parked clone is `at work` with an empty box — its duct is live and it awaits a word (`term=at-work`) |
| `bump` | taken by version and dependency bumps, which this fleet does constantly |
| `kick` | implies force where the act is advisory, and `kick off` is already forbidden by `term=sprout` |
| `unstick` | describes an outcome, never the act, and it presumes the clone was stuck rather than merely stopped. a clone that awaits a word is not stuck |

## .the disputes

### 🔴 dispute: is a survey dismissal a nudge at all? — raised 2026-09-07 — status: OPEN

- raised.by  = beaver 🦫 (self-raised on a live contradiction between two booted briefs)
- claim      = **a survey dismissal is a nudge, and it is the supervisor's.**
               `term=nudge._.choice._.md:47` says so, `rule.require.nudge-parked-clones:58`
               routes it to *"**you** — dismiss it"*, and its `.reason.md:265-269` argues the
               keystroke is safe: *"a survey's dismiss option (`0`) expresses no opinion, sends
               no data, and authorizes naught… dismiss it without ceremony"*
- counter    = **a survey is never the supervisor's, and `0` is a real answer.**
               `howto.run-a-babysit-tick:167-169`, equally live and equally booted:
               *"a numbered box that is **not** a permission modal is never yours. `0: Dismiss`
               is a real answer too — a satisfaction survey is the human's opinion, and a
               dismissal is a claim about their session you were not asked to make. **leave it
               alone and say so in the report**"*
- resolution = **none yet, and the reason is that neither side measured.**

🔴 **the two do not disagree about a judgment. they disagree about a FACT** — whether `0` emits
telemetry. one asserts *"sends no data"*; the other asserts *"is a real answer too."* neither
cites a measurement, and both are booted at say level, so a supervisor reads both in the same
session and can satisfy only one.

⚠️ **and both files are ours.** this is not a rule against an outside constraint — it is the repo
at odds with itself, in two places written for the same reader.

#### what a resolution needs — one measurement, not one more argument

does `0: Dismiss` send a telemetry event? that is checkable, and until it is checked the dispute
cannot close. it decides the whole question: if `0` emits, the howto is right and the nudge rule's
central safety claim is false. if it does not, the nudge rule is right and the howto over-warns.

#### the scope read that MIGHT dissolve it — offered, not adopted

the rules may not overlap where they appear to. `rule.require.nudge-parked-clones` is scoped by
its own title to a **parked** clone — one for which the survey is the sole obstacle, where a
dismissal genuinely restores motion. the howto's hazard is a keystroke aimed at a box whose
contents were never classified.

⇒ under that read: **a survey on a parked clone is a nudge; a survey on a clone already at work
is chrome, and it blocks naught, so a dismissal buys naught and only risks the emit.**

⚠️ **this is a candidate, never the resolution**, because it does not touch the factual
disagreement. it makes the two rules co-livable without a verdict on which is true, and a dispute
closed on coexistence rather than on the fact would re-open the first time someone reads
`.reason.md:267` alone.

#### the live instance — 2026-09-07

`rhachet-roles-bhrain.beav.fix-contemplation-gate-on-entrance/mechanic` rendered
`1: Bad · 2: Fine · 3: Good · 0: Dismiss` while **14m into an active turn**, mid-way through a
real find. it was left alone and said so in the report — the howto's instruction, and the scope
read's verdict, which agree on this instance and would part on a parked one.

⇒ ⚠️ **the report is what makes the caution cheap.** a supervisor that leaves a box alone AND
names it in the tick costs the human one line; one that leaves it alone in silence produces a
fleet whose blocked boxes are invisible.

### dispute: distinct from `steer`, or one act with two grades? — raised 2026-08-26 — status: RESOLVED (distinct)

- raised.by  = beaver 🦫 (self-raised while the cluster was paved)
- claim      = both are one message into one parked keyboard. they part by degree — how far the
               clone's plan moves — so one word with a spectrum would serve, and two words force
               a sort at every send
- counter    = they part by a **binary** test, never a degree: does the clone resume the plan it
               held, or take a different one? and the split already bears load —
               `rule.require.nudge-parked-clones` governs one, and no rule yet governs the other's
               third sense, so a reader who conflates them reaches for a rule that does not cover
               their case. `term=steer._.choice.reason.md` sorted five real messages against
               exactly this test and every one landed cleanly
- resolution = keep both. the boundary table sits in BOTH say files, so neither can be read alone

### dispute: does the replication gate forbid this pave? — raised 2026-08-26 — status: RESOLVED (no)

- raised.by  = beaver 🦫
- claim      = `term=replication`'s gate refused `dogfood probe` one round earlier on a count of
               parties: five instances, one clone, zero replication. `nudge`'s 19 files are one
               party too — this repo, one human and one supervisor. by that gate it should defer
- counter    = the gate governs whether a **distinction** is real, never whether a **word** is
               load-bearing. `dogfood probe` asked the glossary to accept a distinction no artifact
               had settled. `nudge`'s distinction is already settled — in a paved file, in a table,
               by `term=steer`. what is absent is the cluster, and
               `rule.require.domain-term-itemization` demands one regardless of party count
- resolution = pave. **the gate blocks an INVENTED distinction, never a RECORDED one** — a line
               worth carriage back into the gate's own file

## .the evidence

### the collision that forced it

`term=steer._.choice._.md` carries `nudge` in `term.synonyms.forbidden` **and** uses it as a live
contrast in its own boundary table, four lines below.

that reads as a contradiction and is not one. it is the house pattern, set one round earlier by
`term=replication`, which forbids `reproduction` on the identical ground:

> *"taken, and it is this term's complement. to merge them would erase the distinction that lesson
> rests on"*

**a word taken by an adjacent concept is forbidden AS A SUBSTITUTE precisely because it is live
elsewhere.** the forbid says *do not write X where you mean Y*; it never says *X is a bad word*.

so no dispute was owed against `steer`, and none was opened. the pattern held. only the shelf was
empty.

### the instance that surfaced it

2026-08-26, babysit tick #38. a route-complete tree sat parked on its own question — *"Want me to
stage and commit it?"* — and one message restored its motion.

run the binary test: did its plan change? **no.** it had flagged the rebase itself, and had already
named the commit as its next act. the message confirmed the plan it held.

**a nudge.** and had i reached for `steer`, i would have reached for a term whose rule does not
cover the case.

## .⚠️ the toll this file owes — a hook was bypassed to write it

the gerund guard refused the say file on `⛔ ping`, which it read as a gerund by suffix. it is not
one — it is a bare noun that happens to end in those three letters, as `king` and `string` do.

the write was retried through the hook's own escape hatch, and the toll is paid here rather than
in silence (`feedback: escape hatches pay a --why toll`):

- **why the literal is unavoidable** — a forbidden-synonym list must SPELL the forbidden word. to
  gloss it (*"the network-liveness word"*) would defeat the one job the list has, which is to be
  matched against by a reader or a lint
- **the factory upgrade it surfaces** — the guard matches on a suffix, so every bare noun in
  english that ends those three letters trips it. this session alone the fleet has been stopped by
  four such words. a short allowlist of bare nouns would cost one array and remove a recurrent
  false stop. **gain = speed. owed to `ehmpathy/mechanic`; blocked behind
  `radio.uses --global allow`**

## .see also

- `term=steer._.choice._.md` — the neighbour, paved first, whose boundary table surfaced this gap
- `term=replication._.choice._.md` — the gate this pave was tested against, and passed
- `rule.require.nudge-parked-clones.md` — the rule named for this act
- `rule.require.domain-term-itemization` (bhrain/learner) — the rule this absence violated

---

written by human + beaver 🦫
