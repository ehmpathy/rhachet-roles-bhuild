# rule.require.co-author-signature

## .what

every durable artifact a clone authors ends with a **co-author signature**: the act, the human,
the mascot, the emoji.

```
---

written by human + beaver 🦫
```

## .the form, exactly

- a horizontal rule (`---`), a blank line, then the signature line
- always LAST in the file — after `.see also`, after all else
- the human comes **first**: `human + <mascot>`, never `<mascot> + human`
- lowercase throughout (`rule.prefer.lowercase`)
- one mascot. a brief authored across two roles takes the role that owns the file's home
- the emoji is **required, not decoration** — it is what makes the line scannable

**the verb names the act that produced the artifact:**

| artifact | verb |
|---|---|
| a brief, a term cluster, a rule, a howto | `written by` |
| a dispatch body, a seed, a handoff | `dispatched by` |

⚠️ the two are not interchangeable: `written by` says *someone authored this here*;
`dispatched by` says *someone sent this to you*. on an issue body in another org's repo, the
second is the true one and the first misreports the origin.

**the mascot names the ROLE**, so a reader knows whose lens it came through:

| mascot | role / repo |
|---|---|
| 🦫 beaver | `bhuild` — supervisor, dispatcher, behaver |
| 🐢 seaturtle | `ehmpathy` — mechanic, architect, ergonomist |
| 🦉 owl | `bhrain` — driver, reviewer, learner |
| 🐙 octopus | `rhachet` — enroller |

`🐢` on a rule means the mechanic's lens — repo-level, the 3am on-call engineer. `🦫` means the
supervisor's — fleet-level, crews and trees. the same claim carries different weight from each,
and the emoji says which without a word.

## .why — it is a CLAIM that a human was in the loop

a brief with no signature reads as anonymous policy, obeyed on its own authority alone. a
signed brief reads as a decision two parties made, and a future reader who disagrees knows
there is someone to dispute with. a robot can author a brief alone and the artifact would
look identical otherwise — the signature is the one place it says "a human was here, and
this is theirs too." a false one fabricates authorship, the same class
`rule.require.distinguish-prefilled-from-suggested` exists to prevent.

so the signature is earned, never stamped: it goes on an artifact a human shaped — named the
defect, corrected the claim, chose the word, or asked for the rule. a brief with no human in
it is usually a brief that should not be a rule yet.

## .enforcement

- a durable artifact with no signature = **nitpick**
- a signature that claims a human co-author where no human shaped the artifact = **blocker**
  (it fabricates authorship — the same class as a submitted autocomplete ghost)
- the wrong verb, the wrong mascot, or an absent emoji = **nitpick** (drift; fix on touch)

## .see also

- `define.mascots-and-artifacts` (enroller) — the mascot/artifact taxonomy
- `rule.require.distinguish-prefilled-from-suggested` — the fabrication class
- `im_a.bhuild_supervisor` — the beaver's vibe and emoji set

---

written by human + beaver 🦫
