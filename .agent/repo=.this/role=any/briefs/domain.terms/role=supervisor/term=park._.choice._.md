# domain.term: park

term.chosen   = park
term.kind     = verb
term.synonyms.forbidden:
- idle
- stuck
- wait
- pause
- stall
- freeze
- block

## .what

a clone's **deliberate rest at a gate it may not open itself.**

```
it has a move it wants   ->  and the lever is not its own
it declines to improvise ->  and it rests
```

three clauses, and each excludes a neighbour:

| the clause | what it rules out |
|---|---|
| **deliberate** | the clone CHOSE this. a crash, a wedge (`term=duct.program.wedge`), and a quota cap are not parks |
| **rest** | it stopped on purpose. a clone mid-turn is not parked, however long the turn |
| **a gate it may not open** | a lever exists, and it belongs to someone else |

## 🔴 .park is a DECISION. every neighbour is an OBSERVATION

that is the whole of the word, and it is why the repo needed it apart from the five box states
it collides with:

| | what it names | who knows it |
|---|---|---|
| `duct.box.quiet` | the box has not moved | the **poll**, from outside |
| `🧊 frozen` | no change between two reads | the **poll**, from outside |
| `at-work` | a live duct, an empty box | the **poll**, from outside |
| `down` | no duct at all | the **poll**, from outside |
| 🔴 **park** | *"i have no legitimate move"* | 🔴 **the CLONE, from inside** |

⇒ so a park is never read off a box — it is read off the clone's own account of itself. the
poll can suggest one and cannot confirm one, which is exactly what `term=duct.box.quiet` found
when it tested `parked` as a name for its box state:

> *"**`parked`** — asserts the clone chose to wait. true for two of four rows, false for the two"*

**that test is the discriminator, and it was run before this cluster existed.** two of four quiet
boxes were parks; two were not. one word cannot cover both, so `parked` is a forbidden synonym
**of `quiet`** — and `quiet` is a forbidden synonym of **this**.

## 🔴 .park constrains the CLONE's posture, never its ACTIVITY — measured 2026-09-05

the costliest assumption about a parked clone is that it is inert. two parked clones, the same
fleet, the same day, both correctly parked at `1.vision, judge, approved? 👋`:

| the tree | what it did while parked |
|---|---|
| `feat-behavior-route-upgrades` | 🟢 **299m, productive.** read its repo's issue queue, ran an enumeration, found its OWN rule passes 3 of 5 defects it was built to catch, and paid a glossary debt. touched no route artifact, budget intact |
| `feat-thinker-notes-overflow` | 🔴 **1,225 stop-hook runs, unchanged**, then 72m wedged, then SIGTERM. it husked (`term=duct.pane.husk`) |

⇒ **the word says the clone stopped ADVANCING, and says naught about whether it stopped WORKING.**
both rows satisfy the definition exactly. the difference between them is the difference between a
tree that waits well and a tree that dies at the gate, and **this term does not name it.**

⚠️ **that axis is unnamed and unmeasured, and it is the more consequential of the two.** do not
read `park` as a health verdict. a supervisor who treats every parked clone alike will nudge the
productive one — which costs it a turn — and leave the loop to run to a husk.

### 🔴 .and the axis is a PHASE, never a property — the same tree, three hours later

the two rows above read as two kinds of clone. they are not. **`feat-behavior-route-upgrades` is
one tree, read twice:**

| read | its park | the pane |
|---|---|---|
| **299m** | 🟢 productive — a queue read, an enumeration, a glossary debt paid | a fresh turn, new output |
| **404m** | ⚪ **quiescent** — byte-identical scrollback, three hours unchanged | `✻ Worked for 4m 47s`, an empty box, chrome intact |

it did not husk and it did not loop. **it exhausted the legitimate side-work available at its
gate, and stopped.** that is the correct end state — `rule.always.drive-autonomously` respected,
then a clean halt.

⇒ so a park has at least **three phases**, and a single read tells you which one you caught:

| phase | the tell | the cure |
|---|---|---|
| 🟢 **productive** | a live turn, fresh output | leave it. a message costs it a turn |
| ⚪ **quiescent** | an unchanged pane, live chrome, an empty box | leave it. it is correct, and the gate is still the cure |
| 🔴 **lethal** | a hook counter that climbs on an unchanged body | 🔴 the gate, urgently — this one decays into a `husk` |

🔴 **the discriminator between quiescent and lethal is the ONE thing to read for**, and it is not
the elapsed time — both look still. **it is whether a counter climbs while the body does not.**
a quiescent clone rests; a lethal one works at naught, and only the second is on a clock.

