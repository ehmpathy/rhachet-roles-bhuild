# domain.term: duct.submit

term.chosen   = submit
term.kind     = verb
term.boundary = duct
term.synonyms.forbidden:
- anyway
- send
- enter
- commit
- deliver

## .what

**press Enter after text, so the box hands it to the clone.** it is the second half of a send,
and it is a separate act because claude takes a multi-line payload as a **paste**, which
swallows the Enter that would otherwise have followed it.

```
rhx git.crew.send --tree <slug> --submit --what '<multi-line steer>'
🔧 duct:///…/mechanic sent
🔧 duct:///…/mechanic keys sent: Enter
```

## 🔴 .it is NOT `anyway`, and the two were fused in the DOCS for this verb's whole life

| flag | what it does |
|---|---|
| `--anyway` | enter a pane that a **program holds** — bypass the busy-guard |
| **`--submit`** | **press Enter after the text** |

they travel together on every real call, which is exactly why the fusion survived: `--anyway`
looked like the cause of a submit that in truth never occurred.

⇒ **`--submit` implies `--anyway`** — a live claude holds the pane, so a send that means to
submit must be let in first. the implication is one-way; `--anyway` alone submits naught.

## ⚠️ .why a send does NOT submit by default

a single-line `--what` arrives as typed input and carries its own Enter, so it submits with no
help. only a **multi-line** payload becomes a paste. rather than sniff the payload, the flag is
explicit — the caller states the intent and the tool does exactly that.

## 🔴 .why a blind Enter is safe HERE and nowhere else

an Enter into a box is normally forbidden: it can submit an autocomplete ghost, a human's
half-typed line, or a transcript turn that only looks like a buffer (`term=duct.box.covered`).

**this is the one case where the buffer's contents are KNOWN rather than read** — the same call
put those exact bytes there one line earlier.

⇒ so the safety does not come from a check. it comes from the fact that no read was needed.

## .the failure it retires

a multi-line steer parked in the box **unsent**, while the send reported `sent`. only a
read-back showed `❯ [Pasted text #4 +9 lines]` still there — an honest instrument and a false
inference (`term=false-report`). measured twice on 2026-09-04, both times finished by a by-hand
`--keys Enter`.

## .refs

- `git.crew.send.sh` · `crew.send` — the flag and its guard
- `term=send._.choice._.md` — the act this completes
- `term=duct.box.covered._.choice._.md` — why a blind Enter is otherwise refused
- `rule.require.verify-after-send.md` — the read that caught it
- `rule.always.entool-the-skills-you-touch` (bhrain/learner) — the cue that paved it

## .reason

- `term=duct.submit._.choice.reason.md`

---

written by human + beaver 🦫
