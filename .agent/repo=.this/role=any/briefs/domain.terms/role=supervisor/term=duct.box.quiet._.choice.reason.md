# domain.term.choice.reason: duct.box.quiet

## .etymology

⚠️ **`quiet` is not a coinage — the poll already prints it**, and has for longer than this file
has existed:

```sh
git.crew.poll.sh:67    # --stall-mins  minutes of stillness before an EMPTY box reads 😴 CLONE QUIET
git.crew.poll.sh:1717  ACTIONS+=("😴 CLONE QUIET — …")
```

so this pave is a **record of an extant word**, never a decision about a new one. what it settles
is the word's *boundary*, its *glyph*, and its *subject* — all three of which the shipped render
gets wrong, and none of which a reader could have derived from the row.

⇒ that is the shape `duct.box.inflight` and `crew.resume` also carried: a concept live in the
practice, spoken by the tool, with no cluster to hold what it means.

### what it beat

- **`idle`** — the closest miss, and it fails on the same axis the word must be exact about: idle
  asserts *a worker is present and unoccupied*. a quiet box may hold **no worker at all**
- **`stalled`** / **`stuck`** — both assert a **fault**. the two live instances measured this
  session were parked on genuine pleas, correctly, and neither was stuck
- **`parked`** — asserts the clone chose to wait. true for two of four rows, false for the two
  husks, and unknowable from the measurement itself
- **`dormant`** / **`abandoned`** — each imports a cause the sweep cannot see
- **`asleep`** — 🔴 already taken, one boundary up, for a claim of the **opposite kind** (see
  below). the glyph took it anyway

⇒ **six of the seven rejects fail identically: each names a CAUSE, where the measurement holds
only an EFFECT.** `quiet` is the one word in the set that describes the pane and stops there.
that is not a weakness of the word — it is the precise reason it survives all four rows.

## .the enumeration that licensed it

per `rule.require.enumerate-before-you-name`, the instances were listed before the word was
graded — and the list is what proved the word must stay cause-free:

| instance | the pane held still because | live clone? |
|---|---|---|
| `fix-exhausted-level-unlocks-next/mechanic`, 119m, tick 29 | parked on a genuine plea | ✅ |
| `feat-telepath-role/mechanic`, 74m, tick 29 | parked on a genuine plea | ✅ |
| `feat-telepath-role/mechanic`, tick 23 | **SIGTERM, mid-turn** — a husk | ⛔ |
| `fix-contemplation-gate-on-entrance/foreman`, tick 19 | claude exited — a husk | ⛔ |

**n=4, and the split is 2/2.** a word that asserted *live* would be false on half the rows; a
word that asserted *dead* would be false on the other half. only a word that asserts **neither**
covers the set.

and it excludes its neighbours:

| the neighbour | why `quiet` is wrong for it |
|---|---|
| `empty` | true on one capture. `quiet` needs two |
| `unread` | the capture failed. here it succeeded, twice |
| `asleep` | the subject is a **grove**, and the claim is about the instrument |
| `husk` | asserts the claude is gone — one of the two causes `quiet` refuses to pick |
| `inflight` | requires a **non-empty** live box. mutually exclusive |

⇒ covers all four rows, excludes all five neighbours. it holds.

## 🔴 .the glyph collision, and why it is worse than a duplicate

`😴` marks two rows in one file:

| line | the row | the claim | its kind |
|---|---|---|---|
| 1064 | `😴 asleep` | *we could not look at the grove* | about the **instrument** |
| 1717 | `😴 CLONE QUIET` | *we looked twice; the box held still* | about the **world** |

`term=asleep`'s own `.what` carries this sentence:

> *"it is the only verdict in the set that is a claim about the READ."*

that claim was true of the WORD and is now false of the GLYPH. so a reader who learned `😴` from
the crew axis carries *"the instrument could not see"* onto a row where the instrument saw
perfectly well, twice.

