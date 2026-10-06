# rule.always.poll-the-fell-and-heal-sets

> **every babysit tick derives the actionable sets THROUGH the tool — `git.crew.poll
> --fellable` and `git.crew.poll --healable` — never by an eye over the `--stones`
> render and a tree name copied by hand.**

the tick already opens with `rhx git.crew.poll --live --stones`, the one read that answers
*"what moved, what is stuck?"*. this adds the two derivations that answer *"what can I clear
right now, and how?"* — the fell set (merged, clean) and the heal set (a `limited` crew a nudge
can cure).

## .why — a hand-transcribed set is `bulk-over-byhand`, inverted

the `--stones` render names ~30 crews. to fell or heal from it, a supervisor reads the list,
picks the actionable rows, and re-types each tree name into a `git.tree.del` or `git.crew.heal`
— exactly what `rule.require.bulk-over-byhand` forbids: a sweep the tool can derive, performed
by hand.

- **the derivation cannot mis-transcribe.** a tree name copied off a pane can be wrong by a
  character; a name the tool emits is the ledger's own.
- **the derivation cannot mis-classify.** `--healable` excludes a LIVE cap by construction
  (`define.invariant.crew.ratelimit.healable-transient`); an eye over the render can read a 🚫
  as heal-able when its cure is a wait.
- **each row carries its runnable command.** the fell set prints `git.tree.del --name $X`; the
  heal set prints `git.crew.heal --tree $X --who mechanic --mode apply`. run the emitted lines,
  never a hand-built one.

## .the tick, in full

| # | call | answers |
|---|------|---------|
| 0 | `rhx git.grove.saturation` | is the shared box healthy? |
| 1 | `rhx git.crew.poll --live --stones` | what moved, what is stuck, what awaits a human |
| 2 | `rhx git.crew.poll --fellable` | which merged-clean trees to close, with commands |
| 3 | `rhx git.crew.poll --healable` | which limited crews a nudge cures, with commands |
| 4 | `rhx git.crew.modal --answer …` | the 🚧prompts step 3 did NOT claim — see the order clause below |

steps 2 and 3 are **derivations, not new reads** — each is one `crew.poll` call that re-derives
the fleet live, so neither hardcodes it (`rule.require.babysit-cron-per-dispatch-fleet`). act on
the emitted commands, then verify (`rule.require.verify-after-send`).

## 🔴 .step 3 comes BEFORE any modal answer — a 🚧prompt row may ALSO be a heal row

one pane can sit in `🚧prompt` and in `--healable` at once, and the two cures are not
interchangeable. the modal's **option 2** is the discriminator:

| option 2 reads | what the pane IS | the cure |
|---|---|---|
| `No` (a two-option modal) | one permission ask | `git.crew.modal --answer approve\|decline` |
| `Yes, and don't ask again for: …` | an ask with a persistent grant offered | `git.crew.modal` — NEVER key 2 |
| 🔴 `Yes, allow all edits for this session (shift+tab)` | **MODE LOST** — the clone dropped `--permission-mode acceptEdits` | `git.crew.heal --what mode --mode apply` |

claude prints that third offer only when acceptEdits is off, so it is a **signature**, never a
preference. a key `1` there clears ONE write; the next write draws another modal — and the heal
render already says so before you press a key.

measured 2026-09-19: a supervisor answered that exact modal with `--answer approve`. it
re-drew inside one tick; the next tick's `--healable` named the same tree `MODE LOST`, the heal
cleared it, and the clone resumed on its own — one wasted cycle, and the render had already
flagged it.

the two verbs do not cross-reference, and the ORDER is what parts them: run `--healable` before
you answer a modal.

## .the cues

| when… | then… |
|---|---|
| you finish the `--stones` read and see a 👌 merged row | 🔴 do NOT hand-type its `git.tree.del`. run `--fellable`, act on its lines |
| you see a 🚫 limited row | 🔴 do NOT eyeball whether it is heal-able. run `--healable` — it excludes a live cap for you |
| `--healable` names a tree | run its emitted `git.crew.heal` line verbatim; do not re-derive the command |
| `--healable` names none | correct and common — no crew is on a transient 429 or a stale cap this tick |
| you would loop tree names into a heal or a fell | 🔴 that loop is the defect. the selector already looped for you |
| a 🚫 row shows a FUTURE reset clock | NOT in `--healable` — its cure is a wait or auth.swap, never a nudge |
| 🔴 a modal's option 2 offers to allow all edits for the session | the MODE LOST signature. `heal --what mode`, never a key |
| you would answer a 🚧prompt before you ran `--healable` | 🔴 stop. derive the heal set first — that row may be a heal row |
| the same modal re-draws on a tree you answered last tick | you answered a MODE LOST pane with a key. the heal is the cure |

## .the test

> **"am I about to type a tree name into a `git.tree.del` or `git.crew.heal` that I read off the
> `--stones` pane?"**

- yes → 🔴 stop. run the selector; it derives the set and its commands
- no, I ran the selector and act on its emitted lines → correct

## .enforcement

- a fell or a heal acted on a tree name transcribed by hand off `--stones`, where a selector
  would derive it = **blocker** (`rule.require.bulk-over-byhand`)
- a babysit tick that acts on merged or limited crews with no `--fellable` / `--healable`
  derivation = **blocker**
- a `--healable` line skipped because the render was eyeballed instead = **nitpick**
- a 🚧prompt answered with a KEY where its option 2 carried the MODE LOST signature = **blocker**
  — the cure was one call away, and the heal render names it
- a modal answered before `--healable` was derived, where the selector would have claimed that
  row = **blocker**
- a tick with no fellable and no healable set, correctly reported as empty = **correct**

## .see also

- `rule.require.bulk-over-byhand.md` — the parent: enumerate through the tool, never guess
- `rule.require.babysit-cron-per-dispatch-fleet.md` — the tick contract these two derivations
  extend
- `howto.run-a-babysit-tick.md` — the tick PROCEDURE, where these steps live
- `rule.require.verify-after-send.md` — verify each fell / heal landed
- `define.invariant.crew.ratelimit.healable-transient.md` — why `--healable` excludes a live cap
- `rule.forbid.byhand-heal.md` — every heal through the tool; the selector is that tool's index
- `rule.always.entool-the-permission-modal-cycle.md` — the verb step 4 uses, and why it DERIVES
  the key rather than takes a hand-count
- `surgoal.polish-the-supervisor-and-prioritizer-tools.md` — the objective the `--healable` flag
  serves

---

written by human + beaver 🦫
