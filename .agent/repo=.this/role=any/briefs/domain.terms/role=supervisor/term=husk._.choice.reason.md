# domain.term.choice.reason: husk

## .etymology

a **husk** is the dry outer shell left once the grain is gone. it keeps the seed's exact shape
and holds naught — you can pick it up, it weighs nil, and no amount of care recovers what was
inside.

that is precisely the artifact: a dir with a tree's name, a tree's path, and a tree's contents,
which git will not answer a single question about. the shape survived; the thing did not.

it also sits inside the garden metaphor the rest of this vocabulary already speaks — a tree is
**sprouted** and **felled** (`term=sprout`, `term=fell`), a task is **seeded** (`term=seed`).
a husk is what a fell leaves behind when it does not finish. no other candidate word carried
both the shape-without-substance sense and the garden register.

## .the discovery — two misreads, one after the other, 2026-08-25

the term was not reached for. it was forced by two consecutive cases that looked identical from
outside and needed opposite acts.

### case 1 — an ORPHANED TREE read as a clean fell

`rhachet-brains-fireworksai.beav.fix-deepseek-v4-flash-model-id`, pr #15, merged.

`git tree del` computes its worktree path from the BRANCH NAME:

```
worktree_path="$worktrees_dir/$repo_name.$sanitized"
```

this tree's HEAD had moved to `refs/heads/beav/fix-please-release-injection-3`, so the computed
path did not exist. the alias took its "no worktree found" arm — deleted the branch, left the
worktree entirely alone, **exit 0**:

```
🍂 beav/fix-please-release-injection-3
   └─ branch deleted (local + remote)
```

the caller matched success on `/status: removed|branch deleted/`, so that arm read as a clean
fell. it reported `tree removed ✅`, stopped both ducts, closed both tabs — over a tree still on
disk, still registered, still populated.

the result is an **orphaned tree**: git still owns it, and `worktree remove` still works on it.
this is a `false report` whose cause is `partial audit`, wrong-instance mechanism — the gate's
verdict was about a subject that was not this tree.

### case 2 — a HUSK read as live work

`rhachet-roles-ghlitch.beav.fix-provision-declastruct-auth`, pr #73, merged.

a `worktree remove --force` dropped the admin entry, then died on a permission wall part way
through the delete (a read-only pnpm store). the dir survived — no `.git`, no index, a few dirs.

my own pre-check then ran `git status --porcelain` and read its nonzero rc as *"holds live
work"*, and refused:

```
└─ ✋ tree holds live work — gate not run, branch untouched
   fatal: not a git repository
```

the message and its evidence contradict each other on one screen. `fatal: not a git repository`
carries no work to lose and no branch to gate — it is the opposite state from the one the
verdict named.

### what the pair proves

the two cases are **byte-identical from the outside**: a populated dir under `_worktrees/`,
after a fell that claimed to work. and they need opposite acts —

- case 1 → `worktree remove` (git owns it)
- case 2 → `rm -rf` (git does not)

apply the wrong one to either and it finds naught and reports success. so the distinction is not
a nicety of vocabulary; it is the difference between a cleared dir and a silent no-op, and
**neither case can be told from the other without a classify step.**

## .the rule the pair yields

> **a nonzero rc is a CLASS, not a verdict.**

`git status` fails for two opposite reasons, and the rc is the same integer for both. to grade
before you classify is to let one number stand for two states — and the grade will name whichever
state you happened to have in mind.

so the arm reads:

```
if   [[ -z "$treedir" ]]                  # absent   → naught to do
elif ! (cd … && git rev-parse …)          # husk     → rm -rf, guarded
else                                      # a tree   → now it is safe to grade dirty
```

only the third arm may ask *"is it dirty?"*, because only in the third arm is the question
meaningful.

this generalizes past git. any probe that fails for more than one reason owes a classify step
before its output is graded, and the tell is a check whose failure branch names a cause the
check cannot actually distinguish.

## .disputes

### dispute: orphan — raised 2026-08-25 — status: RESOLVED (keep `husk`)
- raised.by = beaver
- claim     = `orphan` is the plain word, already in use for `orphan processes` and for git's
              own `orphaned worktree`
- counter   = that reuse IS the objection. git's `orphaned worktree` names case 1 — a worktree
              git STILL OWNS whose branch is gone. our artifact is case 2, which git does not own
              at all. one word for both collapses exactly the distinction the term exists to
              draw, and the collapse is what produced both misreads above. `orphan` also names a
              relation (its parent is gone) rather than a state (it is a shell), so it says
              naught about what remains
- resolution = keep `husk`; record `orphan` and `orphaned worktree` as forbidden synonyms. use
              **orphaned tree** for case 1, which is git's own sense, kept intact

