# rule.require.nudge-parked-clones — reason

the incident record, the cause tables, and the diagnostic procedures behind the say-level rule.

**the say-level carries awareness; the ref-level carries procedure.** you must KNOW a verdict can
mislead, or you never suspect it — that is reflex. the tests that PROVE which way it misled are
reached only once you already suspect, so they live here.

---

## .the first incident — a survey, unseen for ticks

evidenced 2026-08-10: `rhachet-roles-ghlitch/mechanic` polled `⌨️ box empty` across several ticks
while stalled on a telemetry survey (`1: Bad  2: Fine  3: Good  0: Dismiss`). one `--keys 0` put it
straight back to work.

**the human had to point it out.** the sweep had reported it healthy every tick.

`rhx duct.poll` answers exactly one question: *is a permission modal up?* its detector keys on
permission-modal chrome (`Do you want to proceed?`, `requires approval`, `Esc to cancel`). every
other blocker renders as `⌨️ box empty` — which reads as "idle and fine".

that is the `false report` shape with the twist that makes it easy to miss: the verdict is **true**
— there genuinely is no permission modal — and the false sentence is the reader's paraphrase
(*"it is idle and fine"*). see `term=false-report._.choice._.md`, the reader-inference rows.

---

## ⚠️ .the STATUS LINE is a proxy too — it cannot see a human at the keyboard

the rule says up front that `box empty` is a measurement, not a diagnosis. its own how-to then names
the status line as *"the real state"* — which is the same substitution, one layer in.

the status line reports the **route's** state. it does not report **who is at the keyboard.** a human
who types into a clone changes neither the route state nor the box state, so both instruments the
rule names are blind to them.

evidenced 2026-08-13. `sdk-aws-lambda…apigateway-wire-response/mechanic` read:

```
❯ where do those memeories live ?          ← the human, in the pane BODY
● They live in this project's auto-memory dir: …
  🗿 route complete 🌴🤙                    ← the status line, untouched
```

follow the how-to as written and that clone routes to *"route complete → tell it release into
prod"*. the nudge would have landed in the middle of a live conversation.

### the tell, and where to look for it

**not** on the status line. in the pane body: a human's own words, in a human's voice, with a reply
beneath them.

- an **answered** question is unambiguous — a ghost is never answered
- an **unanswered** line needs the `--raw` color check first
  (`rule.require.distinguish-prefilled-from-suggested`) — normal-intensity is typed, `[2m` is an
  autocomplete ghost, and the two are identical without color

### ⚠️ this read DECAYS, and fast

*"a human is at that keyboard"* is a measurement of a moment, on the schedule of human attention —
minutes, not hours. re-take it every tick; never inherit it from a prior one.

evidenced 2026-08-13 on `rhachet-roles-bhrain…feat-adopt-seeded-briefs`, inside one hour:

| tick | the read | the verdict |
|---|---|---|
| A | a human's typo'd question, answered, modal fresh | **hands off** — theirs, live |
| B, 15m on | the pane **byte-identical**, modal unanswered | **escalate** — nobody is there |

both verdicts were correct at the instant each was made, and they are opposites. so the question is
not *"was a human here?"* but *"is a human here NOW?"* — and a modal that has sat byte-identical
across a whole tick answers it. a human at the keyboard presses a key in seconds.

---

## .the six causes of a `🌊 changed`

> **a `🌊 changed` verdict and a status line are both proxies for "the clone moved". neither can
> name the AUTHOR of the motion.**

| the cause | is it clone motion? | what the supervisor may do |
|---|---|---|
| the clone took a turn | yes | read the status line, route normally |
| my resize rewrapped the pane | no — fabricated (r78) | subtract it; poll before you resize |
| harness chrome appeared | no — fabricated (r83, r102) | ignore |
| **a human typed into it** | **no** | **leave it — no nudge, no send** |
| a third party drove the shell | no | naught to act on |
| **a human resized their OWN window** | **no — fabricated (r104)** | **leave it — and it is NOT subtractable** |

the fourth is the only one whose correct act differs from "leave it alone because it is busy" — it is
*leave it alone because it is not yours*, and a nudge sent there costs the human a collision rather
than the clone a turn.

### the sixth is row 2 with the OWNER changed — and that changes its cure

rows 2 and 6 are one mechanism: a pane rewraps, its bytes differ, the hash moves. they part on **who
dragged the edge**, and the cure follows the owner:

