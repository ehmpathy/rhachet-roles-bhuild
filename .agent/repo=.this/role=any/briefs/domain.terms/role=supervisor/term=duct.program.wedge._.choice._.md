# domain.term: duct.program.wedge

term.chosen   = wedge
term.kind     = noun
term.boundary = duct.program
term.synonyms.forbidden:
- hung
- stuck
- stall
- freeze
- frozen
- deadlock
- unresponsive

## .what

a program that is **alive and does not answer**. it holds its duct's pane, it acts on no input,
and it did not die.

```
the process lives     ->  ps finds it, and the pane is its
it does not advance   ->  no output, no exit
it does not answer    ->  every address is absorbed
```

three clauses, and each excludes a neighbour:

| the clause | what it rules out |
|---|---|
| **alive** | ⛔ a `husk`. a husk's program is DEAD, and its chrome is leftover bytes |
| **does not advance** | ⛔ a slow program. that one is at work and will finish |
| **does not answer** | ⛔ a `modal`, a `park`. both take input — one wants a key, one wants a gate |

## 🔴 .a wedge is known to NEITHER the poll NOR the clone — only to a PROBE

`term=park` draws this axis and leaves one row open. this is the row:

| | what it names | who knows it |
|---|---|---|
| `duct.box.quiet` · `🧊 frozen` · `at-work` · `down` | a box, from its bytes | the **poll**, from outside |
| `park` | *"i have no legitimate move"* | the **clone**, from inside |
| 🔴 **wedge** | *"it is alive and it does not answer"* | 🔴 **neither — a PROBE, and only a probe** |

⇒ the clone cannot report it, by construction: a program able to say *"i am wedged"* is not
wedged. and the poll cannot see it, because a wedge renders `🧊 frozen` — the same token a park,
a husk, an orphan, and a drift all render (`term=crew.status`).

🔴 **so a wedge is the one duct state with no instrument.** that is why the word ran through 19
uses across 8 term files and 6 skills and got no cluster for six rounds: every other term in this
glossary was paved because some render printed it.

## .the probe — and the frame is what you read, never the clock

address the program by the means it normally accepts, then read whether its **frame** moves:

| the program | address it with | wedged when |
|---|---|---|
| **nvim** | `Escape`, then `:qa`, then a raw `Enter`, then a `crew.refresh` | the cursor row does not move |
| **claude** | `crew.send --keys N`, re-read | the modal is byte-identical across 2+ re-reads, AND the dead-shell scrollback beneath it accumulates the literal keystroke digit (`1`→`11`→`111`) instead of it being absorbed — measured, `term=duct.program.wedge._.choice.reason` row 9 |

⚠️ **read the FRAME, never the elapsed marker.** a timer climbs on a wedged program exactly as it
does on a working one, and `term=false-report` catalogues four rows where that marker was trusted.

⚠️ **a `crew.refresh` that repaints to no effect is part of the probe, not a cure attempt.** a
repaint proves the VIEW is intact, so it parts a wedged program from a mangled pane — and it cannot
signal a process (`rule.always.entool-the-layer-you-drop-below`, the three-rung table).

🔴 **a SIGNAL is not an address, and an unanswered signal is not a probe.** a probe uses the means
the program normally accepts. a merely-slow process absorbs a TERM grace exactly as a wedged one
does — measured, and it cost a claim in a shipped skill header (see the reason file, row 8).

## 🔴 .the claim needs a probe, and both measured false positives skipped one

| # | what looked wedged | it was |
|---|---|---|
| 1 | a clone that stalls on its own file writes | 🔴 **a lost grant** — a resume drops `--permission-mode acceptEdits`, so it asks rather than writes. it answers fine (`work/crewwork.sh:1478`) |
| 2 | three grove processes that outlasted a SIGTERM grace | 🔴 **slow, never stuck** — they exited unsignalled minutes later (`git.grove.prune.sh:296`, 2026-09-07) |

⇒ both are the `partial-audit` shape aimed at a state rather than a scope: **a verdict off a read
that never asked the question the verdict answers.** neither had a probe behind it, and a probe
refutes each in one call.

⚠️ instance 2 is why the grove pruner says **"outlasted"** rather than "ignored" — a grace that
expires measures the grace, never defiance.

## .a wedge is NOT

- **a `husk`** — the sharpest pair, and they take **opposite cures**. a husk's program is gone, so
  `crew.boot --resume` restores it. a wedge's program is alive and holds the pane, so a resume has
  nowhere to land, and only `crew.reboot` clears it
- **a `park`** — a park is a DECISION and its cure is a gate somebody owns. a wedge is a fault and
  its cure is a reboot. `term=park`'s cure table already carries this as its first row
- **a `modal`** — a modal is reachable. one keystroke moves it
- **`🧊 frozen`** — that is what a wedge LOOKS like from a poll, and four other states look
  identical

## .refs

- `.agent/repo=.this/role=any/skills/git.crew.reboot.sh` — the cure, and the only one
- `term=duct.reboot._.choice._.md` — *"only the wedged program dies"*; the middle rung of three
- `term=park._.choice._.md` — excludes a wedge by name (*"a crash, a wedge, and a quota cap are
  not parks"*), and its cure table's first row is this word
- `term=duct.pane.husk._.choice._.md` — the pair this word is most often confused with
- `term=crew.status._.choice._.md` — where `🧊 frozen` absorbs it

## .reason

see `term=duct.program.wedge._.choice.reason.md` — the etymology, the 8-row enumeration that
produced the probe clause, the second sense found in two skills, and the open boundary.

---

written by human + beaver 🦫
