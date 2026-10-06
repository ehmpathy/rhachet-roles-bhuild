# domain.term.choice.reason: duct.reboot

## .etymology

**`reboot`** is borrowed from the machine sense every operator already holds: *the box stays, the
software it runs is replaced.* that is exactly the scope here — the duct is the box, the pane's
foreground program is the software.

the rejected synonyms, and why each fails:

| word | why it is forbidden |
|---|---|
| `restart` | says naught about WHAT restarts. the duct does not restart; the program does |
| `respawn` | the tmux substrate's own word (`respawn-pane`). to adopt it names the mechanism rather than the motive (`howto.domain-discovery` — name from why, never how) |
| `reset` | claims the duct returns to an initial state. the **cwd survives**, so it does not |
| `recycle` / `bounce` | ops jargon for a service restart; neither says the container survives |
| `kill` | names the death and omits the replacement, which is the half that matters |

## .why it was DEFERRED, and what settled it

`progress.2026-09-05` deferred this cluster with a stated reason, and the reason was legitimate:

> *"the open question is whether `reboot` and the husk it produces are one concept seen twice
> (a reboot MAKES a husk), which is a discovery question, not a name question."*

⇒ that is the one valid ground for a deferral (`im_an.obsessive_learner.for.domain.terms`). it
is recorded here because a deferral with no recorded reason is indistinguishable from an
oversight.

### the measurement that settled it — 2026-09-05

a wedged nvim in `rhachet-roles-ehmpathy.beav.fix-grepsafe-slashed-glob/foreman` was rebooted.
**the pane came back clean** — the prior prompt `➜ nvim` in scrollback, then a fresh prompt, and
no leftover nvim frame at all.

a husk, by contrast, is *defined* by the leftover frame: claude's chrome still drawn, with
`Resume this session with:` in the middle of it.

⇒ **a reboot CLEARS the pane; an unrebooted death leaves its frame.** so the two are disjoint,
and the deferred discovery question has a measured answer. the cluster is owed and now paid.

## .the incident that forced the term — the verb was BROKEN and lied

the reboot could not be run at first, and the way it failed is the term's most useful evidence.

`duct.reboot.sh` **sourced `ductwork.sh`** — which defines a fully grove-capable `duct.reboot()`
that parses the uri's host, probes the remote session, and respawns over ssh
(`ductwork.sh:1586-1620`) — and then **ignored that function**, and re-did the job with bare
`tmux` calls that reach localhost alone.

so a grove duct's uri was `.`→`_` mangled whole, handed to a local `has-session`, and answered:

```
✋ session not found — no pane to reboot
   the tmux session is already gone. re-open a fresh one with:
     rhx term.open --via kitty --on duct://…
```

⚠️ **three separate defects stacked in that one message:**

1. it reported a session **absent** that `crew.read` had read **live** in the same minute
2. its verdict was **confident** — no hedge, no note that it had only looked locally
3. its suggested cure was to **open a fresh duct over a live pane that held real work**

⇒ `term=false-report`, and the most expensive shape of it: an instrument that narrowed its own
subject set to localhost, then reported the narrowed answer as the whole answer, and named a
destructive cure on the strength of it.

repaired by delegation — one implementation in the lib, the wrapper is an entrypoint.

## .the evidence for the three-verb axis

the axis (`refresh` → `reboot` → `stop`) is not invented here; it is read off the extant
implementations:

- `duct.refresh` reaches only `refresh-client` and `window-size latest` — **neither can signal a
  process**, so it cannot end a program even by accident
- `duct.reboot` reaches `respawn-pane -k`, which sends SIGTERM to the pane's program and spawns a
  shell in its place, with `-c <cwd>` to hold the directory
- `duct.stop` ends the tmux session, and with it every conversation in it

⇒ each verb is strictly more destructive than the last, and the order is total. that is what
makes the middle rung necessary rather than a convenience: without it, an operator with a wedged
program has only a repaint that cannot help and a stop that costs the conversation.

