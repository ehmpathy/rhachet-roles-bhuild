# domain.term: at work

term.chosen   = at work
term.kind     = adj
term.synonyms.forbidden:
- up
- live
- active
- busy
- online
- alive
- engaged

## .what

a crew that holds **one or more live ducts**.

```
😶 at work    one or more live ducts     -> the roles are named
😴 asleep     the GROVE did not answer   -> rhx git.grove.wake <grove>
💀 down       no duct, tree on disk      -> rhx git.crew.boot
👻 phantom    no duct, no tree           -> a felled tree's stale rows
```

⚠️ **`asleep` outranks the `down` default, and that is what keeps this term honest.** an
unanswered grove yields the same empty session list as a grove with no crews — so before that row
existed, a crew that could not be READ fell to `down` and read as a crew that had DIED
(`term=asleep`).

it is the top rung of the crew-axis verdict set, and the **only one that must be PROVEN**.
`git.crew.poll.sh:411` starts every crew at `down` and lifts it here only on positive evidence of
a live session — a live duct is a fact you can point at; its absence is not.

## .⚠️ the word claims more than its evidence supports — at THREE layers

this is the whole reason it needs a cluster. `at work` is the fleet's most over-read verdict,
because each layer beneath it can be still while the layer above reports motion:

| the layer | what `at work` actually proves | what it does NOT |
|---|---|---|
| the **grove** | naught — a reachable box can hold a bare shell | that the machine does our work (`term=grove`) |
| the **duct** | a tmux session answers | that a clone sits in it |
| the **clone** | ⛔ naught at all | that it moved this tick — an **idle** clone is `at work` |
| the **work** | ⛔ naught at all | that any of it advanced — a clone can wait on its own tool |

so the honest reading is narrow:

> **`at work` says a DUCT is live. it says naught about whether a clone moved, and naught about
> whether the work advanced.**

every layer above that is the reader's inference (`term=false-report`, the reader-inference family,
cause = **proxy**).

## .at work is NOT

- **`reachable`** — a grove can be up, ssh-answerable, and hold only a bare shell. the duct layer
  cannot part *"the box is down"* from *"the box is up and idle"* (`term=grove`)
- **in motion** — an **idle** clone holds a live duct with an empty input box. it is `at work` and
  it awaits a word. that is the state `rule.require.nudge-parked-clones` governs, and it is the
  most common `at work` there is
- **`in progress`** — a clone that waits on its own long tool call is `at work`, has not moved, and
  IS advancing. `🌊 changed` cannot part that from a frozen pane (`term=false-report`)
- **`down`** — its exact negative, and the pair is asymmetric: `at work` needs proof, `down` is the
  default (`term=down`)

## .the source that supports it, and why it under-reports

`at work` is a claim about **NOW**, so live tmux is the correct source — and the only one:

| source | can it support `at work`? |
|---|---|
| **live tmux** | ✅ yes — and it is the only source that proves a crew is at work |
| the crew ledger | ⛔ no — it records that a crew EXISTED, never that it is up (`term=ledger`) |
| trees on disk | ⛔ no — a tree proves a crew could be booted |

this is the mirror of `term=down`'s constraint. `down` is past tense and needs a source with a
memory; `at work` is present tense and needs a source with no memory at all. **a source that
outlives its subject cannot report the present**, which is exactly why a stopped crew vanishes from
tmux by design rather than by defect.

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `git.crew.poll.sh` — `:65` the verdict, `:413` the lift from the `down` default, `:442` the
  `--live` filter that keeps only these rows
- `git.crew.list.sh` — enumerates which crews are at work
- `duct.poll.sh` — reads the layer beneath, and cannot see the clone

## .reason

see `term=at-work._.choice.reason.md` — etymology, the rejected `up` / `active`, and the four
scattered boundaries this cluster consolidates.

---

written by human + beaver 🦫
