# domain.term.choice.reason: duct.submit

## .etymology

coined **2026-09-04**, to split a flag that carried two senses in its own `--help` and one in
its code.

`git.crew.send --help` said:

```
--anyway  also SUBMIT the text (a multi-line --what arrives as a paste,
          which swallows the […] Enter)
```

downstream in `ductwork.sh`, `--anyway` carries exactly one sense: **send into a pane that a
program holds** — bypass the busy-guard. it has no relation to Enter at all.

⇒ so the word was overloaded **in its documentation and nowhere else**, which is the variant
that costs the most: the code was self-consistent and correct, and the help is what a caller
reads.

### what it beat

- **`enter`** — names the KEYSTROKE rather than the act, so it would read as a peer of `--keys`
  and invite the question *"which enter?"*
- **`send`** — 🔴 already taken by the verb this flag rides on (`crew.send`). a flag named for
  its own verb explains naught
- **`commit`** — heavily loaded in this repo (git, and the commit quota gate). an overload with
  a human-only gate is the worst available collision
- **`deliver`** — implies the clone RECEIVED it. this flag presses a key; what the clone does
  with it is a separate fact, and one this flag must not claim
- **`anyway`** — the incumbent, and the whole point: it names the busy-guard bypass. it was
  never the submit

## 🔴 .why the fusion survived so long

**every real call passes both flags together.** a multi-line steer goes to a live claude, so it
needs `--anyway` to get in and an Enter to go through. one flag was passed; one act was absent;
and the flag that WAS passed took credit for the act that did not occur.

⇒ the general shape, worth the record:

> **two flags that always travel together cannot be told apart by use.** only a read of the code
> — or a failure — parts them. this one took a failure, twice.

## .the measured cost

**2026-09-04**, two babysit ticks. a multi-line steer was sent with `--anyway`, the call reported
`sent`, and a read-back showed:

```
❯ [Pasted text #4 +9 lines]
```

still parked in the box, unsent. an honest instrument and a false inference
(`term=false-report`, reader-inference branch). both times it was finished by hand with a
follow-up `--keys Enter`.

⚠️ **`rule.require.verify-after-send` is what caught it, both times** — and it is also what let
it persist. the read-back cured the symptom on the spot, every time, so the defect beneath never
had to surface. **a discipline that reliably repairs a defect by hand will hide that defect
indefinitely.**

⇒ that is precisely the cue `rule.always.entool-the-skills-you-touch` names: *you called a skill
and still finished by hand.* the second occurrence is what made it undeniable — one by-hand Enter
reads as an accident, two reads as a contract.

## .why --submit IMPLIES --anyway, rather than stands beside it

a send that means to submit is a send to a **live** clone, and a live clone holds its pane. so a
`--submit` that did not imply `--anyway` would fail the busy-guard on every honest use, and the
caller would learn to pass both — which recreates the pair that caused the confusion.

⇒ the implication is one-way. `--anyway` alone still submits naught, and that asymmetry is the
whole content of the split.

## .the safety argument, stated once so it is not re-derived

a blind Enter into a box is forbidden elsewhere for good reason: it can submit an autocomplete
ghost, a human's half-typed line, or a transcript turn that only resembles a buffer
(`term=duct.box.covered` — where the `--raw` ghost check passes and is still not enough).

**this is the one case where the buffer's contents are known rather than read.** the same call
placed those exact bytes there one line earlier.

⇒ the safety comes from the absence of a read, not from a check that passed. that distinction is
what keeps this from being cited as precedent for a blind Enter anywhere else.

## 🔴 .the flag's FIRST version had a race, and it passed its own first test

the split above was correct and the implementation was not. a paste and an Enter sent back to
back arrive back to back — and claude's input is an Ink widget, so a **busy** clone consumes a
bracketed paste more slowly than an idle one. the Enter then lands before the buffer holds the
text, and is swallowed exactly as before.

| the clone | the result |
|---|---|
| idle, at a clean prompt | ✅ submitted |
| mid-turn, 3m into a task | ⛔ parked — `❯ [Pasted text #2 +11 lines]` |

⚠️ **an intermittent failure here is worse than a total one.** a flag that works on the quiet
case and fails on the busy one earns trust exactly where it should not be trusted — and a steer
matters most to a clone that is at work. the first version was proved by a send to an idle clone,
which is the one case that could not have caught it.

⇒ the cure is a **settle** (one second), plus a bounded re-press if a read still shows
`Pasted text`. the tool now runs `rule.require.verify-after-send` **on its own behalf**, which is
the point: a caller should not have to read back a flag whose entire job is one keystroke —
**that read-back IS the by-hand step this flag exists to retire.**

## .what is owed

| owed | to |
|---|---|
| a clamp: multi-line `--what --submit` to a BUSY clone, then assert an empty box | `work/work.surface.*.integration.test.ts` |
| ⚠️ the clamp must drive a busy clone — an idle one passed the broken version | same |
| an audit of the other `--anyway` call sites for the same fused read | `crewwork.sh`, `ductwork.sh` |

---

written by human + beaver 🦫
