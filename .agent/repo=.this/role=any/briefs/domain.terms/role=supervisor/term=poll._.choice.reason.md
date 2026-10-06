# domain.term.choice.reason: poll

## .etymology

`poll` was already this repo's word before this file. `duct.poll` has run every 15 minutes for
weeks, and `rule.require.babysit-cron-per-dispatch-fleet` is written around it — the sweep's whole
contract is *"run `rhx duct.poll`, then act per the verdicts."*

so this cluster records a term in live, load-bearing use. it was not coined at a keyboard to fill a
gap.

the word itself carries the two properties the operation most needs, with no gloss:

- **you poll a POPULATION, never a subject.** nobody polls one person. the word demands N, which
  is exactly what parts it from `read`
- **you poll AGAIN.** an election poll, a hardware poll, a health-check poll — every use in the
  wild is repeated, and the interest is in the delta. that is the temporal property, free

## .the round that paved it

round 94, and the occasion was a second `*.poll` skill. `git.release.poll` was written that hour
to close a capacity gap: `git.crew.list` answers who is at work, `duct.poll` answers who MOVED,
`git.tree.supervise` answers the git-LOCAL state — and **not one of them reads the remote**, so
none could say whether a pr existed, whether ci passed, or whether a branch had landed.

one `*.poll` skill is an implementation. two that share a shape are a **kind**, and a kind earns a
word (`rule.require.domain-term-itemization`).

## .the dispute — RESOLVED, against `get`

### the objection, at full strength

`rule.require.get-set-gen-verbs` declares a closed verb set and grades a violation a **blocker**:

> operation without sanctioned prefix (get/set/gen/del or as*/is*) = **BLOCKER**

a poll modifies naught, so by the decision tree it is a read, so it should be `getAllDuctVerdicts`
and `getAllTreeReleaseStatuses`. two skills in this repo would then be misnamed, and the rule is
one of the org's oldest.

### the resolution, and the two properties it turns on

`poll` holds. the objection reads the get-set-gen rule as a rule about **side effects**, and it is
a rule about **contracts**. a poll's contract differs from a `getAll*`'s in two ways, and each one
alone is enough:

| property | a `getAll*` | a poll |
|---|---|---|
| **the subject set** | handed in by the caller — a filter, a scope, a list | **DERIVED live**, and the derivation is a guarantee |
| **the temporal frame** | stateless; the same input yields the same output | compares against the **prior poll**; the verdict is a delta |

the first is not a stylistic difference. `rule.require.babysit-cron-per-dispatch-fleet` grades a
hardcoded fleet a **blocker**:

> a babysit cron that hardcodes the fleet instead of a live derivation = **blocker** (goes stale,
> babysits dead trees, misses new ones)

so *"the caller does not choose the subjects"* is a **contract term** rather than an
implementation detail — and a `getAll*` whose caller may not choose its scope is a `getAll*` with
its defining argument removed.

