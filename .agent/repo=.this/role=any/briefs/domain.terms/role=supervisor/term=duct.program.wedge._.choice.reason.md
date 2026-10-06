# domain.term.choice.reason: duct.program.wedge

## .etymology

**adopted, never coined.** the word was already this repo's, in 19 uses across 8 term files and 6
skills, before any cluster existed — `term=park` excludes it by name, `term=duct.reboot` is
*defined* in terms of it (*"only the wedged program dies"*), and `term=spiral` and
`term=duct.pane.husk` both lean on it. the pave records a word in use; it invents none.

the metaphor is what earns it over every alternative: **a wedged door is intact and immovable. a
dead door is off its hinges.** so the word carries the alive-ness, which is the one clause that
parts it from a `husk`.

| rejected | why |
|---|---|
| `frozen` | ⛔ **taken, one layer over.** `🧊 frozen` is the poll's OBSERVATION between two reads (`term=poll.flap`), and a park, a husk, an orphan, and a drift all render it. to reuse it here would name a state with the word for its symptom |
| `stuck` · `stall` · `freeze` | ⛔ **already forbidden**, as synonyms of `park`. to revive one here would re-open a settled forbid |
| `hung` | the closest miss. common unix usage, and it spans **dead and alive** — a "hung process" is as often a zombie. the alive/dead split is the entire term |
| `deadlock` | asserts a mechanism — two parties, a mutual wait — that no measurement here supports. an nvim wedged on a redraw is no deadlock |
| `unresponsive` | accurate, and it names the **prober's experience** rather than the program's state. a program is unresponsive *to someone*; it is wedged on its own |

## .the evidence — the 8-row enumeration, and rows 7–8 changed the definition

my first draft read *"a program that makes no progress."* the instance list broke it:

| # | instance | a wedge? |
|---|---|---|
| 1 | nvim in `declastruct-aws.beav.feat-ssm-document/foreman` — deaf to `Escape`, `:qa`, raw keys, and a refresh; cursor fixed at `245:1` | ✅ |
| 2 | nvim in `rhachet-roles-bhrain.beav.feat-telepath-role/reflector` — same shape, same day, same cure | ✅ |
| 3 | a stop-hook run: 72m at `0/2`, then SIGTERM (`term=duct.pane.husk`) | ✅ |
| 4 | a **husk** — exit 143, leftover chrome, a live shell prompt beneath | 🔴 **no** — dead |
| 5 | a **modal** — a box that holds a prompt | 🔴 **no** — one keystroke moves it |
| 6 | a **park** — a clone at rest before a gate it may not open | 🔴 **no** — deliberate, and `term=park` says so |
| 7 | a clone that stalls on its own file writes, after a resume dropped `acceptEdits` | 🔴 **no** — a lost grant (`work/crewwork.sh:1478`) |
| 8 | **five** grove nvim called wedged, on a grove at `runq 35` | 🔴 **no** — **three exited on their own**, minutes later, with no second signal. `--mode apply` was never run (`git.grove.prune.sh:296`) |
| 9 | a claude mechanic on `rhachet-roles-bhuild.beav.feat-behavior-route-upgrades` — 4 consecutive ticks of `crew.send --keys 1` at a byte-identical modal; the key never reaches the live TUI, and the dead-shell scrollback beneath it grows one literal digit per send (`1`→`11`→`111`→`1111`) | ✅ — first confirmed claude instance |

⚠️ **rows 4–6 are the question the deferral was held on** — the 2026-09-06 round wrote *"deferred
because this round used it and settled naught about its bounds — is a modal a wedge? is a husk?
both look identical from a poll."* they look identical **from a poll**, and that is a fact about
the instrument rather than about the states. rows 4, 5, and 6 each fail a different clause.

🔴 **rows 7 and 8 are the ones that moved the definition**, and neither was in view when the draft
was written. both make no progress. neither is wedged. row 8 in fact **advanced the whole time**,
merely slower than a grace timer.

⇒ so **progress is the wrong axis, twice over**: it is unobservable from outside, and a program
can lack it without a fault. the axis that survives all nine rows is **responsiveness** — and
responsiveness cannot be read at all. it must be **provoked**. that is where the probe clause in
the say file comes from; it was derived from the enumeration rather than assumed.

### 🔴 row 8 already retired a claim made ABOUT this word — a SIGNAL is no probe

`git.grove.prune.sh` shipped with a header that read *"a wedged process is deaf to TERM by
definition."* a human asked *"did it kill the wedged ones?"* and the answer refuted it: three of
the five exited on their own.

the mechanism is the durable half. **on a grove at `runq 35` a process may wait minutes to be
scheduled at all**, and nvim writes swap files in its TERM handler before it returns. so:

> **a short grace measures the grove's LOAD, never the process's defiance.**

⚠️ **the instrument would therefore have been most destructive exactly where it was most needed** —
on the most saturated groves, where a slow clean exit converts into a SIGKILL, which is the
lost-buffer outcome the TERM was sent to avoid. grace 5s → 60s, polled rather than slept, and the
render now says *"outlasted the grace"* rather than *"ignored TERM"*.

🔴 **so a signal is not an address, and unanswered-signal is not a probe.** a probe uses the means
the program **normally accepts** — a keystroke to an editor, a message to a clone — and reads the
frame. a signal asks the kernel to interrupt it, which a merely-slow process absorbs exactly as a
wedged one does. **this is the one false probe the record has already paid for.**

