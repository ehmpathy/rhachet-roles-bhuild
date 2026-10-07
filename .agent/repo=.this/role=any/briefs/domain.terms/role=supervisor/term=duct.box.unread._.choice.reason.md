# domain.term.choice.reason: unread

## .etymology

`unread` is the plainest available negation of the act that produced every other verdict in the
set. each peer is the answer to *"what did the read find?"*; this one is the answer to
*"was there a read at all?"*

it was chosen over its neighbours because it names the **act**, never a cause and never a state:

| ⛔ candidate | why it distorts |
|---|---|
| `unknown` | the word it was split FROM. it asserts the pane was held and judged — the opposite claim (see below) |
| `empty` | already taken, and by the exact confusion this word exists to end: `empty` is a claim about the BOX, `unread` about the CAPTURE. one pane can be both |
| `none` | already taken by "no claude box at all" — a positive claim about a pane we saw |
| `silent` | reads as a property of the clone. a busy clone is silent and its pane reads fine |
| `blank` | describes the pane. we do not know the pane is blank; we know our copy of it is |
| `unreachable` / `unreached` | ⚠️ forbidden as synonyms of `term=asleep`, and rightly — they name HOST reachability. this word must not inherit that sense. see the open dispute |

## .the overload it was split from — measured 2026-09-03

`unknown` came to name two opposite things, and the second sense was added by the same author
who later found it, in the same session:

| branch | what we saw | the cure |
|---|---|---|
| an empty capture | not one byte | re-read the duct |
| the ladder's tail — an `❯` with no sgr code | the pane, in full | read the text on the row |

### the tell was not the ambiguity — it was that BOTH glosses were inverted

an overloaded word is a nitpick when its two senses merely blur. this one was a blocker,
because each render site described the branch it did **not** cover:

| the site | what it said | true of |
|---|---|---|
| the duct row | `box UNKNOWN (pane unread …)` | the empty-capture branch |
| the fleet tally | `❔unknown × N — box not empty …` | the ladder's-tail branch |

so a reader who met the row was told the pane went unread over a pane read in full; a reader who
met the tally was told the box was not empty over a capture that was empty. **each verdict was
refuted by its own neighbour's prose**, and the two together spanned the whole reader population.

⇒ this is what `term=asleep` states as a principle, met in the wild:

> **a verdict that needs a footnote to be read correctly is the WRONG VERDICT.**

here it was worse than a footnote — the footnote was false.

## .the measured cost, and the measured payoff

**the cost.** a supervisor on a babysit tick met `foreman:❔unknown` and could not tell whether to
re-read the duct or read text the sweep already held. it took **four calls** — a drill-in, a duct
list, a re-poll, a raw read — to answer a question one verdict should have answered. that is the
byhand path `rule.require.bulk-over-byhand` forbids, entered not by choice but because the sweep's
own word admitted two readings.

**the payoff, on the first sweep after the split:**

```
❔unread × 3      ❔unknown × 0
```

three grove roles lose their raw capture; **no role has ever hit the other branch.** the word that
concealed this concealed a 3-vs-0 split, not a close call. and the count then ran **3 → 0 → 3**
across three ticks with no change to the read path — which settles the follow-on defect as a race
rather than a broken remote path, and is recorded at
`.dream/2026_09_03.duct-poll-raw-read-empty-on-grove.dream.md`.

⇒ the general form, worth more than this instance: **a verdict that admits two readings does not
merely confuse — it suppresses a measurement.** nobody counts what one word conflates.

## .the evidence

### 1. the split is clamped, and the clamps were proven

`work/work.surface.classify.integration.test.ts`, `[case] … [t3]`, four assertions: the ladder's tail keeps
`unknown` and holds its text; all three could-not-read paths render `unread`; the crew poll
carries the join arm; the tally names the state rather than the pane.

⚠️ **the join clamp is the load-bearing one, and it was proven red.** with the
`*'box UNREAD'*` arm reverted, the suite failed exactly one test; restored, 198 green. that arm is
not decoration: the crew poll parses duct.poll's **rendered text**, so a verdict its case names
not falls to `continue`, and the block is flushed `❔unknown` at the next header. **absent the
arm, the split renders correctly and is then erased at the one layer the babysit tick reads.**

⇒ that is this repo's own recorded hazard, met again: *a join that reads its neighbour's render
is a join its neighbour breaks.* a word coined at one layer owes the join at the next, in the
same change.

### 2. the glossary had already rejected `unknown` for this sense

`term=asleep._.choice._.md` lists `unknown` among its forbidden synonyms — the crew-boundary
verdict for *"we could not look"* refused that word before this round existed.

so the split **conforms** rather than innovates: it moved `unknown` OFF the could-not-look sense,
which is the direction the glossary already pointed. the sense it vacated was then owed a word,
and `asleep` had already shown which kind of word that is.

## .disputes

### dispute: unread vs asleep's forbidden `unreached` — raised 2026-09-03 — status: OPEN