the second is worse for `get`. `duct.poll`'s central verdict is `🌊 changed` / `🧊 unchanged
(Nm)`, which is a claim about **two instants**. no stateless read can express it. a
`getAllDuctVerdicts` that silently keeps a hash file between calls is a `get` with hidden state,
which is the reverse of what the get contract promises.

### what the resolution does NOT license

it opens no general escape hatch. `poll` is sanctioned for an operation that holds **all five**
properties in the say file. an operation that takes its scope from its caller is a `getAll*`, and
to call it a poll would be the drift `rule.forbid.domain-term-synonyms` forbids.

recorded here rather than settled by fiat, because the get-set-gen rule belongs to
`repo=ehmpathy/role=mechanic` and this repo does not annex it. what this cluster claims is
narrower: **a poll is a distinct contract, not a `get` with a different coat** — and if that repo
judges otherwise, this dispute is where the argument sits.

## .why the forbidden synonyms distort

| ⛔ synonym | why it distorts |
|---|---|
| `status` | a noun where a verb is owed, and it names the OUTPUT rather than the act. `duct.status` reads as *"give me the status object"*, which invites a caller to expect a value where a judgment is rendered |
| `check` | binary and singular. you check a box, a fact, a condition — it carries no N, and no verdict richer than yes/no. eleven verdicts do not fit inside it |
| `scan` | implies a sweep for a MATCH — you scan for a defect, an intruder, a pattern. a poll renders a verdict on every subject, hit or no hit, and the boring rows are half its value |
| `survey` | close, and it fails on repetition. a survey is a one-off study; a poll is asked again, and the delta against the prior ask is a verdict of its own |
| `monitor` | continuous and passive. a monitor watches on your behalf and alerts you; a poll is an act you perform at an instant. the two sit at opposite ends of who holds the initiative |
| `watch` | the sharpest, and the one already taken. `rhx git.release --watch` and `gh run watch` BLOCK until an outcome settles. a poll returns NOW with whatever is true. both words are live in this repo with the opposite sense, so the overload would be immediate |

## .the evidence

### two skills, one shape, no coordination

`duct.poll` was written weeks earlier. `git.release.poll` was written in round 94 against a
different subject (trees, not ducts), a different source (github, not tmux), and a different
verdict set (eleven, not five). neither was written with the other's code open.

they converged on all five properties anyway:

| property | `duct.poll` | `git.release.poll` |
|---|---|---|
| derived subject set | from `duct.list`, live | from tmux sessions, live |
| independent | parallel reads | parallel reads |
| a verdict per subject | `🌊` `🧊` `🚧` `📬` `💥` | `🪵` `✅` `🟡` `🔴` `⚓` `🚧` `📝` `🚫` `✋` `🏗️` `🫧` `💥` |
| bounded per subject | `--timeout 15` | `--timeout 20` |
| temporal | hash vs prior poll | *(a delta is available and not yet used)* |

the last row is honest: `git.release.poll` renders each verdict fresh and keeps no prior state. so
the temporal property is a property of the KIND rather than of every instance — a poll may
compare against its prior self, and `duct.poll` does. the say file states it as *"the verdict MAY
compare"* for that reason.

### the first run found 53

the crewed fleet read 21 trees. `--all` read 74, and **53 of them were merged** — work that had
landed, whose worktrees sat on disk with no one aware. a hand survey of 74 trees at one
`gh pr list` each is a survey nobody runs, so it had never been run.

that is the argument for the operation stated as a quantity: **a read nobody performs by hand is a
read that does not exist.**

## .a poll is READ-ONLY, and the guarantee decides the design

the say file states the read-only property as a **guarantee**, never a tendency. that phrasing was
chosen deliberately, and it comes from a defect:

`duct.poll`'s sweep resized every detached pane on each tick. a resize rewraps a pane, so its
bytes change, so its content hash changes — and the poll then reported `🌊 changed` for clones
that had done naught. worse, the sweep's own instrument duct is a fleet member, so a `duct.send`
to it fabricated a fleet change **every single tick**, which made
`rule.require.pause-babysit-cron-after-idle-streak` structurally unreachable: the streak could
never reach six, so the cron could never pause.

the general form, now carried by that rule:

> **a sweep that acts through a fleet member will read its own act as fleet motion.**

so read-only is not merely safe. it is what keeps a poll's verdict about its **subjects** rather
than about the poller. `git.release.poll` was written under that constraint from the first line:
it reads `gh` and never sends a key into a duct, precisely because a `duct.send` into eleven
foremen would have contaminated the next babysit tick eleven times over.

## .the false report this cluster caught, in a skill an hour old

the term's own discipline found a defect the code review had not. `git.release.poll`'s summary
printed:

```
🦫 dam fine! 1 to fell
```

while the row directly above it read:

```
🪵 merged — pr #462 landed — fell it ✋ dirty
```

`git.tree.del`'s safety gate refuses a tree with uncommitted work. so the count promised a fell
that the fell itself would refuse.

run the discriminators (`term=false-report._.choice._.md`):

| | |
|---|---|
| d1 — did the tool fail? | **no.** exit 0, ordinary format |
| d2 — is the content untrue? | **yes.** *"there is 1 tree to fell"* — there is not |
| subject — an instrument that emits a measurement? | **yes** |

a false report, in a skill written that hour, by the party that had withdrawn a false-report row
from that very table earlier the same session.

**fixed and proven to bite:** merged-and-dirty is now tallied apart, and the crewed fleet went
from a false `1 to fell` to a true `0 to fell` plus an explicit `✋ 1 merged but DIRTY`.

### what that says about the practice

the defect was found by the act that paves the word, never by a review of the code. that is worth
the record, because it names what a term cluster is FOR beyond vocabulary hygiene:

> **to pave a term is the first occasion on which an operation's contract is read closely rather
> than written quickly.**

it caught a second one in the same pass: the say file's first draft named a verdict with an `-ing`
suffix the gerund rule forbids, and that same word was live in the skill's jq rollup AND in its
printed output. renamed to `awaited` in all three places.

## .the restraint bar

93 rounds preceded this one, and most paved zero. the bar: a term must be **compelled** by
evidence, never manufactured to satisfy an hourly hook. tested:

- **a new kind?** yes — five properties, and each parts it from `get`, `list`, `read`, or `watch`.
  the two closest neighbors (`get`, `watch`) each earn a stated boundary
- **evidenced?** two skills, independently written, that converged on the same shape
- **a victim?** 53 merged trees nobody knew of, plus a rule made structurally unreachable by a
  poll that touched its own subjects
- **ours?** yes — both skills are declared at `.agent/repo=.this/role=any/skills/`
- **would it be re-derived?** it already was: the second skill reached for `.poll` with no prompt
  and no read of the first

it cleared every line. the rounds that declined on jurisdiction alone are what make this
acceptance credible.

## .disputes

### dispute: `git.release.poll`'s NOUN — raised 2026-08-24 — status: RESOLVED (`git.grove.poll`)

- raised.by  = human ("why is that called git.release.poll? isnt that a git.crew.poll?")
- claim      = the skill polls crews, so its noun should be `crew`, as `git.crew.list` is.
- counter    = **it never touches a crew.** it reads github — pr, ci, mergeability — and is
               read-only by construction. that is precisely why it still worked on a day every
               crew on the machine was dead, when `duct.poll` returned 💥 on all 28 rows and
               `git.crew.list` returned "no crews". a crew poll is `duct.poll`; this is not it.
- resolution = **`git.grove.poll`**, settled by the human the same round, after two rejected
               candidates. `release` is a DIMENSION, never a subject. `crew` is a neighbour the
               skill does not touch. `tree` names the verdict grain but leaves the scope unsaid.
               **`grove` names what you ADDRESS** — a machine — and its trees are what comes
               back. `git.release.poll` is recorded as a forbidden synonym.

### three candidates, and what each one fixed

the round proposed three nouns in sequence. the order is the argument:

| candidate | the noun denotes | verdict |
|---|---|---|
| `crew` | a neighbour layer | ⛔ refuted — the skill reads github, touches no duct |
| `tree` | the verdict GRAIN | ⚠️ right grain, and it leaves the scope axis unstated |
| **`grove`** | **what you ADDRESS** | ✅ names the subject set AND the axis it derives on |

`git.repo.get files --in <repo>` is the precedent: its noun is the thing addressed, and its
verdict grain is finer than that noun. so a grove polled, with a verdict per tree, is the shape
this family already speaks.

### the human's reason, verbatim, and why it is the strongest argument

> *"more future friendly … rn i only cared about this local grove's trees that were inflight"*

that names a bound the skill has and never states: **it reads local worktrees only.** the fleet
that day held a remote grove — `duct://grove-ahbode-v20260811/main/mechanic` — and its trees were
invisible to this skill entirely, with no flag to reach them and no note that they were absent.

