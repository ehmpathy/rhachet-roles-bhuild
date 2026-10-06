# domain.term.choice.reason: escalate

## .etymology — the word was already ours, in four rules, unnamed

`escalate` was never coined here. it arrived with the bhrain driver vocabulary and was in use
across at least eight briefs before this cluster existed:

- *"escalation to a human is the **last resort** — never the first, never mid-ladder"*
  (`rule.always.converge-to-terminal`)
- *"you still halt for genuine walls"* (`rule.always.converge-with-reviewers`)
- *"you do **not** blindly escalate"* (`rule.always.diagnose-reviewer-malfunctions`)
- *"unsure is a decision, and the decision is escalate"* (`howto.review-permission-requests`)

so this cluster is not a proposal. it is an **itemization** of a word the vocabulary already
leaned on hard, per `rule.require.domain-term-itemization` — which grades a leaned-on word with
no cluster a **blocker**.

that also settles its status against `term=replication`'s gate. the gate refuses a distinction
that is INVENTED and no more than one party has drawn; it explicitly exempts one already
RECORDED. this one is recorded in four files, by two roles, and its boundary against `steer` and
`nudge` was drawn before this file existed. the gate has no question left to ask.

## .why `escalate` and not its synonyms

| ⛔ synonym | why it distorts |
|---|---|
| `punt` | imputes evasion. every genuine escalation is the CORRECT move, and a word that reads as a dodge will never be applied by the party who must apply it — which is the only place it matters |
| `defer` | names delay, not transfer. an escalation moves WHO decides; it says naught about when |
| `hand off` | two words, and it implies the work moves too. an escalation moves one DECISION and leaves the work where it is |
| `kick up` · `bubble up` | direction words. they name a topology (up a hierarchy) rather than the act, and the fleet has no hierarchy to go up — there is one human and one supervisor |
| `raise` | badly overloaded — you raise an error, a modal, a budget, a version. one word, four concepts |
| `flag` | TAKEN, twice: a cli flag, and `rule.always.defer-fulcrums-to-last`'s *flag it and drive on*, which is the exact OPPOSITE act (you flag a fulcrum **so that you need not escalate it**) |
| `block` | TAKEN. `--as blocked` is the driver's route signal with its own budget and contemplation loop; and a `blocker` is a review severity. a third sense overloads the word that carries the most load in the review vocabulary |

## .the `surface` boundary — a distinction, never a synonym

`surface` was the strongest synonym candidate, and the correct outcome is that it is **not one**.
the two words are used consistently, by different rules, for different acts:

| | what it is | its cadence |
|---|---|---|
| **escalate** | the VERDICT — *this decision is the human's* | once, when you reach it |
| **surface** | the DELIVERY — *put it in front of them* | **once per state change** |

the cadence clause is the proof they are distinct. `rule.require.nudge-parked-clones` grades
*"a human-only gate surfaced on every tick rather than once per state change"* a **nitpick** —
a rule that would be incoherent if the two were one word, because it would then read as *"do not
re-decide the verdict every tick"*, which nobody was tempted to do.

so `surface` stays in circulation and stays out of the forbidden list. what this cluster adds is
the record that they were checked and judged distinct, so the next traveler does not re-litigate
it.

## .the evidence — five facts, each earned by a defect

every fact in the say file was paid for. the accounts live in `term=partial-audit`, which is
where the mechanism belongs; this is the index.

| # | the fact | where the account lives | what it cost |
|---|---|---|---|
| 1 | **two kinds** — authority-only vs evidence-gap | `partial audit`, twenty-second instance | an escalation raised while `git.repo.get --tree` sat on my own allowlist. withdrawn before the human acted |
| 2 | **the relayed kind** | `partial audit`, r140 | a `gh secret set` relayed for DAYS with no read of my own between the mechanic's claim and my assertion of it |
| 3 | **the premise has depth** — presence is not validity | `partial audit`, r141 | i discharged fact 2's escalation as false. it was not: 401 on every shard, the key rotated ~2026-08-15. both my reads were right and my conclusion was wrong |
| 4 | **the self-authored kind** | `partial audit`, r141 | **1848 minutes** — thirty hours — of a mechanic parked on a modal i had graded `escalate` correctly, off a rule whose premise was false |
| 5 | **the `surface` cadence** | `rule.require.nudge-parked-clones`, enforcement | a nitpick grade, extant before this cluster |

### the pair at the centre, and its symmetry is not chance

facts 3 and 4 landed in one session and they run **opposite ways**:

| | what i did | what it was |
|---|---|---|
| fact 3 | **discharged** an escalation | it was genuine — i stopped one read short |
| fact 4 | **kept** an escalation | it was false — i never read the artifact at all |

one skill, two directions, both from a premise read too shallow. that symmetry is why the say
file leads with the authority/premise split rather than with the kinds: the kinds tell you what
an escalation claims, and the split tells you which half of it you are qualified to check.

## .disputes

### dispute: `surface`  —  raised 2026-09-01  —  status: RESOLVED (both, distinct)

- raised.by  = beaver, while it authored this cluster
- claim      = `surface` names the same act and is in wider use; two words for one concept is
               the exact synonym sprawl `rule.forbid.domain-term-synonyms` forbids
- counter    = they are not one concept. `escalate` is the verdict and `surface` the delivery,
               and the two carry **different cadences** — you escalate once, you surface once per
               state change. `rule.require.nudge-parked-clones`'s nitpick grade is only coherent
               under the split
- resolution = keep BOTH; neither is forbidden. record the boundary in the say file so the
               distinction is checkable rather than tribal. dispute closed.

### the migration question — why the evidence was CITED, not moved

`progress.md` r141 proposed that the r140 and r141 sections **migrate** into this cluster, with
`partial audit` left to hold a pointer. that is not what happened, and the reason is worth the
record.

those sections are not merely ABOUT escalation. each is an instance of `partial audit`'s own
mechanism — a subject set narrower than the claim rendered over it — with an escalation as its
subject. to cut them out would strip that term of four of its sharpest cases and leave it to
cite outward for its own evidence.

so the split is by **what a file is FOR**:

| the file | what it holds |
|---|---|
| `term=partial-audit` | the MECHANISM, and every instance of it — escalations among them |
| `term=escalate` | the VOCABULARY — the halves, the kinds, the authors, the boundaries |

a reader who wants *"why did this escalation go wrong"* wants the mechanism. a reader who wants
*"is this an escalation or a steer"* wants the vocabulary. two questions, two homes, one pointer
between them.

⚠️ the cost of that choice, stated plainly: the say file's `.refs` now leans on one neighbour for
all five of its evidence rows. if `partial audit` is ever split or renamed, this cluster goes
citation-blind. that is a real dependency and it is accepted deliberately — the alternative was a
duplication that would drift.

## .see also

- `term=steer._.choice._.md` — the nearest neighbour on the act axis; a steer names a path the
  clone can walk, an escalation names one it cannot
- `term=nudge._.choice._.md` — the other neighbour; a nudge moves MOTION, an escalation moves a
  DECISION
- `term=partial-audit._.choice._.md` — where all five evidence accounts live
- `rule.forbid.self-grant-human-gates.md` — the human-only set this term defers to, and the
  workaround class that defeats it without a forbidden command
- `rule.require.domain-term-itemization` (learner) — the rule that made this cluster owed

---

written by human + beaver 🦫