### dispute: phantom — raised 2026-08-25 — status: RESOLVED (keep `husk`)
- raised.by = beaver
- claim     = we already have `phantom` for a fell that left residue; reuse it
- counter   = a phantom is a **row with no session** (`term=duct`) — a record whose substance is
              gone. a husk is the exact inverse: substance whose record is gone. they are cleared
              by opposite acts, so one word for both guarantees the wrong cure is reached for
              half the time
- resolution = keep both, and state the inversion explicitly in the say file. it is the single
              most useful sentence about either term

### dispute: stale worktree — raised 2026-08-25 — status: RESOLVED (keep `husk`)
- raised.by = beaver
- claim     = descriptive and needs no gloss
- counter   = it is not a worktree. that is the entire content of the term. a name that asserts
              the category it exists to deny will send every reader to `worktree remove`, which
              is the no-op this term exists to prevent. `stale` also implies it was once fresh
              and merely aged — a husk is made in an instant, by a failure, not by time
- resolution = keep `husk`; `stale worktree` forbidden

### dispute: litter / leftover / debris — raised 2026-08-25 — status: RESOLVED (keep `husk`)
- raised.by = beaver
- claim     = they name the operator's actual relationship to it — it should go
- counter   = each names the **judgment**, not the **state**. an operator needs to know what it
              IS before they know what to do with it, and all three skip that step. the say file
              may freely call a husk litter once it has been identified as one — that is a
              consequence of the term, never a substitute for it
- resolution = keep `husk` as the term; `litter` remains fine as prose about a husk

### dispute: ghost / zombie — raised 2026-08-25 — status: RESOLVED (keep `husk`)
- raised.by = beaver
- claim     = both carry the right eerie register
- counter   = `ghost` is taken — it is the autocomplete-suggestion sense in
              `rule.require.distinguish-prefilled-from-suggested`, where the whole point is that
              a ghost is text that is NOT in the buffer. `zombie` implies something still runs
              and still consumes; a husk is wholly inert, which is what makes `rm -rf` safe
- resolution = keep `husk`; both forbidden

### dispute: orphan, a THIRD sense — raised 2026-08-31 — status: RESOLVED (keep both, compound only)
- raised.by = beaver
- claim     = `git.crew.poll` renders `⚠️ WORK ORPHANED` on the fleet's loudest row, and has
              for a long while. that is a THIRD sense of the word this cluster forbids — it is
              neither a husk (substance with no record) nor git's `orphaned tree` (a worktree
              whose branch is gone). it is a **crew**-axis state: a dirty tree with no crew to
              drive it. the tree in it is healthy and fully registered; the CREW is what is absent
- counter   = the 2026-08-25 entry above already settled the mechanism, and it settles this case
              too — the word survives **in a compound whose sense is local** (`orphaned tree`)
              and stays forbidden **bare**. `WORK ORPHANED` is such a compound, and it glosses
              itself inline: *"a dead crew on a dirty tree."* so no rename is owed
- resolution = keep `WORK ORPHANED` as the third sanctioned compound, beside `orphaned tree`.
              bare `orphan` remains forbidden in every contract

⚠️ **recorded because the compound was correct by ACCIDENT, not by decision.** nobody had checked
that render against this cluster's forbid — it surfaced 2026-08-31 in a routine term tend, months
after it shipped. a later round that reached for a bare `orphan` in a new contract would have
found no precedent to stop it, because the precedent existed only as an unexamined habit.

> **a forbid enforced by luck is indistinguishable from a forbid enforced by care — until the one
> round where luck runs out.** the tell is cheap: a word on a forbidden list, live in a contract,
> that no dispute entry mentions.

#### ✅ the forbid earned its keep — 2026-09-07, its first live catch

the entry above predicted this moment. it arrived, and it is worth the record: a prediction that
comes true unrecorded reads later as though no one was ever at risk.

a human asked to revive four dirty local trees. the sweep had rendered `⚠️ 11 WORK ORPHANED` on
every tick of the session, and `rule.always.sprout-on-a-grove-never-local` rests its central
argument on that row — *"11 of them, and every single one is local."* a published word, in the
evidence a rule leans on, which a `globsafe` over `domain.terms/` showed had **no cluster of its
own**. every cue said *pave `orphan`*.

⇒ **it is paved — here, one cluster over, under `husk`.** one `grepsafe` for `orphan` across
`.agent/` surfaced this file: the bare word forbidden since 2026-08-25, `WORK ORPHANED` sanctioned
2026-08-31, its absent subject corrected 2026-09-03, and a three-row axis table that already parts
every sense. a fifth `term=orphan` cluster would have been a **braid**, and it would have re-opened
the exact git-sense collapse the 2026-08-25 entry closed.

⚠️ **the search cost one call; the cluster would have cost a contradiction.** and it was the
RECORD that did the work, never memory and never care — the author who reached for the word had
read neither this file nor `term=phantom`'s one-line rejection of `orphan`. the grep put both in
front of them.