`grove` in the noun slot makes that reach a parameter rather than a silent ceiling:

```
git.grove.poll                                  # this grove's trees
git.grove.poll --grove cloud://grove-ahbode-…   # that grove's trees
```

so the rename does not merely correct a word. it converts an unstated bound into a stated one —
which is what `term=partial-audit._.choice._.md` asks of any tool whose default population is
narrower than the question put to it.

### why it READ as a crew poll — the scope, not the word

the instinct had a real referent besides the noun, and it sits in the skill's own header:

```
rhx git.release.poll         # every tree that has a crew     ← the DEFAULT
rhx git.release.poll --all   # every worktree, crew or not
fleet derived LIVE from tmux sessions on every run
```

a **tree-grain** read takes its default subject set from **tmux sessions**, which are crews. that
is the mis-fit: a tree's release state bears no relation to whether a crew is booted on it.

**it cost a read on the one day the read mattered most.** with every session dead, the bare
command's subject set was empty, and the enumeration came back only after `--all` was passed by
hand. a default scope that empties itself exactly when the fleet is in trouble is a default aimed
at the wrong axis. `grove` is the axis that does not empty — a machine's trees are on its disk
whether or not a single session survives.

this is `partial audit` mechanism 2 — a tool's default population, chosen by no auditor, invisible
in the verdict. **cited, not coined.**

