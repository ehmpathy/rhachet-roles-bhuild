# domain.term: mech

term.chosen   = mech
term.kind     = noun
term.synonyms.forbidden:
- mode
- method
- via
- strategy
- how
- driver
- backend
- flavor

## .what

**WHICH machinery a verb uses** to reach an outcome, where the verb has more than
one road to it.

```
rhx git.grove.auth <grove> --brain claude --mech oauth    raise our OWN sign-in
rhx git.grove.auth <grove> --brain claude --mech attach   find one already up
rhx git.grove.auth <grove> --brain claude --mech token    mint a LONG-LIVED token
```

the **outcome** is fixed by the verb; the mech names the **road**. the first two arms
end at the same place — a gate-validated url open in a local browser — and differ only
in how one was obtained.

## 🔴 .a third arm broke the "same outcome" clause, and that is the find

this cluster was written against two arms and asserted a shared terminus. `token`
does not share it:

| arm | where it ends |
|---|---|
| `oauth` · `attach` | a **credential on the grove** — `~/.claude`, machine-wide |
| **`token`** | a **token on stdout**, and the grove **unchanged** |

⇒ so a mech's arms need not converge. what they share is the **verb's subject**, never
its terminus — and `token`'s subject is barely the machine at all: the box is merely a
tty that can render an Ink TUI.

⚠️ the honest verdict is that **`auth` is the word now under strain, not `mech`.** a
verb that both signs a box in and mints a portable credential carries two jobs. the
arms stayed correct; the verb's own gloss did not. flagged rather than settled — a
rename is a fulcrum, and one arm is thin evidence for it.

## ⚠️ .mech is NOT `mode`, and that split is the whole reason the word exists

`--mode` is TAKEN in this fleet, and it is **already overloaded across two senses**
before a third could be added:

| the use | what `--mode` means there |
|---|---|
| `git.release --mode apply` · `sedreplace --mode apply` · `git.tree.del --mode plan` · `git.repo.test --mode apply` · `set.package.*` · `condense` · `git.branch.rebase` · `git.commit.set` | how far it **COMMITS** — preview vs mutate |
| `duct.open --mode headfull \| headless` | whether a human **WATCHES** |

so the flag a reader meets most often answers *"will this change the world?"* — the
single most consequential question a caller asks. to hang a third sense on it
would put *"which machinery"* in the same slot as *"is this safe to run"*, and a
reader who guessed from habit would guess the dangerous way.

that is `rule.forbid.ambiguous-labels` — one term, two concepts, graded a blocker.

## .the axes, side by side

| flag | the axis it names | its value set |
|---|---|---|
| `--mode` | how far it commits · whether a human watches | `plan \| apply` · `headfull \| headless` |
| **`--mech`** | **which machinery** | per-verb, closed |
| `--via` | which **channel** or **backend** it goes through | `kitty` · `gh.issues` |
| `--brain` | which **model** does the work | `claude` · … |

`--mech` and `--via` are the near pair, and the boundary holds: a **via** is a
carrier you hand a payload to and that already exists (`kitty` is a terminal,
`gh.issues` a queue). a **mech** is a procedure the verb runs itself, and it may
have no carrier at all.

## .a mech's arms are NOT interchangeable

a `driver` or a `backend` names a swappable implementation of one interface —
any of them will serve, so a caller picks on taste. a mech's arms carry
**different preconditions**, so a caller picks on the situation:

| mech | it requires | it is right when |
|---|---|---|
| `oauth` | nought — it raises its own prompt | you want this grove signed in |
| `attach` | a sign-in prompt **already up** somewhere | you want THAT prompt answered |
| `token` | nought — it raises its own prompt | you want a credential you can **store** |

`attach` fails outright where no prompt exists. so the choice is a **fact about
the world**, never a preference, and that is why `driver` and `backend` distort.

⚠️ **`token` sharpens that claim rather than dilutes it.** it shares `oauth`'s
precondition (nought) and differs on the outcome, so a caller who picked by
precondition alone would pick wrong. ⇒ an arm is chosen by **precondition AND
terminus**, never by precondition alone.

## .mech is NOT

- **`mode`** — TAKEN, twice. see above
- **`via`** — TAKEN. a carrier you hand off to, not a procedure you run
- **`method`** — correct and long, and **spent in this exact domain**: claude's own
  sign-in screen is titled *"Select login method"*, where it means WHICH ACCOUNT
  TYPE. a `--method oauth` beside that screen reads as a claim about the account
- **`strategy`** — implies a policy that may adapt at runtime. a mech is a fixed
  road, chosen once, by the caller
- **`how`** — an interrogative, not a noun, and it reads as free text rather than
  as the closed set it is
- ⚠️ **`mechanic`** — the ehmpathy ROLE, the clone that does the work. no live
  ambiguity (a role fills `duct:///<tree>/<role>`; a mech fills a flag value), but
  a skimmed `--mech` can read as *"which mechanic"*. a reader parts them by slot

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `git.grove.auth.sh` — the first and, today, the ONLY verb that takes a `--mech`.
  its arms are `oauth`, `attach`, and `token`. the first two are what the word was
  coined against; `token` (added 2026-09-06) is what tested it

## .reason

see `term=mech._.choice.reason.md` — etymology, the rejected `mode` / `via` /
`method`, and the honest note that one verb is a thin evidence base.

---

written by human + beaver 🦫
