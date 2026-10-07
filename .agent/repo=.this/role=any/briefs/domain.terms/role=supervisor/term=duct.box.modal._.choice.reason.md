# domain.term.choice.reason: modal

## .etymology

**modal** is adopted from ui vocabulary, where a *modal* is a window that puts the interface
into a **mode** — one in which the ordinary inputs do not apply until the window is answered.
that is exactly the box state it names here: the duct's keyboard is in a mode, and a keystroke
means what the list says it means rather than what it usually means.

⇒ the word was already the fleet's spoken word before it was written down. the babysit cron
prompt says *"🚧 N at a modal"* and *"on a 🚧prompt"* **in the same breath** — which is the
inconsistency this cluster settles.

## 🔴 .the choice: `modal` over `prompt`, because `prompt` is ALREADY overloaded

`prompt` was the incumbent by usage — `git.crew.poll` prints `🚧prompt` in published stdout, and
`blocked:on-supervisor` rows render `mechanic:🚧prompt`. it lost anyway, on
`rule.forbid.domain-term-ambiguity`:

| `prompt`, in this repo, means | where |
|---|---|
| a **shell** prompt — the `❯` or `➜` a duct sits at | every `crew.read` of an idle pane |
| a **brain** prompt — the text a cron or a stone hands a clone | the babysit cron is literally *"the cron prompt"* |
| a **modal** — an enumerated choice that holds the keyboard | `git.crew.poll` stdout |

three senses, one word. `modal` has exactly one sense and collides with no extant term.

⇒ so this is not a preference between two clean words. it is
`rule.forbid.domain-term-inconsistency` (one concept, two words, no canon declared) settled in
favor of the word that does **not** also violate `rule.forbid.domain-term-ambiguity`.

⚠️ **the extant `🚧prompt` stdout is left in place until disturbed** — no mass rewrite
(`rule.forbid.domain-term-synonyms`). a touch of `git.crew.poll.sh`'s render owes the rename.

### the rejected alternatives

| word | why not |
|---|---|
| `prompt` | overloaded three ways, above |
| `dialog` | implies two-way exchange; a modal is one question, one key |
| `question` | too wide — a plea asks a question too, and it awaits a human, not a key |
| `gate` | already carries the route's sense (a guard that halts a stone) |

## .evidence — the enumeration that fixed the scope

per `rule.require.enumerate-before-you-name`, the candidates were tested against every instance
the word must cover, listed **before** the word was chosen:

| instance | `modal` covers? | `prompt` covers? |
|---|---|---|
| claude permission ask, 3-option | ✅ | ✅ |
| claude permission ask, 2-option | ✅ | ✅ |
| a skill's own picker (`which mechanism?`) | ✅ | ✅ |
| a product survey (`How is Claude…`) | ✅ | ✅ |
| a shell `❯` that awaits a command | ⛔ correctly excluded | 🔴 **wrongly included** |
| the text a cron hands a clone | ⛔ correctly excluded | 🔴 **wrongly included** |

⇒ both words cover every real instance. `prompt` **also covers two things that are not the
concept**, which is the too-wide failure the enumeration exists to catch.

## 🔴 .the measured cost — the arity is not fixed, and the extant key map assumes it is

**2026-09-06**, `rhachet.beav.fix-node-pty-install/mechanic`, on a `radio.task.push` chained
with `&&`. the babysit instruction, as it stands, reads:

> *approve `--keys 1` … decline `--keys 3` (the option that reads `No` — the LAST one. NEVER 2:
> that is "yes, and don't ask again", a grant beyond this run)*

the modal that actually rendered was:

```
 Do you want to proceed?
 ❯ 1. Yes
   2. No
```

**two options. `No` is 2, and there is no 3.** the approval was correct because the label was
read, not the index. had a decline been owed and `3` fired by rote, the keystroke would have
landed as literal text in the box — the exact hazard `git.crew.send` warns of.

⇒ the instruction's own words already carry the cure — *"the option that reads `No`"* — and its
parenthetical *"the LAST one"* is what makes it survive the arity change. **the index is a
consequence of the label, never a substitute for it.** this file states it because a reader who
memorizes `1`/`3` has memorized a 3-option modal, not a modal.

⚠️ and the trap has teeth in one direction only: on a 3-option modal, `2` is a durable grant.
so the failure is asymmetric — a rote `3` on a 2-option modal is noise, while a rote `2`
anywhere is a self-granted permission.

## 🔴 .the enumeration's row 4 was WRONG — an option list is not thereby a modal

**2026-09-07**, `rhachet.beav.fix-node-pty-install/mechanic` — the same tree as the arity case
above, and the same survey the table names on row 4. it rendered like this:

```
● How is Claude…  (optional)
  1: Bad    2: Fine   3: Good   0: Dismiss

──────────────────────────── mechanic ──
❯
────────────────────────────────────────
```

⚠️ **the option list sits ABOVE the box divider, and the box below is empty.** the clone was mid
`git.repo.test`, 15m14s into a 30m timeout. so the list held no keyboard whatever — a key sent
there lands as literal text in an empty box, which is the recorded harm.

🔴 **row 4 says `a product survey (How is Claude…)` — ✅ modal covers it.** that row is unsound
as written: it names a **render**, and the term's own definition turns on a **state** — *"an
enumerated choice that holds the keyboard."* the identical bytes can be either.

| where the option list sits | holds the keyboard? | it is a… |
|---|---|---|
| **below** the divider, box occupied | ✅ | 🚧 a **modal** |
| **above** the divider, box empty | ⛔ | transcript. a spent render |

⇒ so the repair is not a new word — it is a **discriminator on the extant one**, and it is free
and syntactic: **read which side of the box divider the list sits on.** the count of options,
the emoji, and the words are all identical across the two states, and not one of them parts them.

### ⚠️ why this is the TWIN of the `queued` harm, from the other side

both defects are one misread of a **published surface**, and they fail in opposite directions:

| the misread | the wrong act | how it fails |
|---|---|---|
| a `📬queued` box read as unsent | `--keys Enter` | 🔴 silently — a stray submit, tally unchanged |
| a spent option list read as a modal | `--keys 0` | 🔴 silently — literal text into an empty box |

⇒ **neither errors.** the pair is the argument for the same maxim `term=duct.box.unread` already
carries — *read the box state, never the tally* — extended one notch: **read where the render
sits, never what it says.**

✅ **the classifier got this right.** `git.crew.poll` emitted no `🚧` for that tree, and a naive
pane read would have sent a key. the instrument was ahead of the brief, which is the inverse of
`term=duct.box.inflight`'s lag and the same defect class: hold the doc's state set against the
instrument's verdict set, in both directions.

### 🔴 .that ✅ does NOT hold — the classifier emitted `🚧` twice for this state, same day

**2026-09-07**, the same tree, two consecutive supervisor ticks. both times the poll rendered:

```
🚧 blocked:on-supervisor — rhachet.beav.fix-node-pty-install
     🚧 foreman:shell mechanic:🚧prompt reflector:shell
```

and both times a pane read found **no modal anywhere** — a spent survey above the divider, an
empty box below it, and the clone mid-turn with a live spinner over a bash command `3s` into a
`10m` timeout. a `--raw` read confirmed it, to rule out a modal below the fold.

⇒ so the instrument is **not** ahead of the brief. it holds the discriminator in one direction and
loses it in the other:

| what the pane holds | the poll emits |
|---|---|
| a survey **and** a live modal | ✅ `🙋ask? × 1` **beside** `🚧prompt × 1` — parted |
| a survey **alone**, spent | 🔴 `🚧prompt × 1` — a false claim on the supervisor |

⚠️ **the false positive is the costlier direction, and it is the one that reads as actionable.**
`blocked:on-supervisor` asserts *"one keystroke from you clears this"* — false twice over here: the
crew is not blocked, and the only key the box would take files a product score under the human's
name. the recorded harm is a key into an empty box; this render is the invitation to it.

🔴 **the lesson generalizes past this row.** the earlier ✅ was drawn from **one** poll on one tree
— `rule.require.enumerate-before-you-name`, in the very clause that refused a coinage for the same
reason two paragraphs down. **an instrument credited off a single agreement is a correlate, not a
record.**

### ⚠️ .the coinage trigger FIRED by count, and is still refused — the kind is n=1

the clause below sets the bar at *"a second instance earns the coinage."* by count it is met: three
instances now, all on 2026-09-07.

⛔ **all three are the same survey, on the same tree, in one session.** that is the `degenerate`
shape `rule.require.enumerate-before-you-name` names — a list short by construction, where a word
would fit every row because every row is one row. a spent skill picker or a spent permission ask
would widen it; neither has been seen.

⇒ so the trigger is met in the letter and unmet in the spirit, and the word waits. **what the three
instances DO settle is the classifier claim above** — which needed no new term, and is the more
expensive of the two errors.

### .why no new term was coined

the state *"an option list rendered into the scrollback, which holds no keyboard"* has **one**
recorded instance. `rule.require.enumerate-before-you-name` refuses a word on a sample of one,
and the enumeration that would justify it cannot be written yet. ⇒ recorded here as a
discriminator on `modal`; a second instance earns the coinage.

## .disputes

no disputes raised.

---

written by human + beaver 🦫