- raised.by  = beaver 🦫 (self-raised at the moment of the coinage)
- claim      = `term=asleep` forbids `unreached` and `unreachable` as synonyms of itself. `unread`
               is one letter and one sense away from `unreached`, so a hurried reader may take it
               to mean *"the host was not reachable"* — which is `asleep`'s job, at a different
               boundary. two words that near each other invite exactly the drift the glossary
               exists to stop
- counter    = they part cleanly on a fact the reader can check. `unreached` is about whether we
               got to the HOST; `unread` is about whether we got CONTENT. the case that paved this
               word is the proof they differ: the plain read **reached** the duct and succeeded,
               and the raw read of that same duct returned empty. reached, and not read. no single
               word for host-reachability could have named that state
- open.because = the counter defends the DISTINCTION and does not settle the WORD. a reader who
               never meets that case has no cue to part them, and this is a one-instance argument
               — `rule.require.enumerate-before-you-name` is unsatisfied until a second reached-
               but-unread case is on record. it may also be that `box` deserves the qualifier in
               speech as well as in the filename (*"the box is unread"*), which would end the
               collision at no cost to either word

## ⚠️ .a gap this round did NOT close

**`box` is itself un-itemized.** it is the boundary of this term and of seven peers (`empty`,
`prompt`, `prefilled`, `queued`, `suggested`, `none`/`shell`, `unknown`), and only one of those
peers — `ask`, a `prompt` kind — carries a cluster.

so this file names a boundary the glossary does not declare. that is recorded rather than
repaired: to pave `box` and its seven peers is a round of its own, and to pave it hastily beside
a term coined the same hour would be the guess `rule.require.domain-discovery-for-term-proposals`
forbids.

⇒ what this round owed was the term it **settled**. `box` was engaged, never settled.

## 🔴 .the state table OUTRANKED a published instruction — measured 2026-09-07

this file's table gives two adjacent states **opposite prescriptions**:

```
✍️ prefilled   read fine, text typed and unsent      -> relay it
📬 queued      read fine, text typed AND submitted   -> leave it; the clone drains it
```

the babysit cron prompt — text that renders to a supervisor **every 15 minutes** — said:

> *"submit queued typed msgs (`--keys Enter`, after a `--raw` ghost check)"*

⇒ correct for `prefilled`, and **the exact inversion for `queued`**. an Enter into a submitted
box lands in the empty box beneath the queued row, which `term=duct.box.inflight`'s invariant
section already carries as a recorded harm.

⚠️ **this is not a dispute, and the distinction matters.** a dispute needs two peers with equal
standing; here the glossary is authoritative **by construction** and the prompt is downstream of
it. so the repair is a straight edit to the prompt, with no `.disputes` entry owed. ⇒ a peer
disagreement is litigated; a **derived** artifact that contradicts its source is simply wrong.

### 🔴 what makes it worse than the flag defect beside it

the same prompt carried a second error the same day — it named `--fellable` with no skill, next
to `rhx git.grove.saturation`, so a supervisor bound the flag to the wrong verb by proximity
(it is `rhx git.crew.poll --fellable`). **both are defects in one instruction. only one of them
is dangerous:**

| the defect | the wrong act |
|---|---|
| `--fellable` on the wrong skill | 🟢 `exit 2`, `unknown flag` — **fails loud, self-corrects in one call** |
| Enter into a `queued` box | 🔴 **succeeds silently.** a stray submit, no error, and the tally reads the same after |

⇒ so **an instruction defect is graded by whether the wrong act fails loud**, never by how wrong
the instruction reads. the one that read *more* plausible is the one that had no backstop.

### ⚠️ the near miss — two defects that CANCELLED

the harm was averted by an unrelated defect. the poll emitted `📬queued × 2` and **named no
tree**, so the supervisor came to this file to learn what `queued` meant before it sought the
subjects. had the tally named them, two Enters would have gone out on the standing order.

🔴 **the subject-suppression defect that `term=partial-audit` grades a harm prevented one here**,
and that deserves a plain statement rather than a joke: a tally with no subject forces a read.
⇒ it is **not** an argument to keep the suppression — it is evidence that *"read the subject,
never the count"* protects against more than a wrong number. it also protects against an act
taken on the count at all.

⇒ the prompt now reads *"read the box state; never the tally."*

## .see also

- `term=asleep._.choice._.md` — the same claim at the crew boundary; the pattern this adopts, and
  the file that had already forbidden `unknown` for it
- `term=false-report._.choice._.md` — d1/d2; the old `none` fallthrough cleared both
- `term=partial-audit._.choice._.md` — an instrument owes its reader the subject set it could not
  reach, which is what the `❔unread × 3` tally now discharges
- `rule.forbid.domain-term-ambiguity` — one word, one sense; the rule this split serves
- `rule.require.boundary-qualified-terms` — why the filename carries `duct.box`

---

written by human + beaver 🦫