⇒ so the tell quoted above has a mirror worth its own line: **a forbid holds only where a reader
can FIND it from the word alone.** this one was findable because the disputes live in the cluster
of the word that WON, filed under the word that lost. that is precisely why a resolved dispute
records the loser verbatim, never merely the winner.

### dispute: what WORK ORPHANED names as absent — raised 2026-09-03 — status: RESOLVED (the CLONE)
- raised.by = beaver
- claim     = the entry above names **the crew** as what is absent, and quotes the compound's own
              inline gloss, *"a dead crew on a dirty tree."* both are too narrow. a duct OUTLIVES
              its clone: claude exits, or was never launched, and the shell it sat in stays up.
              such a crew has live ducts, live registry rows, and a `😶 at work` verdict — and yet
              no worker at the keyboard, with uncommitted work on the tree
- counter   = none, and the reason is worth the record: the gate's code read
              `crew_state == "down"`, so the narrow gloss described the implementation FAITHFULLY.
              the gloss was not wrong about the code; the code was wrong about the domain
- resolution = the absence is the **CLONE**. the gloss now reads *"a crew with no clone, on a
              dirty tree."* `WORK ORPHANED` stays the sanctioned compound — only its sense widens,
              so no rename is owed and the 2026-08-25 forbid on bare `orphan` is untouched

⚠️ **measured, never argued.** 2026-09-03: `rhachet.beav.fix-keyrack-daemon-orphan` and
`rhachet.beav.fix-test-tempdir-leak` — both `mechanic:shell`, both still 331m, both on dirty
trees, and NEITHER counted. the tally read `⚠️ 9 WORK ORPHANED`; the true figure was 11. two
crews' worth of uncommitted work had been invisible for five and a half hours.

the gate now keys on the clone (`crew_cloneless`) rather than on the duct, and is clamped in
`work.surface [t0] the orphan gate`. **`clone` is not coined here** — it is the extant word from
`define.work-primitive-hierarchy`: *"one worker · a role: mechanic, foreman."* only the MECHANIC's
box can testify, because a foreman is a bare shell by design.

⇒ this is why the axis row below reads **clone** rather than crew.

the three senses, so a reader can part them without a re-read:

| the compound | the axis | what is absent |
|---|---|---|
| **husk** | tree | git's admin record — the dir is not a worktree at all |
| **orphaned tree** (git's own) | tree | the branch — git still owns the worktree |
| **WORK ORPHANED** | **crew** | the **clone** — the tree is healthy, dirty, and undriven. the crew itself may be live (see the 2026-09-03 entry) |

each names a different absence, and each takes a different cure: `rm -rf`, `worktree remove`,
`rhx git.crew.boot`. that is the same three-way split `husk` ↔ `phantom` already turns on, one
axis over — and it is why the bare word cannot be allowed to stand for any of them.

## .evidence

- **two field instances, one hour apart**, each misread once before the term existed — recorded
  above with their exact stdout
- **the discriminator table** in the say file was derived by dimensional decomposition over two
  orthogonal axes: *does git own it?* × *does it hold a branch?*. the four cells are the four
  named artifacts, and the fourth (a record with no dir) lands on `phantom`, which already
  existed — a decomposition that recovers an extant term in one of its cells is evidence the axes
  are the domain's own
- **the arm shipped**, with the word in operator-visible stdout three times, so `husk` is a
  contract surface and bound by `rule.forbid.domain-term-synonyms`
- **clamped** at `work.surface.remote.integration.test.ts` `[case7]`, proven red under the un-fixed
  skill and green under the fix (`rule.require.clamp-edge-cases`)

## .the open thread — the husk FACTORY is upstream, and unrepaired

case 1's root cause is in `git_alias_tree` (`~/.bash_aliases:1720`, owned by `dev-env-setup`):
it derives the worktree path from the branch name rather than a lookup, so any tree whose
checkout has moved takes the "no worktree" arm.

`git.tree.del` now works around it — it derives the dir from the filesystem and self-removes.
the alias still deletes branches out from under live worktrees and still exits 0, and it is the
likely source of the ratio `git.crew.poll` cites: **142 trees on disk against 14 that ever had a
crew.**

that fix belongs upstream, in a peer repo, so it is **recorded here and not seeded** — the
decision is the human's (`rule.forbid.prescribe-how-on-dispatch` would govern the seed's shape).

## .see also

- `term=duct._.choice._.md` — the **phantom**, this term's exact inverse
- `term=fell._.choice._.md` — the verb whose half-finished form makes husks
- `term=false-report._.choice._.md` — case 1's shape, and the proxy/wrong-instance causes
- `term=partial-audit._.choice._.md` — the wrong-instance mechanism, in full
- `rule.require.clamp-edge-cases` (mechanic) — why the arm ships with a clamp that bites

---

written by human + beaver 🦫
