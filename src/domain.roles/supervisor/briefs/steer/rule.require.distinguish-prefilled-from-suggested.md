# rule.require.distinguish-prefilled-from-suggested

## .what

before you submit ANY text sitting in a dispatchee's input box, prove which of four
states it is in. a plain `duct.read` strips color, so from a plain read these are
indistinguishable — a verdict from a plain read is a guess, not a read.

| state | what it is | colour | in the live box? | already sent? | Enter does |
|---|---|---|---|---|---|
| **suggested** (ghost) | autocomplete from history | dim `[2m` | no — never in the buffer | — | **fabricates** an instruction |
| **prefilled** | a human typed it, walked away | normal | yes | no | relays the human's words ✅ |
| **queued** | typed AND already submitted | normal | no — sits ABOVE the box | yes | **a stray keystroke** into an empty box |
| **in flight** | human still at the keyboard | normal | yes, a fragment | no | relays half a sentence under their name |

## .why

to submit a ghost puts words in the human's mouth. autocomplete draws from prior
history, which is full of approvals — a ghost offered at the exact moment a gate
blocks can read as an authorization, defeating `rule.forbid.self-grant-human-gates`
with no forbidden command ever typed. observed live twice, in two repos, each
aimed at the gate live at that moment — once as prose that reads like consent, once as
the literal gate command cut one keystroke short.

each of the other three mis-sends is the same root error in a different disguise: **a
keystroke aimed at a target that is absent, already-consumed, or not yet finished.**

## .the discriminators

**ghost vs real** — the colour axis. captured with ANSI preserved:

```
suggested (ghost):   ESC[39m ❯ ESC[2m approve the 3.2 gate ... ESC[0m
prefilled (typed):   ESC[38;5;246m ❯ ESC[39m zzprobe
```

`ESC[2m` (SGR 2, dim) wraps the ghost and only the ghost. a second tell: the ghost
disappears the instant real text is entered — it was never in the buffer.

**sent vs unsent** — box position, not colour. a queued message sits ABOVE the live
box, which then reads EMPTY beneath it:

```
❯ can we drop all the 'seeds' that mention radio…    ← highlight bg + white — QUEUED
❯                                                     ← empty — this IS the live box
* compacts conversation…                              ← clone is mid-turn
```

three tells, any one settles it: a highlight background on the text row (the live box
has none); a second, empty `❯` row below it; the placeholder reads `Press up to edit
queued messages` (claude names the state). ⚠️ that placeholder itself renders dim, so a
shallow capture that catches it and misses the queued text one row up misreads as a
ghost — read `--lines 20`, never `--lines 8`.

**finished vs mid-keystroke** — a queued message sits above a *non-empty* live box:

```
❯ ok make that fix            ← highlight bg — QUEUED, already sent
❯ and have you dogfooded      ← live box, normal intensity, cursor after a fragment
✢ proofs… (0/2 · 1m 11s)      ← clone is mid-turn
```

nobody submits a message then abandons a half-sentence beneath it — a queued row above
a non-empty box is a presence stamp: the human is at this keyboard right now.

## .how to check

```bash
rhx git.crew.read --tree $tree --who mechanic --raw --lines 20 | cat -v
```

`--raw` keeps escapes, so a gray ghost reads apart from white prefilled text.
`rhx git.crew.poll --live --boxes` reports the box verdict per seat already, so a sweep needs
no manual check — route off the poll, not a hand read.

## .the rule

| the box holds | you must |
|---|---|
| `[2m` dim text | leave it — never Enter it |
| normal text, live box **empty** | ⛔ leave it — QUEUED, already sent |
| normal text, live box, **whole thought**, no queued row above | relay it — `--keys Enter` |
| normal text, live box, **fragment**, or a queued row sits above a non-empty box | ⛔ leave it — human is at the keyboard now |
| empty buffer | naught to submit |
| cannot tell (remote, no raw) | treat as suggested — do not submit |

default to the ghost reading: a missed real message costs one delayed tick; a
submitted ghost fabricates an instruction and can breach a gate.

a queued message needs no action from you at all — it is delivered by the CLONE, at
the close of its own turn. the supervisor's whole part is to stay out of the way.

## .form your own opinion

even a correctly-identified ghost tempts a read as advice. it is not: a string match
against past input, carrying no judgment about current state, and it will confidently
propose the exact move a human-only gate exists to prevent. decide what a dispatchee
needs in your own words; never adopt the ghost's sentence as your opinion, never relay
it as the human's.

## .enforcement

- `--keys Enter` on input-box text with no prior `--raw` check = **blocker**
- `--keys Enter` on a **queued** message = **blocker** (lands in the empty live box as
  a stray keystroke, which the next poll reports as a false `✍️ PREFILLED` human signal)
- `--keys Enter` on a **fragment** with a queued message above it = **blocker** (relays
  half a sentence under the human's name)
- a colour verdict from a capture too shallow to hold the box and the row above it =
  **blocker** (a `partial audit`; a dim placeholder alone reads as a ghost)
- a ghost submitted as the human's words = **blocker** (fabricates an instruction; if it
  authorizes a gate, also a `rule.forbid.self-grant-human-gates` breach)
- a ghost quoted back to the human as "their message" = **blocker**
- a ghost's content adopted as the supervisor's own recommendation = **nitpick**

## .see also

- `rule.forbid.self-grant-human-gates.md` — the breach a submitted ghost produces
- `rule.require.babysit-permission-approval.md` — the sweep that submits queued messages
- `rule.require.verify-after-send.md` — read after a send; this rule is its before-the-send twin
- `rule.require.trust-but-verify.md` (ehmpathy/mechanic) — the general form

---

written by human + beaver 🦫
