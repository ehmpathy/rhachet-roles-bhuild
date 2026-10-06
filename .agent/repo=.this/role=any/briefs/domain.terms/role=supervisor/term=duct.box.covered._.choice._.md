# domain.term: duct.box.covered

term.chosen   = covered
term.kind     = adj
term.boundary = duct.box
term.synonyms.forbidden:
- hidden
- obscured
- occluded
- masked
- blocked

## .what

**claude is live, and another program is drawn over its input box.** the pane holds a real
claude session — its transcript is right there — but the box a keystroke would land in is not
on screen, because an editor, a pager, or a menu has taken the terminal.

```
🪟 box COVERED (claude is live; a program is drawn over its input box) — read it, never key it
```

## 🔴 .it is the most DANGEROUS box state, and the reason is counter-intuitive

every other unsafe state announces itself. this one **looks like a message waiting to be sent.**

| the state | what a reader sees | what an Enter does |
|---|---|---|
| `👻ghost` | dim text | is refused — the check catches it |
| `❔unread` | no text | no verdict to act on |
| `🚧prompt` | a menu | answers the modal, as intended |
| 🔴 **`🪟covered`** | **white, human-typed text** | goes to **whatever program owns the keyboard** |

⇒ the text on the row IS a real human message, typed by a real human, rendered in normal
intensity. it is simply **not in the box** — it is a past turn in the transcript, which claude
also marks with `❯`.

## 🔴 .why the `--raw` ghost check cannot save you here

`rule.require.distinguish-prefilled-from-suggested` is the guard the babysit protocol leans on
before any Enter. it parts **white from gray** — live text from an autocomplete ghost.

**it has no opinion about live vs HISTORICAL**, and that is the axis this state lives on. so the
check passes, cleanly and correctly, on a message that was answered hours ago.

⇒ **a passing ghost check is not a licence to submit.** it clears one hazard of two.

## .how it is told apart — the CHROME, never the cursor

claude draws its input box between two `───` rules. no transcript turn carries one.

```
────────────────────────  ← the box's top rule
❯ (the live buffer)       ← THIS ❯ is the box
────────────────────────  ← the box's bottom rule
🗿 5.3.verification …     ← the status line
```

so the box's `❯` is **the one whose next line holds a rule**. a pane with `❯` present and none
chromed is `covered`.

## ⚠️ .it is NOT `none`, and it is NOT `unknown`

three verdicts, three different cures — and this file exists because the first two were once
made to carry the third:

| verdict | the claim | the cure |
|---|---|---|
| `none` | there is no claude here — a plain shell duct | boot a clone |
| `unknown` | the ladder matched no arm | **the LADDER is the defect** — it owes a new arm |
| **`covered`** | claude is live; a program is over its box | **read the pane. no defect at all** |

⇒ rendered as `none`, a reader boots a clone that is already alive. rendered as `unknown`, a
reader goes to repair a classifier that is already correct. both are real byhand detours off a
row that should have ended the question.

## .what a supervisor does with it

**read it, never key it.** a covered box is usually a human at that keyboard — they opened the
editor. a keystroke lands in their program, not in claude.

- the crew is **not** blocked on the supervisor; do not treat it as a modal
- the age on the row (`still 521m`) measures the **transcript's** last change, not the human's
- to reach the clone, wait for the cover to clear — or ask the human

## .refs

- `duct.poll.sh` — the chrome selector, the `covered` arm, and its render
- `git.crew.poll.sh` — the join arm that carries it up to the fleet row
- `term=duct.box.quiet._.choice._.md` · `term=duct.box.unread._.choice._.md` — the peer states
- `term=duct.pane.husk._.choice._.md` — the other "claude is not where it looks" state
- `rule.require.distinguish-prefilled-from-suggested.md` — the guard that does NOT cover this

## .reason

- `term=duct.box.covered._.choice.reason.md`

---

written by human + beaver 🦫