## .the measurement — 2026-09-07, two panes, four addresses each

both nvim instances were addressed four ways before the verdict:

```
crew.send --what 'Escape :qa'   ->  cursor at 245:1
crew.send --keys Escape          ->  cursor at 245:1
crew.send --keys ':qa' + Enter   ->  cursor at 245:1
crew.refresh                     ->  repaint clean, cursor at 245:1
```

the fourth is the informative one. **the repaint succeeded** — so the view was intact, the duct
was alive, and tmux answered normally. only the program did not. that is the read that parts a
wedge from a mangled pane, and it is why `crew.refresh` belongs to the probe rather than to the
cure attempts.

`crew.reboot --who <role>` cleared both, cwd intact, on the first call.

⚠️ **`earlyoom` is ruled out as the cause.** it sends SIGTERM, which would END nvim and hand the
shell back — a `husk`, never a wedge. whatever produced these left the process alive.

## .the measurement — claude, row 9 — the probe this word's own say-file called `unmeasured`

nvim's tell is a fixed cursor coordinate; claude has no such coordinate to read. its probe had to
wait for a claude instance that stayed wedged long enough to be addressed repeatedly, and that is
what row 9 supplied:

```
crew.send --keys 1   ->  modal byte-identical, tick 1
crew.send --keys 1   ->  modal byte-identical, tick 2; dead-shell scrollback now reads "11"
crew.send --keys 1   ->  modal byte-identical, tick 3; dead-shell scrollback now reads "111"
crew.send --keys 1   ->  modal byte-identical, tick 4; dead-shell scrollback now reads "1111"
crew.refresh         ->  repaint clean, modal STILL byte-identical
crew.reboot          ->  mechanic auto-resumes, clears the grepsafe check it was stuck on,
                          makes a real edit in the same turn
```

the fifth line is claude's version of the nvim probe's fourth: **the repaint succeeded**, so the
duct was alive and tmux answered normally, and only the program did not — the same read that
parts a wedge from a mangled pane, transposed onto a program with no cursor to watch.

the digit accumulation is the piece nvim's probe has no analog for: it proves the keystroke was
never ABSORBED by the live TUI at all — it landed on a **stale target** (a dead shell sitting
beneath the render, per `term=duct.pane.husk`'s own shape, though the process above it was not
dead here). that is a second, independent tell for the same verdict a byte-identical re-read
already gives, and it is available only because claude's failure mode happens to leave a paper
trail a repaint does not.

⇒ **do not hammer plain resends past 2 attempts once this pattern shows** — a 3rd and 4th send
add naught but another accumulated digit. the remedy order is refresh (rule out a mangled pane,
cheap) → reboot (fixes it, confirmed) → never a longer resend loop.

## 🔴 .a SECOND sense, in two skills — and it is not this word

`git.tree.behavior.sh:248` and `git.tree.achievement.sh:195` both read *"the install may run
TWICE, with a build **wedged between**"* — the **interposed** sense, as in a shim driven between
two boards. it shares no clause with the state above.

⇒ not graded a violation: both are **code comments**, and `rule.forbid.domain-term-synonyms`
permits a synonym in a comment while it binds a contract. recorded because
`rule.forbid.domain-term-ambiguity` grades an overload in a contract a blocker, and a reader who
greps `wedge` gets both senses with no tell. **if either sense ever reaches a flag, a status token,
or a skill name, this is the collision to expect.**

## ⚠️ .the OPEN question — the boundary is `duct.program`, on thin evidence

`rule.require.boundary-qualified-terms` asks *"a wedge, of WHAT?"* and the answer taken here is a
**program** — the middle of the repo's own three rungs (view · program · duct), named in
`term=duct.reboot` and in the substitution table of
`rule.always.entool-the-layer-you-drop-below`.

that answer is defensible and it is not settled:

- ✅ every **confirmed** wedge in the record — rows 1, 2, 3 — is a program inside a duct's pane
- ⚠️ the only **paneless** use of the word, row 8, turned out to be a false positive
- 🔴 **n=1 on that second line.** one rejected instance is not evidence that a paneless wedge
  cannot exist; it is evidence that the one we looked at was not one

⇒ so the boundary is taken from where the CURE lives (`crew.reboot` addresses a duct and a role)
rather than from an exhausted walk of the subject space. **a single confirmed wedge in a process
with no duct would widen it**, and that instance should be filed here rather than paved anew.

⚠️ this is the `degenerate` shape from `rule.require.enumerate-before-you-name`, caught early: a
word that fits every instance in view, where the instance list is short by construction.

## .why it went six rounds undeclared

the 2026-09-06 round logged it as *"exactly `park`'s own pre-pavement shape"* and was right about
the shape and wrong about the cause. `park` went undeclared because it was a **decision** no
instrument could print. this word went undeclared for the sharper reason:

> **`git.crew.poll` cannot print it even in principle.** a wedge has no render, because the one
> read that establishes it is an ACT, and a poll takes no acts.

⇒ every other cluster in this glossary was paved off a line an instrument printed. this one had to
be paved off an act a supervisor took, twice, and noticed it had taken.

## .disputes

none open.

⚠️ one carried question, from round 5 and unrelated to the word: `grant` holds an authority sense
in `rule.forbid.self-grant-human-gates` and a meter sense in `term=partial-audit`. row 7 above uses
it in the meter sense. flagged there, not settled here.

---

written by human + beaver 🦫