🔴 **and the collision propagated the exact defect `asleep` is already disputed for.**
`term=asleep._.choice.reason.md` holds an OPEN dispute over *"whether the word leans on a cause
it cannot know."* `😴` is a picture of a sleeper — a cause — stamped onto a row whose whole
merit is that it names no cause at all.

⇒ **a glyph carries its sense faster than a word does, and it is copied by travelers who never
read either cluster.** per `im_an.obsessive_learner.for.domain.glyphs`, a claimed glyph spreads
at once and each surface makes the repair dearer.

## .the two lesser defects on the same row

both are on `git.crew.poll.sh:1717`, both cheap, and neither is visible from the term alone:

1. **the subject is wrong.** the gate reads the BOX (`--stall-mins` over an `empty` box); the row
   says `CLONE QUIET`. a pane with a dead claude has no clone to be quiet, so on precisely the
   rows that matter most the noun is a fiction
2. 🔴 **the cure is a forbidden call.** it prints `rhx duct.read --on '<uri>'`, which
   `rule.always.entool-the-layer-you-drop-below` grades a **blocker** for a supervisor, with no
   first-one-free. the substitution table already names the replacement

⇒ the second is the sharper one, and it is a new instance of a pattern worth a name: **a paved
instrument that prescribes an unpaved path.** the poll is the most-read surface in the fleet, so
its action rows teach the vocabulary faster than any brief does — and this one teaches a breach.

## .evidence — what the term is FOR

**2026-09-04**, babysit tick 29. the poll flagged two `😴 CLONE QUIET` rows. both trees carried
genuine open pleas, so both were *supposed* to be still. one of them — `feat-telepath-role` —
was the tree that had **already died once that day**, hidden behind a plea for two ticks.

so the quiet row earned a husk check:

```sh
rhx git.crew.read --tree rhachet-roles-bhrain.beav.feat-telepath-role --who mechanic --lines 14
```

⇒ **clean.** a live input box, no shell prompt, no `💥143`, no `Resume this session with:` — the
suffix-test passed and the plea was genuine.

that read is the whole operational content of this term. it cost one call and returned *"no
action owed."* the same read, unrun four ticks earlier, is what let a 7h51m clone sit dead
beneath a plea (`term=duct.pane.husk`).

> **a quiet box is not a problem. it is the one place the fleet's two most different states look
> identical — so it is where a read is cheapest and its absence is dearest.**

## 🔴 .the fourth defect — the row SUPPRESSES itself, and it suppresses by coincidence

the render qualifies each row with *"an age no other duct shares"*, so **a quiet box whose age
collides with any other duct's prints no row at all.** the filter is a de-duplicator, and what it
de-duplicates is a coincidence of the clock.

**2026-09-04**, babysit tick 42, measured on one tree:

| the duct | empty? | still | quiet row? |
|---|---|---|---|
| `fix-contemplation-gate-on-entrance/foreman` | ✅ | **75m** | ✅ printed |
| `fix-contemplation-gate-on-entrance/mechanic` | ✅ | **104m** | ⛔ **absent** |

the mechanic was quiet **29 minutes longer** than the peer that did print, and it was a
`duct.pane.husk` — `💥143`, a shell prompt, `Resume this session with:`. it went unnamed because
another duct in the fleet happened to also read 104m.

🔴 **the suppression is anti-correlated with the danger.** the older a box is, the more ducts its
age can collide with, so **the rows most likely to conceal a corpse are the rows likeliest to be
filtered out.** and the omission is silent: the sweep comes back clean.

⇒ it was found only because a read was taken of that pane **for a different reason** — the
foreman's stone line looked like a double-driver. **had that suspicion not arisen, the husk would
still be dead beneath a poll that reads healthy.** that is the 7h51m failure, one instrument later.

⚠️ and it re-frames the OPEN question below: the age is not merely a weak severity signal, it is
a **gate** on whether the verdict renders at all. a verdict must never be conditioned on how
unusual its measurement happens to look.