| | row 2 — my resize | row 6 — the human's |
|---|---|---|
| when it fires | on my schedule, so I can sequence around it | at a moment I cannot know |
| the cure | poll BEFORE you resize (r78's reorder) | **none — there is no lever here at all** |
| how it reads | one tick's fabrication, then quiet | arbitrary, and it recurs |

r78's reorder makes MY act subtractable; it says naught about a third party's.

---

## .the three-axis test — which two axes moved names the cause

a rewrap changes the WRAP WIDTH and naught else. so read the pane and compare three things against
the prior read — the **body text**, the **elapsed marker**, and the **line width**:

| body | elapsed | width | the verdict |
|---|---|---|---|
| same | frozen | **changed** | a **rewrap** — subtract it |
| **changed** | **changed** | same | **genuine motion** — the clone took a turn |
| same | frozen | same | **unattributable** — say so; do not guess |

**two of three move, and which two names the cause.** width alone is a rewrap; body-plus-elapsed is
a turn.

evidenced 2026-08-13 on `rhachet-roles-bhrain…feat-adopt-seeded-briefs`: **both** its ducts read
`🌊 changed` on two consecutive ticks; the mechanic's body was word-for-word identical with
`✻ Worked for 6m 49s` frozen across both, and the wrap width went ~46 → ~93 cols. it was not mine —
my resize filters `session_attached == 0` and sets 200, and that window was neither. the lockstep is
itself a tell: **a clone at work and an idle foreman shell do not move together**, but two tabs of
ONE window rewrap together (`git.tree.duct` opens one window per tree).

the inverse proved just as decisive one round later, same tree: body went from an `itemize` yield to
a fresh `route`/`guard` yield, elapsed went `✻ Worked for 6m 49s` → `✻ Baked for 7m 9s`, and width
held at ~46. the exact inverse signature, and the clone had genuinely paved three clusters.

### ⚠️ a FOURTH row the table omits — an axis left UNMEASURED

| body | elapsed | width | the verdict |
|---|---|---|---|
| same | frozen | **unmeasured** | **unattributable** — same as row 3 |

width is the axis that goes unmeasured, and by construction: body and elapsed are legible in the pane
in front of you, while width is a COMPARISON against a read you no longer hold. so a supervisor who
does not deliberately retain the prior read has two axes and a blank.

**an axis you did not measure is not an axis that agreed.**

⚠️ **written because i broke it one round after i wrote the table.** on 2026-08-13 both
`contract-coerce` ducts read `🌊`; its mechanic's body was word-for-word a prior read with
`✻ Sautéed for 2m 40s` frozen, and i reported *"the mechanic's `🌊` is the rewrap"* — a row-1 verdict
on row-1's first two columns and none of its third.

what i COULD honestly have claimed is narrower and still useful: the window was **attached**, so my
own resize skipped it (`session_attached == 0`), so whatever moved that pane was not me. that is a
claim about the ACTOR, and it needs no width at all.

> **name the axes you measured before you name the cause. a cause read off two of three is a guess
> dressed in the table's authority.**

### row 3 has a sub-cause with NO tell at all — a LIVE element

some panes carry an element that changes on its own clock, so two hashes of a still clone differ by
construction — a harness progress line that ends in an ellipsis is the observed case, and it read
`🌊 changed` on **two consecutive polls** against a pane whose body, elapsed, and width were all
three byte-identical across 15 minutes.

it is the SHAPE r97 hypothesized for the `/clear to save NNNK tokens` figure and could not measure.
this does **not** settle r97's question — that entry is about the compaction figure, and this is a
different element. what it supplies is the first OBSERVED instance of the continuous shape, where
every prior chrome case (r83, r97) was a one-way appearance.

**the honest move when all three axes hold:** report the change as unattributable and name the live
element. a fourth cause you cannot yet name is not a fourth cause you get to invent.

---

## ⚠️ .the `Nm` figure has a TELL of its own — a value SHARED across ducts is an EVENT

> **a genuine idle duration is a continuous quantity. two clones that fall quiet in the same MINUTE
> is coincidence; seven is not. so N ducts that read the IDENTICAL `Nm` share one event, and that
> event is what the number dates — never their idleness.**

observed 2026-08-15 in a single `duct.poll --brief` over 27 unchanged ducts:

| the value | how many | the other 17 |
|---|---|---|
| `🧊 unchanged (61m)` | **7** | seventeen ducts, seventeen distinct values |
| `🧊 unchanged (7278m)` | **3** | no other collision anywhere in the fleet |

two clusters, ten ducts, in one poll — against a control group with not one repeat. that ratio is
what makes the tell cheap: you are not asked to judge whether a number is plausible, only whether it
**repeats**.

### what each cluster dates, at the confidence obtained

- the **61m** cluster ↔ `resized-t13` at 21:09:43, read from the instrument's own scrollback. two
  unrelated sources converge on one instant, and it was the first resize in ~14 hours — so many
  windows had drifted narrow and were genuinely rewrapped. **the signature is established; the
  per-duct width change is INFERRED, never measured** (the axis-3 gap, named rather than papered
  over).
- the **7278m** cluster is three FOREMEN — bare shells with no claude, whose panes nobody writes to.
  their clocks date whatever last wrote to all three at once, most likely a shared boot. **candidate
  event unidentified.** recorded as unknown rather than guessed.

### why it generalizes past the resize

the cure the prior sections reach for is *"subtract MY resize."* too narrow. a boot, a teardown, a
fleet-wide send, a host restart — **any act that touches N ducts at once collapses their clocks onto
one value**, and only the first is mine to sequence around. the tell catches all of them, because it
keys on the collision rather than on the actor.

### how to apply

scan the `Nm` column for repeats **before** you read any one of them as a duration.

- a value that appears once → a real idle duration; the rule applies as written
- a value that appears twice or more → **an event's age.** do not feed it to
  `rule.require.pause-babysit-cron-after-idle-streak`, and do not read those clones as parked that
  long. say plainly which event you think it dates, or say you do not know

---

## ⚠️ .a HUMAN mid-conversation resets the streak too — and that is NOT starvation

a human who types into a clone changes its pane, so the duct reports `🌊 changed` and the streak
resets. that looks like a fabrication and is the opposite of it:

| the reset | did the fleet actually change? |
|---|---|
| my resize (r78) · harness chrome (r83) · a human's window resize (r104) | **no** — fabricated. starvation |
| **a human mid-conversation with a clone** | **yes** — new pane content, a new modal arose |

the three starvation cases reset a streak on a fleet where naught moved. this one resets it on a
fleet where motion genuinely occurred, so the rule works as designed rather than starved.

the distinction matters because the repair is scoped by it: **a width-normalized hash owes a fix to
the first three and must not be asked to cover the fourth.** to suppress a human's own keystrokes
from the change verdict would hide the one fleet motion a supervisor most needs to see.

---

## .the quota row in full

every other idle row puts a shape on screen that the poll could not classify. the quota row puts
**naught** there — the box is genuinely empty, the pane genuinely quiet, the clone genuinely stopped.
so it is the case a careful reader is most likely to call healthy.

the tell sits in the SCROLLBACK, never at the cursor: `⎿ You've hit your limit · resets 3am`, usually
printed several times as each queued turn meets the same wall. read enough lines to catch it — a
12-line tail found it on both clones that hit it.

its cure differs from every other row. a survey you dismiss, a gate you surface, a reviewer you
converge with. **a quota you can do naught about at all** — so the only correct act is to name it
plainly and stop, rather than nudge a clone that cannot answer.

⚠️ that holds only while the cap is LIVE. the pane looks identical after the reset passes — same
line, same `box empty` verdict — so a reader who stops at the shape converts a temporary block into a
permanent one. see `rule.require.resume-quota-capped-clones`.

⚠️ **the work is usually NOT lost.** on 2026-08-11 two `camp-grove` clones capped with 13 and 14
subagents respectively, every one COMPLETED, and one had already written its 125-line yield to disk.
so report what LANDED alongside the cap — a tree that reads dead may be one commit from done.

---

## .the dismissal is safe, and is not a grant

a survey's dismiss option (`0`) expresses no opinion, sends no data, and authorizes naught. it is not
the `2` of a permission modal — there is no grant-beyond-this-run to accidentally hand over. dismiss
it without ceremony.

**but read the modal before you answer it.** a modal you did not read is a modal you cannot classify,
and the same `box empty` verdict covers both a harmless survey and a blocker that matters
(`howto.review-permission-requests`, step 0).

---

## .why this is not the babysit rule's job to state

`rule.require.babysit-cron-per-dispatch-fleet` governs the SWEEP — its cadence, its scope, its
change-verdict. this rule governs what you do with a verdict once you hold it. the sweep tells you
where to look; this tells you that its silence is not an answer.

## .see also

- `rule.require.nudge-parked-clones.md` — the say-level reflex this record backs
- `term=false-report._.choice._.md` — why a true verdict can still mislead a reader
- `term=partial-audit._.choice._.md` — the shape of a complete read that answers the wrong question
- the **pause-babysit-cron-after-idle-streak** rule — 🔴 **owed, never authored**, at nheuron or
  here. the streak these fabrications starve

---

written by human + beaver 🦫
