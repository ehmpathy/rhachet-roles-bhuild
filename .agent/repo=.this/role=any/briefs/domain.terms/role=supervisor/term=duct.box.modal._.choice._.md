# domain.term: modal

term.chosen   = modal
term.kind     = noun
term.boundary = duct.box
term.synonyms.forbidden:
- prompt
- dialog
- question

## .what

a **modal** is a box state in which a program has seized the duct's keyboard and awaits a
**choice from an enumerated list**. until a choice lands, no other input reaches the program.

⇒ its discriminator against every peer box state is **the enumerated list**. a box that awaits
free text is not a modal; a box that awaits no input at all is not a modal.

## .the four shapes it covers

| shape | who raises it | what it asks |
|---|---|---|
| a **permission modal, 3-option** | claude | `1. Yes` · `2. Yes, and don't ask again` · `3. No` |
| a **permission modal, 2-option** | claude | `1. Yes` · `2. No` |
| a **skill picker** | one of our own skills | `1. PERMANENT_VIA_REPLICA` · `2. EPHEMERAL_VIA_GITHUB_APP` |
| ⚠️ a **product survey** | claude, unsolicited | `1: Bad` · `2: Fine` · `3: Good` · `0: Dismiss` |

🔴 **row 4 holds only while the list is BELOW the box divider.** a survey renders identically
whether it holds the keyboard or sits spent in the scrollback, and the second is not a modal at
all — measured three times on 2026-09-07, every time beside a clone mid-turn. **read which side of
the divider the list sits on; the options, the emoji, and the words are identical across both.**

⇒ and a survey is never the supervisor's to answer even when it IS live: `--keys 1` files a
product score under the human's name (`rule.require.babysit-permission-approval`).

## 🔴 .the index is NOT the instruction — the LABEL is

the arity is **not fixed**, so a key index memorized off one shape is wrong on another:

| you want | 3-option | 2-option |
|---|---|---|
| approve | `1` | `1` |
| decline | `3` | 🔴 **`2`** |

⇒ so `--keys 3` is not *"the decline key"*. it is *"the decline key on a 3-option modal."*
**read the label, take its index.** a key fired by rote into the wrong arity either grants what
you meant to refuse, or lands as literal text in a box that already cleared.

⚠️ `2` on a **3-option** permission modal is *"yes, and don't ask again"* — a grant beyond this
run, and never a supervisor's to give.

## .what it is NOT

| not a modal | why |
|---|---|
| a shell `❯` awaiting a command | no enumerated list |
| a `duct.box.inflight` — typed text unsent | the human chose; the box holds it |
| a `duct.box.covered` — an overlay above a usable box | the box still takes input |
| a route guard that halts on a stone | it awaits a **skill call**, never a keystroke |
| a `duct.pane.plea` — a printed grant command | it awaits a HUMAN, not a key |

## .refs

- `.agent/repo=.this/role=any/skills/git.crew.poll.sh` — renders it, today as `🚧prompt`
- `.agent/repo=.this/role=any/skills/git.crew.send.sh` — `--keys` is how a modal is answered
- `rule.require.babysit-permission-approval` · `howto.review-permission-requests`

## .reason

- `term=duct.box.modal._.choice.reason.md`
