# domain.term: duct.pane.relic

term.chosen   = relic
term.kind     = noun
term.boundary = duct.pane
term.synonyms.forbidden:
- residue
- spent
- transcript
- stale line
- old output
- scrollback
- history
- leftover
- echo

## .what

**a line the pane keeps after the state it named has passed.** the text is true as a record and
false as a reading, and no mark on it says which.

```
❯ /login
  ⎿  Login successful      <- a RECORD that a login happened, once
❯                          <- the live prompt, beneath it
  ⏵⏵ accept edits on (shift+tab to cycle)
```

a reader that keys on `Login successful` to mean *"the login screen is up"* is right the first
time and wrong forever after.

## 🔴 .relic is NOT scrollback — that is the trap, and it cost a session

**position does not settle it.** the line above sits on the **visible** pane, not in the
scrollback, and it sits there for the life of the repl.

⚠️ measured 2026-09-08 on `grove-ahbode-v20260811`: a supervisor read a false "the repl never came
up" warning and diagnosed it as scrollback staleness from `capture-pane -S -200`. **wrong** — a
live-pane read refuted it in one call. the cure a scrollback theory implies (narrow the capture
window) would have repaired no defect, and would have looked reasonable.

⇒ so the discriminator is **not where the line is**. it is:

> **does this line assert a state that is CURRENT, or record an event that HAPPENED?**

a record has no expiry, so it wins every match it is entered into — including matches held long
after its moment.

## .the seven instances — and the guarded ones were guarded by a convention with no name

enumerated across **two independent rounds**, which is why the count is high and the kinds are
varied (`rule.require.enumerate-before-you-name`):

| the relic | what it outlives | guarded? |
|---|---|---|
| `You've hit your limit · resets <time>` | the cap window | ✅ renders `🔋 cap SEEN` |
| the clone's own grant command | the plea's moment | ✅ renders `🙋 PLEA SEEN` |
| a product survey above the box divider | the modal's life | ⛔ read as a live modal |
| claude's chrome above a shell prompt | the session | ⛔ read as a live box — this is `husk` |
| a reboot's leftover scrollback row | the reboot | ⛔ read as a liveness test |
| 🔴 `⎿ Login successful` | the login screen | ⛔ matched forever, masked the repl |
| 🔴 a spent oauth url in the duct | the url's validity | 🟡 fought by `__url_best`, unnamed |

🔴 **the `SEEN` suffix IS this concept, solved twice and never named.** `term=duct.pane.cap` says
it outright — *"a cap asserts that the pane holds that line. it asserts naught about whether the
clone is capped right now, and the render says `SEEN` for exactly that reason."*

⇒ **a word solved in two places and absent in five others is a word the repo owes.** every
unguarded instance cost real time; neither guarded one cost any.

⚠️ **the first five rows were enumerated by round 10 of `learn.domain.terms`; the last two by round
11, independently.** the convergence is the evidence — two enumerations, different entry points,
same class. see the `.reason` for how the second round nearly coined a second word for it.

## 🔴 .the cure is an AXIS, never a reorder

`git.grove.auth`'s leg 2 met this as a `case` where `Login successful` sat beside the live-repl
marker. its repl arm was placed **last on purpose**, so a live select would outrank it — and the
relic, matched first, made the repl arm unreachable on every pass.

**first-match order cannot settle it, because two claims both hold:**

| the claim | what it demands |
|---|---|
| an **unanswered** select outranks the repl | the repl goes last |
| a **dead record** must not outrank it | the relic goes last |

one ordered list has no slot for both. ⇒ the repair ranks by **answered state** rather than by
position, which is only expressible on a **separate axis** — `$repl` beside `$kind`.

> **a relic and a live marker are not two entries in one ordering. they are two kinds of claim,
> and a reader that ranks them together will always sacrifice one.**

## ⚠️ .how it hides — it degrades naught until it does

a relic match is harmless while the state it names is also true, so it is **invisible for its
whole incubation**. leg 2 fell out of its loop on four consecutive swaps and printed a warning
that blocked no run, because the credential terminus below it was the real verdict.

⇒ a `false-report` by construction (`term=false-report`): the alarm that never blocks anything is
the one that survives longest. it took a **fifth** run, where it finally blocked, to be seen.

## .relic is NOT

- 🔴 **`husk`** — **the two rounds DISAGREE here, and the dispute is open.** round 11 parts them on
  GRAIN (a husk is a whole pane, a relic one line inside it) and asserts a relic's process is
  **alive**. round 10 parts them on the **alive/dead axis** — *"husk: process dead, retains a live
  ARTIFACT's shape · relic: process alive, retains a past STATE's shape"* — and then lists a husk's
  chrome as a relic instance, which its own axis forbids.
  ⇒ both cannot hold. the honest read is that **grain and liveness are two axes**, and a husk may be
  a relic *of the pane grain* while every other instance is one *of the line grain*. **flagged, not
  settled** — see `.reason`, `.disputes`
- **`ghost`** — a `duct.box.ghost` is autocomplete text the box renders in gray and has NOT
  accepted. it is a **proposal**, not a record, and it is visually marked (`ESC[2m`). relic
  carries no mark at all — that is what makes it harder
- **`scrollback`** — a location. relic is a property of a line's CLAIM, and the worst instances
  are on the visible pane
- **`stale line`** — implies it was true and has decayed. a record does not decay; it stays
  exactly as true as it ever was. what expired is the **reading**, never the line

## .refs

- `git.grove.auth.sh` — leg 2's `$repl` axis, and `__url_best` (the spent-url instance)
- `work/ductwork.sh` — the `cap` and `plea` detectors, which render `SEEN` for this reason
- `work.surface.auth.integration.test.ts` `[case25][t9]` — the clamp that holds the axis split

## .reason

see `term=duct.pane.relic._.choice.reason.md` — etymology, the rejected words, and the
2026-09-08 measurement.

---

written by human + beaver 🦫