## 🔴 .why its absence licensed a rule violation, twice

the implementation's own header records the first instance:

> *"on 2026-07-29 a robot hit a busy duct mid-diagnosis and reached for ~10 raw `ssh grove-1
> "…"` calls instead — the exact act `rule.require.reach-a-grove-through-its-duct` forbids. the
> human's answer was 'if you ever have a duct stuck, just duct.reboot it'."*

and its conclusion, which generalizes:

> **"an absent escape hatch does not license a rule violation; it licenses the escape hatch."**

⚠️ the 2026-09-05 instance is the same shape one layer up: the verb **existed** but was broken
for groves, which is operationally identical to absent, and the pull was again toward raw ssh.
the cure was again the hatch — repair the verb — never the bypass.

⇒ **a broken paved path exerts the same force as an absent one.** that is why
`rule.always.entool-the-layer-you-drop-below` grades a workaround around a broken crew verb a
blocker: the workaround is precisely what keeps it broken.

## ⚠️ .the scrollback discriminator FAILED to reproduce — 2026-09-05, second measurement

the measurement above says a reboot leaves a clean pane, and the say file built the
`reboot` ↔ `husk` test on it. **a second reboot the same day disagrees.**

| | measurement 1 | measurement 2 |
|---|---|---|
| the tree | `rhachet-roles-ehmpathy.…fix-grepsafe-slashed-glob` | `rhachet-roles-bhrain.…feat-telepath-role` |
| the role | foreman | foreman |
| the wedged program | nvim | nvim (codediff) |
| reached through | `duct.reboot` | `crew.reboot`, which delegates to it |
| the cwd | held | held |
| the LAST line | a fresh prompt | a fresh prompt |
| **the scrollback** | **clean — no nvim frame at all** | 🔴 **the codediff frame, still drawn** |

every controlled variable matches. one row differs, and it is the row the say file made the
test.

### the THIRD measurement — same day, and it splits the pair

a **husk** was rebooted (`feat-thinker-notes-overflow/mechanic`, exit 143, its
`Resume this session with:` overlay drawn over a live prompt).

| | measurements 1 & 2 | measurement 3 |
|---|---|---|
| the wedged program | nvim | 🔴 **a dead claude's leftover frame** |
| the overlay after the reboot | (1) gone · (2) still drawn | **gone** |
| what the pane showed after | a fresh prompt | earlier scrollback, then a fresh prompt |

⇒ so the tally is **2 clean, 1 dirty**, and the dirty one is measurement 2. that inverts the
first read of this contradiction: the say file's claim is not simply wrong — it holds in two
cases of three, and **measurement 2 is the outlier that needs the explanation.**

⚠️ what parts it is now visible: measurement 2's nvim was a **live codediff, mid-frame, under
active repaint**. measurements 1 and 3 were programs already done with the screen. ⇒ that is
enumerated test 1 below, and it now has a candidate answer rather than a guess — **still one
instance per arm, so it is a HYPOTHESIS and not yet settled.**

⇒ and measurement 3 answers a question neither of the others touched: **a reboot DOES clear a
husk's overlay.** so the say file's *"a reboot is the cure that removes it"* is measured, on the
subject the term actually serves, for the first time.

### what it does and does NOT overturn

- ✅ **the two concepts stand.** they are parted by WHAT KILLED the program — a signal from
  elsewhere, versus this verb deliberately — which is read directly from what you did, never
  inferred from a pane
- 🔴 **the scrollback TEST falls.** a reader who parts them by the frame will read
  measurement 2's rebooted pane as a husk, and reach for a cure already applied

⇒ the deferral that `progress.2026-09-05` recorded was answered by measurement 1 and is
**re-opened by measurement 2** — though re-opened one notch narrower: the question is no longer
*"are these one concept or two"* but *"what parts them from a pane alone."*

### 🔴 .the FOURTH measurement — test 1's mid-frame arm, and it came back CLEAN

2026-09-06, `declastruct-aws.beav.feat-ssm-document/foreman`, reached through `crew.reboot`.

the wedged program was **nvim codediff, in `normal` mode, with a live diff drawn** — a file tree
beside a diff pane, status line `diff 8:1 10%`. by every variable this file names, it is
measurement 2's arm.

| | measurement 2 | 🔴 measurement 4 |
|---|---|---|
| the wedged program | nvim (codediff) | nvim (codediff) |
| the role | foreman | foreman |
| reached through | `crew.reboot` | `crew.reboot` |
| the cwd | held | held |
| **the scrollback** | 🔴 **the frame, still drawn** | 🟢 **clean — blank lines, then a fresh prompt** |

⇒ the tally is now **3 clean, 1 dirty**, and measurement 2 remains the lone outlier.

#### ⚠️ what this does NOT establish — and the caveat is in the evidence itself

the candidate answer above reads *"measurement 2's nvim was a live codediff, mid-frame, under
active repaint."* measurement 4 was a live codediff — **and whether it was under active repaint
is exactly what its own tell makes doubtful:**

```
'redrawtime' exceeded, syntax highlighting disabled
```

that message means nvim **gave up** on the expensive redraw. so measurement 4 may sit in a third
arm — *a TUI that has abandoned its own repaint* — rather than in measurement 2's.

🔴 **so the hypothesis is WEAKENED and not falsified**, and the honest statement is narrower than
either verdict: **the variable is not "a live TUI versus one done with the screen"**, because
measurement 4 was live and came back clean. whatever parts them is finer than that.

⇒ **do not promote this to a mechanism.** one instance per arm, and this instance carries a
signal that may place it in an arm of its own. what it does settle is that the enumerated test 1
cannot be closed by a *live/exited* split — the split has to be drawn somewhere else.

⚠️ **and the test that would settle it is now cheaper to state**: reboot two codediff panes, one
that HAS printed the `redrawtime` message and one that has NOT, and read both scrollbacks. that
parts *abandoned repaint* from *active repaint*, which is the seam measurement 4 exposed.

### what would settle it

⚠️ **do NOT reach for a mechanism from one contradiction.** the honest state is two
measurements and no third variable identified. what is owed is the enumeration
(`rule.require.enumerate-before-you-name`, applied to a discriminator rather than a word):

1. reboot a wedged nvim **that is mid-frame** and one that has **already exited to its shell**,
   and read both scrollbacks. if they part, the variable is the program's state at the kill,
   never the verb
2. reboot a wedged **claude** — the case the term actually serves, and neither measurement
   covers it. both were nvim
3. read what `respawn-pane -k` does to tmux's **history buffer** as against the visible screen.
   the say file asserts the chrome "dies with the program"; that assertion has never been
   checked against tmux's own contract, and a term should not rest on it

until then, the say file carries the ⚠️ and a reader is pointed at the top row.

## .the open arrears

- ~~**there is no crew-layer verb for this.**~~ **PAID 2026-09-05** — `git.crew.reboot --tree
  <tree> --who <role>` exists, in the exact shape this file named. it derives the grove from
  the ledger, requires `--who`, and refuses `--who all`: the two roles are never wedged at the
  same moment, so a broadcast kills a healthy clone to cure a stuck one. the substitution table
  in `rule.always.entool-the-layer-you-drop-below` now has its row
- **`duct.reboot` has no `--help`** — it rejects the flag outright (`unknown arg '--help'`),
  against `rule.require.skill-help`. ⚠️ still owed, and now **asymmetric**: the crew verb above
  carries a full `--help`, so the two rungs of one ladder answer the flag differently

## .see also

- `term=duct.pane.husk._.choice._.md` — the state this verb clears, and the one it is parted from
- `term=duct.refresh._.choice._.md` — the rung below; repaints the view, cannot signal
- `term=false-report._.choice._.md` — the class the broken wrapper landed in
- `rule.always.entool-the-layer-you-drop-below.md` — why the broken verb had to be repaired
  rather than routed around

---

written by human + beaver 🦫
