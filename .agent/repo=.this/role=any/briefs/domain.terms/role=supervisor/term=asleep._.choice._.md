# domain.term: asleep

term.chosen   = asleep
term.kind     = adj
term.boundary = crew
term.synonyms.forbidden:
- unreachable
- unreached
- hibernated
- offline
- timeout
- unknown
- unavailable

## .what

a crew **whose grove did not answer this sweep** — so no claim about the crew itself is
available, in either direction.

```
😶 at work    one or more live ducts               -> the roles are named
😴 asleep     the GROVE did not answer             -> rhx git.grove.wake <grove>
💀 down       no duct, tree on disk                -> rhx git.crew.boot
👻 phantom    no duct, no tree                     -> a felled tree's stale rows
```

## .it is the only verdict in the set that is a claim about the READ

that is the whole reason it exists, and it is what parts it from its three peers:

| verdict | what it asserts | about |
|---|---|---|
| `at work` | a duct answered | **the world** |
| `down` | the crew died, its tree stands | **the world** |
| `phantom` | the tree is gone, the record remains | **the world** |
| **`asleep`** | **we could not look** | **the instrument** |

a grove that is hibernated returns the identical empty session list as a grove that holds no
crews at all — so only the **failure of the list call** parts them (`term=partial-audit`: an
instrument owes its reader the subject set it could not reach).

### ✅ this row now has a PEER one boundary down — `term=duct.box.unread`, 2026-09-03

the box-verdict set had the same hole this row filled, and filled it the same way: every peer
verdict asserted a fact about the pane, and a pane whose capture came back empty had no word of
its own — so it fell to `❔unknown`, which asserts the pane was **held and judged**.

| boundary | the word | the subject that went unseen | the cure |
|---|---|---|---|
| `crew` | **`asleep`** | a grove that did not answer | `rhx git.grove.wake <grove>` |
| `duct.box` | `unread` | a pane whose capture was empty | re-read the duct |

⇒ two facts about this file earn the pointer:

1. **its forbidden-synonym list was already right.** `unknown` sits at line 12 here, refused for
   the could-not-look sense at the crew boundary — well ahead of the box boundary, where
   `unknown` had quietly taken that very sense. the split conformed to a judgment this file
   already held
2. **its principle is what named the defect.** *"a verdict that needs a footnote to be read
   correctly is the WRONG VERDICT"* — at the box boundary the footnote existed AND was false: the
   duct row said *"pane unread"* over a pane read in full, and the fleet tally said *"box not
   empty"* over a capture that was empty

⚠️ they are **peers, never a hierarchy**. a crew may read `asleep` while its boxes read `unread`
for a wholly unrelated reason, so neither implies the other and neither may be derived from the
other. one OPEN dispute rides on the pair — whether `unread` sits too near this file's forbidden
`unreached` — and it is recorded in the peer's `.reason`, not here.

## ⚠️ .a FOOTNOTE is not a fix — this is what the row replaced

before `asleep` existed, a crew on a hibernated grove rendered **`💀 down`**, and a header caveat
told the reader not to believe it:

```
⚠️  UNREACHED: <groves>
    └─ crews there render 👻 phantom and MAY be at work
```

that caveat was the right repair while the ROW was wrong, and it is the wrong repair now:

> **a verdict that needs a footnote to be read correctly is the WRONG VERDICT.**

a reader who meets the row without the header is handed `down` — whose paved cure is a
`crew.boot` that **would fail on a box that is not up**. so the cure moved onto the row itself,
and the header line now names a **count** rather than corrects a claim.

## .the cure is on a DIFFERENT MACHINE

it is the only row in the crew-axis set with that property, and it is why it renders **above**
the litter row rather than beneath it:

```
😴 N asleep     — unread, not down — rhx git.grove.wake <grove>
👻 N phantom    — felled trees whose registry rows remain
```

a reader who meets it beneath the litter row prices it as litter. it is not litter — it is work
that may be live, on a box nobody asked.

## .asleep is NOT

- **`down`** — the boundary that costs the most. `down` asserts a crew **died** and its tree
  **stands**; neither fact is available from a box that did not answer, and its cure fails there
  (`term=down`)
- **`phantom`** — asserts the subject is **gone**. `term=phantom`'s own `.what` names this exact
  trap: *"reach for `phantom` only where a second source says the subject is gone"*. `asleep` is
  the word that fills the gap that section opened
- **`at work`** — the one verdict that must be **PROVEN**. an unanswered grove proves naught, so
  it can never lift a crew here (`term=at-work`)
- **a `malfunction`** — that is a claim about an instrument that could not **run**. the poll ran
  clean; one host of many declined to answer, and the sweep is otherwise whole

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `git.crew.poll.sh` — `__crew_host_unreached`, the `HOSTS_UNREACHED` collection, the crew-state
  arm, the headline count, the action row, and the legend
- `work/work.surface.poll.integration.test.ts` — `[case26] [t1]/[t2]` clamp the arm, its cure, its
  order against `phantom`, and its legend; `[case20] [t1]` clamps the header caveat

## .reason

see `term=asleep._.choice.reason.md` — etymology, the rejected `unreachable` / `down`, and the
**OPEN dispute** over whether the word leans on a cause it cannot know.

---

written by human + beaver 🦫