## 🔴 .the collision widened to THREE — and the third rides a different AXIS

**2026-09-04**, later the same day. `😴` now marks a third row, and it is the subtlest of the set
because it is not a different concept — it is the **same instrument-failure concept, spoken on a
different axis**:

| the row | the word | the axis | what it says |
|---|---|---|---|
| the banner | `😴 asleep` | **`crew.state`** | the grove was never reached |
| a crew row | `😴 unread` | **`crew.status`** | this poll could not read it |
| the footer | `😴 CLONE QUIET` | *(neither — a duct age)* | we looked twice; the box held still |

⚠️ rows 1 and 2 are **not** a synonym pair to be merged. `crew.state` and `crew.status` are
declared as distinct axes (`term=crew.status._.choice.reason.md`, first table), and a grove that
is unreached is genuinely a different fact from a read that came back empty — a crew on a
**reachable** grove reads `unread` every tick under saturation, with no grove asleep anywhere.

⇒ so the glyph does not merely carry two concepts. **it carries one concept on two axes plus an
unrelated third**, and a reader who learns `😴` from any one row mis-reads the other two.

## 🔴 .the fifth defect — `CLONE QUIET` is blind to the OWNER, so it fires on correct stillness

**measured 2026-09-04.** the footer flagged
`rhachet-roles-bhrain.beav.feat-subconscious-term-distill/mechanic still 72m` — then `87m` the
next tick. the drill-in found a **live, healthy clone** that had finished its work and said so:

> *"what remains — genuinely nothing drivable … blocked ONLY on:
> `rhx route.stone.set --stone 1.vision --as approved`"*

and it declined to fill the wait:

> *"further self-review would be the coast `bear-every-self-review` warns against, since two
> independent lanes just returned zero findings."*

🔴 **that crew's `crew_status` was `blocked:on-human`. it is SUPPOSED to be still.** stillness at
a human gate is the correct behavior, so a row that flags it is a false alarm **by construction** —
and one that, obeyed, would push a driver into exactly the coast it just refused.

⚠️ **the poll already holds the datum.** it computes `crew_status` for every crew in the same run
that emits this footer. so this is the `duct.pane.husk` shape once more — *the datum was measured,
and the verdict that needed it never received it* — and it is now the **third** verdict in this
one instrument to fail that way.

⇒ the cure is a suppression, not a new signal: **do not raise `CLONE QUIET` for a crew whose
status is `blocked:on-human`.** the remaining arms (`inflight`, `frozen`, `blocked:on-defect`) are
the ones where stillness is genuinely unexplained.

## .what is owed

| owed | to |
|---|---|
| 🔴 suppress the row when `crew_status == blocked:on-human` — stillness at a human gate is correct | `git.crew.poll.sh:1717` |
| a glyph of its own, and `😴` left to `asleep` | `git.crew.poll.sh:1717` + the legend |
| the subject renamed `BOX QUIET` | `git.crew.poll.sh:1717` |
| the cure rewritten to `rhx git.crew.read --tree … --who …` | `git.crew.poll.sh:1717` |
| 🔴 **the uniqueness filter dropped — every quiet box earns its row** | `git.crew.poll.sh:1717` |
| a clamp per repair | `work/work.surface.rows.integration.test.ts` |

⚠️ the glyph repair is the one that must not be improvised — per the glyph rule, a grep proves a
glyph **unused**, never **unclaimed**, so the palette settles the replacement, not a search.

## .the OPEN question

**does `quiet` earn a DURATION in its render?** the row prints an age (*"an age no other duct
shares"*), which is a relative claim against the fleet rather than an absolute one. a box quiet
for 6 minutes and one quiet for 119 minutes are the same verdict today. whether the term wants a
severity, or whether the age line already serves, is unsettled — and it turns on data this file
does not yet have: how long a *correctly* parked clone typically waits on a human.

---

written by human + beaver 🦫