### what the dispute adds to the TERM

the say file's five properties bound what a poll IS. neither they nor the `get` dispute say
what a poll's default SCOPE may be bound to, and this round shows that gap has teeth:

> **a poll derives its own subject set — so the axis it derives ON is part of its contract, and
> that axis must belong to the subject.** a subject set derived from a NEIGHBOUR layer (trees
> scoped by crews) yields a poll that goes blind whenever that neighbour does.

`duct.poll` obeys this by construction (ducts, derived from ducts). `git.release.poll` does not,
and it took a machine death to make the difference legible.

### the refuted proposal held a sound observation

the human named the wrong noun twice before the right one, and was correct from the first word
that the noun was wrong. a refuted proposal is not a refuted observation — so answer the SMELL
rather than the SUGGESTION. had the `crew` claim been run against the mechanism alone, the honest
reply *"no, it reads github"* would have closed a dispute whose premise was sound.

## ⚠️ the 2026-08-24 resolution names a skill that is not on disk — corrected 2026-08-25

the dispute above closes with **`git.grove.poll`**, *"settled by the human the same round"*, and
records `crew` as ⛔ refuted with `git.release.poll` a forbidden synonym.

read live on 2026-08-25, the skills dir holds three polls and `grove` is not among them:

```
duct.poll.sh          ✓
git.crew.poll.sh      ✓   ← what shipped
git.release.poll.sh   ✓   ← superseded, still on disk
git.grove.poll.sh     ✗   ← absent
```

so the record is inverted twice over: the name it declares as settled is absent, and the name
that DID ship is the one it marks refuted.

⚠️ **"absent" is all i can claim.** whether `grove` was never built, or was built and later
renamed to `crew`, is a question of PROVENANCE, and a dir read records only what is there now
(`term=partial-audit`, the fourth mechanism). a `git log --diff-filter=A` over the skills dir
would settle it; i did not run one, so i do not say which.

### why `crew` is no longer refutable

the refutation's premise was mechanical — *"the skill reads github, touches no duct"* — and it
was TRUE of `git.release.poll`. it is false of `git.crew.poll`, whose runtime derives from
`crew ledger ∪ duct registry ∪ live tmux` (`git.crew.poll.sh:203`, `:233`). the successor
genuinely reads crews, so `crew` is its subject rather than a neighbour it never touches.

that is not a reversal of the human's judgment. it is a different skill, and the fact that
refuted the noun does not hold of it.

### the shape this is, and why the glossary is the worst place for it

a dispute resolution is a **declaration**, and a declaration reads as a state
(`term=false-report`). the line *"settled by the human the same round"* renders identically
whether the settled name shipped or not — so a reader takes it as the canonical word, and a
contract that used `crew` would read as drift when it is in fact what is true.

this file exists to stop precisely that, and it carried the inversion regardless.

### status

| | |
|---|---|
| `git.grove.poll` | **withdrawn** as the recorded resolution — absent from disk |
| `crew` | **un-refuted** for `git.crew.poll` — its refutation was about a different mechanism |
| `git.release.poll` | still a forbidden synonym, and now also a superseded skill |
| whether `grove` should displace `crew` | **OPEN** — and it is now a rename of a shipped skill, not a fresh choice |

## .see also

- `term=poll._.choice._.md` — the choice itself
- `term=false-report._.choice._.md` — the defect this cluster caught in its own skill
- `term=partial-audit._.choice._.md` — the fourth mechanism, cited in the skill's own comment as
  the reason to read the remote rather than derive from a slug
- `rule.require.get-set-gen-verbs` (mechanic) — the rule this term disputes a boundary with
- `rule.require.babysit-cron-per-dispatch-fleet` — the sweep that made `duct.poll` load-bearing
- `rule.require.safe-by-default` (ergonomist) — why read-only is a guarantee

---

written by human + beaver 🦫