### 🔴 .correction — a QUIESCENT park also husks, and not by decay — measured 2026-09-05

the table above reads *"⚪ quiescent → leave it. it is correct"*, and the line just above says
**only the lethal phase is on a clock.** that second claim is false, and one tree falsifies it.

`feat-telepath-role/mechanic` was parked at `1.vision, judge, approved? 👋` with no counter that
climbed and no loop. its pane, read at 120m unmoved:

```
claude --resume "mechanic"        ← the stone line `...approved? 👋` still bleeds through
took 1d12h56m10s at 22:36:32
💥143  ➜
```

**exit 143 — SIGTERM.** it husked. so there are **two roads to a husk**, and the table knew one:

| road | the mechanism | on a clock? | can the clone avert it? |
|---|---|---|---|
| 🔴 **decay** | the lethal phase — a loop consumes the clone from inside | yes, and the pane shows it | yes — it can halt the loop |
| 🔴 **an external kill** | SIGTERM from outside — an oom guard, a session cap, a reaper | **yes, and the pane shows NAUGHT** | 🔴 **no** |

⚠️ **the second road is invisible from the pane, by construction.** a lethal park announces itself
— that is the whole value of the counter tell. an externally-killed park looks *identical to a
correct one* until the moment it is dead, so **no read discriminates it in advance.**

⇒ so the cure column is amended: *"leave it, it is correct"* stays right about the clone's
**conduct** and is wrong about its **safety**. a quiescent park is correct and it is **not safe**,
and its exposure grows with elapsed time rather than with aught the clone does.

🔴 **what this obliges: the clock on a quiescent park belongs to the SUPERVISOR, never the clone.**
the clone cannot see the reaper and cannot outrun it. only the gate ends the exposure — so a park
left long enough is a park that eventually husks, and it husks **at the gate**, which is precisely
where a husk conceals it (`term=duct.pane.husk`, cause 3).

## .what a park OBLIGES a supervisor to do

a park is the one stall state whose cure is never the clone's:

| the stall | the cure | whose |
|---|---|---|
| a wedge (`term=duct.program.wedge`), a crash | a reboot | the supervisor's |
| a quota cap whose reset passed | a resume | the supervisor's (`rule.require.resume-quota-capped-clones`) |
| a modal | a keystroke | the supervisor's |
| 🔴 a **park** | **the gate** | 🔴 **whoever owns the lever — and the clone already checked** |

⚠️ so the reflex a park earns is a **relay**, never a nudge. `rule.require.nudge-parked-clones`
is named for the act and its own table routes a park away from the nudge — a nudge restores
motion to a clone that still has a move, and a parked clone does not have one.

🔴 **but verify the OWNER before you relay.** a clone that names a lever makes a claim like any
other (`rule.require.trust-but-verify`). measured 2026-09-05: `fix-node-pty-install` parked and
relayed three human levers, and **one was the supervisor's** — `keyrack unlock` grants naught, it
opens a session, and it was already spent. a park is honest about the STOP and is not
authoritative about the OWNER.

## .a park is NOT

- **a `duct.box.quiet`** — that is what a park often LOOKS like from outside, and two of four
  measured quiet boxes were not parks. the box is evidence; the clone's account is the fact
- **`down`** — a down crew has no duct. a parked clone is `at-work` with a live one, and the two
  take opposite cures: a boot versus a relay (`term=down`)
- **a `husk`** — a husk is what a park can DECAY into, never a park itself. the husk is dead
- 🔴 **a state that is safe to leave alone.** a park is stable in the route and unstable in the
  clone: it is the entry condition of the parked-clone death spiral (`term=spiral`), where the
  clone's own attempts to rest are what kill it

## .refs

leaned on, undeclared until now, at:

- `rule.require.nudge-parked-clones.md` — **named** for the act, and the route table that sorts a
  park away from a nudge
- `term=duct.box.quiet._.choice.reason.md` — the two-of-four test that parted `parked` from
  `quiet`, and the reason this word was owed a home
- `term=duct.pane.husk._.choice._.md` — what a park decays into, and the gate its death conceals
- `term=nudge` · `term=steer` · `term=escalate` — the three acts aimed at a parked keyboard
- `rule.forbid.self-grant-human-gates.md` — why the gate is not the clone's to open

## .reason

see `term=park._.choice.reason.md` — the etymology, the rejected `idle`/`stall`/`block`, the
boundary question left open, and why a word in 30 files went undeclared this long.

---

written by human + beaver 🦫
