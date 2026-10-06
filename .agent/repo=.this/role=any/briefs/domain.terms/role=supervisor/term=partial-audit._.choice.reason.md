# domain.term.choice.reason: partial audit

## .etymology

`audit` is already the repo's word for a read that renders a verdict over a population —
`term.audit` joins live ducts against the kitty registry, and camp-grove's redteam rounds each run
a novelty audit over their results. the word was in live use before this file, in both a skill name
and a mechanic's prose.

`partial` names the defect precisely and needs no gloss: the audit covered part, and said whole.

the compound was not coined at a keyboard to fill a gap. it is the plainest description of a defect
two parties hit independently, two days apart.

## .the discovery — a mechanic's report, then my own log

on 2026-08-09 camp-grove reported a self-caught defect, unprompted, in the middle of a security
round:

> *"the novelty audit had been run over the blocker list ONLY — so a novel class sat in the nitpick
> bucket for a full round. **severity and novelty are independent judgments; run the audit over
> every result.**"*

what made that a term rather than a note was the next move: **i checked whether i had done the
same, and i had.**

round 48 of this very journal audited the r47 countermeasure against exactly one case — a poll
verdict i was already mid-judgment on — and declared:

> *"the rule was one round old and it worked on its first use."*

round 50 then found it broken on a different surface (a wish i was authoring), and had to correct
the record. the r48 claim had stood as settled for two rounds. the subject set was "the case in
front of me"; the claim was "the fix holds."

two instances, two parties, one shape. the second is this repo's own, which is what makes the term
ours to pave rather than cite.

## .why it belongs to nheuron

`rule.require.domain-term-itemization` scopes itemization to terms that compose objects and
operations **this repo declares**. a `review` is one of ours — the supervisor loop is built on peer
reviews, self reviews, verdicts, budgets, and the `.given`/`.taken` contemplation pair, and the
`.readme` of every route names them.

an audit over review results is therefore an operation on a domain object this repo declares. that
is a different footing from r52's candidate (the enumeration-vs-derivation axis), where every
instance lived in declastruct-aws's iam and the word would have governed their mechanism. that one
was declined on jurisdiction; this one clears it.

## .the boundary against `false report`, and why it is a NEIGHBOR rather than a case

the discriminators were run before this term was paved, per the r50 discipline:

| | |
|---|---|
| d1 — did the tool fail? | **no.** the audit ran and returned a verdict |
| d2 — is the content untrue? | **yes.** "no novel classes remain" was false |

it clears **both**, which is rare — every prior near miss failed at least one. r49 recorded exactly
this hazard and left it open:

> *"a candidate that PASSES both and still does not belong, because the term's subject must ALSO be
> a report an instrument emits — and that bound lives only in the say file's first paragraph, never
> in the two-question test a reader actually runs. that is a real gap... if a second candidate
> clears both discriminators and still fails on subject, the test needs a third question."*

**this is that second candidate.** and the resolution it argues for is not the one r49 anticipated.

a third discriminator would ask *"is the subject an instrument?"* — which parts the two terms but
leaves the second case unnamed. to pave the neighbor does both: it parts them AND gives the second
case a word. the discriminator stays two questions; the boundary is drawn by the terms sitting
beside each other.

| | false report | partial audit |
|---|---|---|
| the subject | an INSTRUMENT emits a measurement | an AUDITOR renders a judgment |
| what is wrong | the answer is untrue | the answer's SCOPE is narrower than its claim |
| the countermeasure | a second, independent instrument | ask what chose the subjects |
| the cheap check | re-run with one input varied | state the subject set, then the claim |

so `noted — 1` from r49 is **cleared**, not by a widened test, but by a term that makes the test
unnecessary in that direction.

## .why not the rejected words

- **`sample`** — the fatal difference is INTENT. a sample is chosen deliberately and carries a
  stated inference from part to whole; a statistician who samples knows exactly what they did not
  read. a partial audit's auditor believes it read the whole. to call this a sample credits it
  with a rigor it lacks
- **`spot check`** — advertises its own narrowness, which is the opposite of the defect. a spot
  check that finds naught claims naught
- **`incomplete audit`** — true of every audit in some direction, so it bounds no case at all. the
  term needs to name the SPECIFIC failure: a selection criterion orthogonal to the measured property
- **`partial review`** — `review` is taken by bhrain's route object, with its own verdicts,
  budgets, and contemplation loop. the overload `rule.require.ubiqlang` forbids
- **`shallow audit`** — a different axis entirely. depth is how closely each subject was read;
  this is about which subjects were read at all

## .the third instance — when the TOOL chose the subjects, not the auditor

one round after this term was paved, camp-grove produced a third instance, and it does not fit
the countermeasure as written.

it scanned for every policy document the repo declares, with `git ls-files provision`. that
command bounds to **tracked** files. the scan missed `resources.scp.dangerous.ts` — untracked,
and, as it turned out, the very file that sat over the SCP size limit at 5,331 bytes. camp-grove
caught it mid-scan and named the shape against its own work:

> *"`resources.scp.dangerous.ts` is untracked, so `git ls-files` cannot see it — my scan had row
> 25's own defect."*

the first two instances have a chooser. camp-grove chose severity; i chose the case in front of
me. ask *"what chose its subjects?"* and a party answers. **here no party did.** the filter is an
argument-free default inside the instrument, and the verdict carries no trace of it.

so the term needs a second question, for the case where the first one finds no one to ask:

> **what does this command silently exclude?**

every enumeration tool has a default population, and almost none of them name it in their output.
`git ls-files` omits the untracked. a glob omits the dotfile. a `--scope` omits the unscoped. the
auditor who reaches for one of these inherits a subject set it never chose and cannot see.

this sub-case is also the more dangerous of the two, for a reason the first two do not carry: an
untracked file is exactly the file most likely to be work in flight, and therefore the one most
worth the read. **the tool's default filter correlates with the risk it hides.**

## .a second neighbor — `assertion-wider-than-its-claim`

the same day, camp-grove graded a separate defect as `[KNOWN-CLASS:
assertion-wider-than-its-claim]` — a class in their own catalog, near enough to this term to earn
a boundary rather than a nod.

their case: a gate that would have enforced an IAM policy size limit against a number nobody
verified. their words, on why they declined to build it:

> *"a gate asserted against an unverified limit is `assertion-wider-than-its-claim` pointed at
> itself. it owes a verified quota first."*

the two share a shape — a reach wider than what was actually checked — and they part on the ACT:

| | partial audit | assertion-wider-than-its-claim |
|---|---|---|
| the act | a READ that renders a verdict | an ENFORCEMENT that gates |
| what runs too wide | the claim about what was read | the assertion the gate imposes |
| the cost | a question is retired, so nobody re-asks | a gate permits or blocks on unverified ground |
| the cure | read the rest, or narrow the claim | verify the limit, or do not gate |

a partial audit **retires** a question. an over-wide assertion **acts on** one. the first is a read
defect, the second a write defect, and their cures do not transfer.

so it is a neighbor, and **no dispute is owed** — the word stays theirs. their catalog governs iam
gates in declastruct-aws; this term governs judgments here. the convergence is corroboration rather
than collision: two repos, two parties, both found the shape worth a word inside of three days.

## .the fifth instance — a subject set narrowed by WHEN, with no filter anywhere

on 2026-08-09, hours after i paved the r58 countermeasure into this very file, i wrote a clamp
that fell to the term. `[case7] every socket dir this file made` swept `DIRS_MADE` and asserted
`NOT ONE dir survives it`. it reported green while dirs outlived it, two ways:

- **ORDER** — `[case8]` pushes to `DIRS_MADE` AFTER `[case7]` iterated. two `prefixcheck` dirs
  survived every full run, under a green verdict, for as long as the clamp existed
- **SCOPE** — a `--scope case4` run filters `[case7]` out entirely, so its whole subject set went
  unswept and no verdict was rendered at all

what makes it worth the record is that **the first countermeasure question returns naught.** ask
*"what chose its subjects?"* and no party answers — i chose no filter, and no tool imposed one.
ask *"what does this command silently exclude?"* and the answer is the same: no command ran a
selection. `DIRS_MADE` is the complete set by construction.

it was narrowed by **WHEN it was read**. a snapshot of a list still under construction is a
partial audit even where no filter exists at all. that is a third mechanism, orthogonal to the
two already on record:

| how the set got narrow | who chose it | the question that finds it |
|---|---|---|
| a filter the auditor picked | the auditor | what chose its subjects? |
| a tool's default population | no one — the tool | what does this command silently exclude? |
| **the moment of the read** | **no one — the clock** | **could the set still grow after i read it?** |

### the cure is a PLACEMENT, not a better question

the first two mechanisms yield a question to run before you trust a verdict. the third does not:
the audit was honest about its own subject set at the instant it ran, and a careful auditor told
to re-check would find it correct. a re-ask cannot help.

so the cure moved from inquiry to structure — put the guarantee where **neither order nor scope
can step around it** (an `afterAll`), and make it FAIL LOUD rather than report. the clamp stays as
proof the mechanism works; the teardown is the promise. those are two different artifacts and it
was the conflation of them that produced the defect.

### the cost, measured

1,786 orphan dirs in a shared `/tmp`, accrued under a green clamp. the number is worth the record
because this term's earlier instances cost a retired question and a wrong bound on `done` — real
but hard to price. this one has a count, and the count says a partial audit does not merely fail
to catch a defect: **it manufactures the confidence under which the defect compounds.**

### the provenance, stated plainly

this is my own, in code i wrote, in the same session i extended this file. that is not a footnote:
it is the strongest evidence yet that the term is worth its keep. to know a defect's name, to have
just written its countermeasure, and to commit it regardless within the hour — that is a defect
that needs a structural cure rather than an alert reader.

## .the seventh instance — a COMPLETE read, of the wrong kind of subject

on 2026-08-09 i authored a handoff to `examplehuman/dev-env-setup` that led with:

> *"`install_env` writes two tmux configs."*

it writes one. `install_env.pt2.shell.sh:71` is `cp "$src_dir/tmux.conf" ~/.tmux.conf`, and the
sync alias targets the same path. two of the installer's own PAST revisions wrote to the XDG path
and neither cleaned up, so the second file is a **fossil**, not an output.

the same handoff's second claim: *"it is a hand-authored dotfile, left for its owner."* also false
— `git show 3cc42b6:src/tmux.conf | diff ~/.config/tmux/tmux.conf -` returns byte-identical. it is
repo output, frozen at one commit.

### this is the FOURTH mechanism, and the first three questions all pass

| question | answer, on this instance |
|---|---|
| what chose its subjects? | i did — and i chose BOTH files. no filter |
| what does this command silently exclude? | no command ran a selection |
| could the set still grow after i read it? | no — two files, both read in full |

**the subject set had no gap.** it was simply not the set the claim was about. a claim about a
WRITER is answered by its source and its history; a claim about FILES is answered by the files. i
held the second and rendered the first.

so a fourth question is owed, and it is the only one a total read cannot dodge:

> **is the subject i read the same KIND as the subject my claim is about?**

| how the set got narrow | who chose it | the question that finds it |
|---|---|---|
| a filter the auditor picked | the auditor | what chose its subjects? |
| a tool's default population | no one — the tool | what does this command silently exclude? |
| the moment of the read | no one — the clock | could the set still grow after i read it? |
| **the KIND of subject** | **the auditor, invisibly** | **is what i read the same kind as what i claim?** |

### the cost — a partial audit that LEFT the repo

the prior instances cost a retired question, a wrong bound on `done`, and 1,786 orphan dirs. this
one cost a **second party a round**: the handoff was delivered by hand, and `dev-env-setup`'s
learner refuted both claims from `git log -S'.config/tmux'` and wrote the correction into its own
`progress.md` before i checked. its verdict, verbatim:

> *"the second correction collapses the handoff's most dramatic claim. it read the two files as
> 'two opposite deliberate decisions, each with its own reasoned comment block.' they are one file
> at two revisions … no two authors ever disagreed."*

that is the term's new worst case: a partial audit inside one repo retires a question; a partial
audit **exported as a handoff** obliges a stranger to spend a round on the refutation, and would
have shaped their fix had they not checked.

### the adjacent defect the same handoff carried — a citation with no origin

that learner also found this, and it is a different shape worth a note rather than a term:

> *"a handoff cited a canonical term by its cluster name as though it were settled. i grepped for
> it — `term=false-report` is absent from this repo entirely."*

correct. it lives in **nheuron's** glossary, not theirs. a term cluster is repo-scoped by
construction (`rule.require.domain-term-itemization` scopes to terms *this repo* declares), so a
cross-repo citation must name its origin or it reads as a pointer at an absent file.

**not paved.** one instance, and it names no contract this repo declares — `rule.prefer.wet-over-dry`.
the trigger: **a second cross-repo citation defect.** at two, the discipline earns a rule (a
citation that leaves the repo carries its origin), and a rule is the right artifact for it, never a
term.

## .the eighth instance — a reflog read, an ACTOR claimed

on 2026-08-10 i read `rhachet/mechanic`'s reflog from its foreman duct and found:

```
60ae13c HEAD@{0}: reset: moving to origin/main
```

no rebase in progress, `HEAD == origin/main`, `0 0` divergence. from that i concluded the **mechanic**
had hand-rolled a rebase via stash plus hard reset, called it the `rule.forbid.self-grant-human-gates`
workaround class, told it to halt, and instructed it to write a yield entry that admits the breach.

the human answered in six words: **"i did that for them by hand."**

### the reflog was TRUE — so this is not a `false report`

run the discriminators before the term is reached for (the r50 discipline):

| | answer |
|---|---|
| d1 — did the tool fail? | **no.** `git reflog` ran clean |
| d2 — is the content untrue? | **no.** a reset to `origin/main` genuinely occurred |

it fails d2 outright. every word the reflog printed was correct. the false sentence — *"the mechanic
did it"* — was mine, and the reflog never said it, because **a reflog has no author column.**

### the FOURTH mechanism, twice now — and the two share a shape

| instance | what i read | what i claimed about |
|---|---|---|
| the seventh | two config FILES | the PROGRAM that writes them |
| the eighth | a record of ACTS | the PARTY that performed them |

both times the artifact recorded a **state**, and the claim was about its **provenance**. that is not
a coincidence twice over — it makes the fourth question answerable rather than merely askable:

> **an artifact records its own state, never its causation. a claim about provenance — who wrote
> this, who ran this, what produced this — needs a provenance artifact.**

the right artifact was one scroll away in the same pane: shell history. `git status` run by hand, and
`➜ nvim` at `11:06:49`, four minutes before my own command at `11:07:16`. a person at that keyboard,
in plain text, in the instrument i already held.

### why a total read cannot defend against it — the wrong KIND makes you feel DONE

this instance also hit mechanism 1: i read **30 lines** when the answer sat at roughly 35. that alone
is an ordinary narrow subject set, and the ordinary cure applies — read more.

but the two compound in one direction, and it matters:

> **a subject-set gap makes you want more. a subject-KIND error makes you feel complete.**

i did not stop at 30 lines by accident of budget. i stopped because i believed i already held the
artifact that answers the question, so a further read had no purpose i could name. the KIND error
**removed the impulse** that would have cured the depth error. that is the mechanism's whole danger
restated: it is not that a complete read fails to save you, it is that it never occurs to you to
attempt one.

### the cost — a partial audit that left my head as an ACCUSATION

the seventh instance set the prior worst case: a partial audit exported as a handoff obliges a
stranger to spend a round on the refutation. this one is worse by a tier:

| what left my head | what it cost |
|---|---|
| the wrong claim | a retraction |
| an ACCUSATION built on it | a clone told to halt work it was entitled to continue |
| an instruction to CONFESS it | a clone one step from a false admission on permanent record |

had the human not been at that keyboard, `rhachet/mechanic` would have written a yield entry that
admits a breach it never committed — and a yield entry is exactly the artifact a later round trusts.
so the defect would have laundered itself into the record as evidence.

that is the term's new worst case, and it names a rule the prior instances did not need:

> **a partial audit that names a party is not merely wrong — it is an accusation, and it must clear a
> higher bar than a claim about a file.** check that you hold an artifact which records actors
> BEFORE you name one.

### it was caught externally, in six words

the human refuted it in one sentence, with no read at all — they simply knew, since they were the
actor. that is worth the record for the same reason the r70 instance was: **a defect caught by a
party with no stake in the term is evidence the term names something real.** and this one cost the
catcher no effort at all, which is the only cheap row in this file.

## .the general form, stated plainly

**a subject set bounded on one axis silently bounds a claim made on another.**

the earlier form of this sentence said *a filter chosen on one axis*, and the fifth instance
refuted it: there was no filter, and no one chose. the bound came from the clock. so the general
form is about the SET, never about the party who narrowed it — which also makes it the only form
that covers the first three mechanisms above.

**the seventh instance widens it once more.** there the set was not bounded at all — it was
complete, and of the wrong kind. so the sentence's final form drops "bounded" too:

> **a claim is only as good as the match between the subject it names and the subject that was
> actually read.**

a narrow set is one way that match fails. a complete set of the wrong kind is another, and it is
the one that survives every completeness check you can run.

that sentence reaches past audits. the same shape appears wherever a subject set is computed
separately from the claim it serves:

- a test run scoped by `--scope path://x`, reported as "the suite is green"
- a grep bounded by a glob, reported as "the string appears nowhere"
- an IAM deny enumerated by action, claimed as "the outcome is bounded"
- a teardown that reads its worklist before the list is done, claimed as "no litter remains"

the third is camp-grove's row 14, sixteen occurrences deep. that this term's shape and theirs
converge is no coincidence: **enumeration by instance, where a class was meant, is one defect with
many surfaces.** they named it inside iam; this names it inside a judgment.

## .the restraint this was measured against

52 rounds preceded this one, and 51 of them paved zero. the bar has been: a term must be
**compelled** by evidence, never manufactured to satisfy an hourly hook.

this one was tested against it:

- **a new kind?** yes — every `fail*` member presumes a failure; `false report` presumes an
  instrument. this presumes neither
- **evidenced?** two instances, two parties, one of them my own log
- **a victim?** camp-grove lost a full round; r48's claim stood wrong for two
- **ours?** yes — a review is a domain object this repo declares
- **would it be re-derived?** it already was, independently, two days apart

it cleared every line. r52 declined a candidate with a stronger recurrence signal one round earlier,
on jurisdiction alone — and that refusal is what makes this acceptance credible.

## .the ninth instance settles the term's ground — 2026-08-10

the pave note above says *"evidenced? two instances, two parties, one of them my own log."* nine
instances later the composition matters more than the count, and it is now the strongest ground a
term in this glossary stands on:

| instance | whose | mechanism |
|---|---|---|
| 1, 3, 4 | camp-grove | filter, tool default, vendor exclusion |
| 2, 5, 6, 7, 8 | mine | the case before me, order+scope, one of two dirs, subject-KIND ×2 |
| **9** | **camp-grove, unprompted** | **subject-KIND — and it widened the rule** |

**the ninth matters for two reasons.**

first, **camp-grove has never read this file.** it works in `declastruct-aws`; this glossary lives in
nheuron. a party that re-derives a defect shape with no exposure to the word is evidence the word
names a real defect rather than a habit of my own prose. that is the class of support which closed
`substituted-criterion`'s weakest leg at r70, and it arrived here unsought — i read a status line to
learn why a clone went idle, and the instance sat in the pane.

second, **it corrected the rule rather than merely confirmed it.** the seventh and eighth were both
provenance, so they yielded a provenance-shaped rule. the ninth is not provenance and fits anyway,
so the rule had to widen: *a claim about a DIFFERENT subject — even the same file at another ref —
needs that subject's own artifact.* an instance that only confirms teaches naught; one that forces a
generalization is what a term is for.

### what it does NOT do

it does not extend jurisdiction. the mechanism is camp-grove's, in their repo, on their verdict —
this file records it as **evidence**, never as a claim on their vocabulary. they keep their own
catalog (`assertion-wider-than-its-claim` is theirs, and the boundary against it is drawn above).
were they to coin a word for the worktree-vs-published case, that word would be theirs and this
entry would cite it.

r52's refusal on jurisdiction is what makes that distinction worth a sentence rather than an
assumption.

## the ELEVENTH — where the excluded set is ANTI-correlated with the risk

2026-08-11, mine. a human hard-reset onto `origin/main`, which dropped an unmerged commit, then
popped a stash. the 3-way merge took the DROPPED commit as its base, so it emitted conflict markers
in 5 files. i audited those 5, resolved them, and was ready to call the merge fixed.

the marked set was not the damaged set. eight further files were wrong and none carried a marker:
3 briefs silently reverted to the older content, 4 briefs vanished outright, and 1 file the dropped
commit had renamed away came back.

### the mechanism — a filter that is a SIDE EFFECT, not a choice

this is mechanism 2 (a tool's default population), and the tool is git's own merge algorithm. no
party chose the filter. a 3-way merge emits a marker exactly where **both** sides diverge from the
base in one region; where only **one** side did, it resolves silently and reports success.

so *"what does this command silently exclude?"* has a precise, structural answer: **every region only
one side touched.**

### what it adds — the exclusion is ANTI-correlated with the risk

the `git ls-files` instance (the third) notes that *"the tool's default filter correlates with the
risk it hides"* — an untracked file is the one most likely to be work in flight. this instance is the
same observation at full strength, and by construction rather than by tendency:

| the region | marked? | who had eyes on it |
|---|---|---|
| both sides touched it | **yes** | the session had already engaged it — you would have caught this |
| one side touched it | **no** | nobody. the other side's change is the whole of the content |

a marker is emitted precisely where attention had already been paid, and withheld precisely where it
had not. so the audit surfaces the cases you would have found anyway and hides the cases you would
not. that is worse than a random filter, and it is not a tendency — it is what the algorithm is.

### the cure, and why it is the term's standard one

not a sharper question. a **witness the filter cannot reach**: diff the working tree against the
dropped commit, file by file, and grade each difference as either an intended session edit or a
reversion. the marker set has no say in that read.

the same move as the ninth's `git show origin/main:<path>` and the fifth's `afterAll` teardown — go
around the instrument rather than interrogate it.

### no term is coined for the mechanism

a clean-but-wrong 3-way merge from a wrong base is well known in the git world and names no contract
this repo declares (`rule.require.domain-term-itemization`). it is described here and left uncoined,
per the jurisdiction discipline r52 set.

## the TWELFTH — the one case where MORE of the same read makes it worse

2026-08-12, mine, and it is mechanism 1 with a property no prior instance has.

for two months and four separate reproductions i held that `rhx grepsafe --glob 'dir/**/*.md'`
returns a wrong `matches: 0`. each reproduction ran two probes:

```
--glob 'a/path/**/*.sh'   → 0        (the symptom)
--glob 'ductwork.sh'      → matches  (the control)
```

each time, the two results were scored as fresh corroboration. the truth, found on the fifth pass:
**`--glob` is matched against the basename.** every pattern that holds a `/` finds naught; every one
that does not, works — `--path .agent --glob '*.sh'` among them, which searches recursively and was
never tried.

### the filter was chosen by the SYMPTOM

the countermeasure's first question — *what chose its subjects?* — has an answer, and it is not
"me" in any useful sense. i picked the probes, but i picked the two the failure itself presented.
that is mechanism 1, and the sub-case earns its own name: **a probe set inherited from the symptom.**

it satisfies the term's central mark exactly. the selection criterion (*"what did the failure show
me?"*) is **orthogonal** to the measured property (*"is the flag broken, or merely narrow?"*),
because a basename-scoped flag predicts those two results just as precisely as a broken one does.

### what makes it worse than every prior instance

for the eleven before it, the cure was **widen the set** — read the untracked files, read past line
30, read `origin/main` too, run the sweep in an `afterAll`. more of the same kind of read helps.

here, more of the same read is what produced four false corroborations. widen along the axis the
symptom offers — another path-shaped glob, another string, another repo — and every single result
comes back consistent with the wrong hypothesis, because the wrong hypothesis predicts that whole
axis perfectly.

> **a hypothesis that predicts your evidence is not thereby proven — only unrefuted.** and a subject
> set the symptom chose is a set drawn entirely from the axis your hypothesis already explains.

so the cure is not *more*, and it is not *wider*. it is **orthogonal**: vary the input your
hypothesis says does not matter. the four reruns varied the glob's CONTENT, which the broken-tool
hypothesis predicts; none varied its SHAPE, which only the narrow-flag hypothesis cares about.

### the tell, and what actually broke it

there was no tell. the symptom was reproducible on demand, and reproducibility is the property most
easily mistaken for a grasp of the cause — each rerun returns the same bytes, and the same bytes
read as corroboration.

what broke it was an **errand**: a seed owed to another repo, and
`rule.forbid.prescribe-how-on-dispatch` demands verified facts rather than a symptom report. the
duty to write the defect down FOR A STRANGER forced a probe no amount of self-directed rigor had.

**the transferable form: a claim you must hand to someone else gets checked harder than one you
merely hold.** so the cheapest audit of a claim that has stood a long while is to draft it as though
a stranger will act on it — which is also the cheapest way to find that a subject set was never
yours to begin with.

### no term is coined for the general move

*underdetermination* names it in the philosophy of science, and *confirmation bias* names the human
half. both predate this repo by a long way, and neither names a contract this repo declares. cited
rather than coined, per r52's jurisdiction discipline — the same call this file made one section
above.

full account, and the correction it forced to a neighbor term's first evidence row, in
`term=false-report._.choice._.md` → *the grepsafe half is NOT a false report*.

## the THIRTEENTH — an ABSENCE claim, and it is the shape that cannot be enumerated

2026-08-15, and it is **not mine**. `sdk-aws-lambda`'s input-only mechanic wrote this into its own
vision yield, as awkwardness #11 (`1.vision.yield.md:2758-2760`):

> each was caught **only because a human pointed one bound at another** — the peer worktree by
> name, the codec verdict by paste. **there is no mechanism that would have surfaced any of them.**

then caught itself, unprompted, when a handoff arrived from `ehmpathy/domain-objects` with no human
to carry it (`:2544-2546`):

> it is the first message on this seam that arrived **without** a human who carried it — which is
> the mechanism awkwardness #11 said was absent. so the loop closed.

and named a second one in the same breath: `git.repo.get` reads peer work directly. its own verdict
— *"that was wrong twice over now"* — and it named the cause plainly: the mechanism exists, and it
had not reached for it.

### the mechanism — the fourth, and the subject is the auditor's own PATH

| question | answer |
|---|---|
| what chose its subjects? | the auditor — it read HOW each of three collisions came to it |
| what does the command silently exclude? | no command ran a selection |
| could the set still grow? | yes, and it did — but that is not what makes it wrong |
| **is the subject the same KIND as the claim?** | **no.** it read its own ENCOUNTER HISTORY and claimed about the MECHANISM INVENTORY |

### what it adds — an absence has no list to read, so the auditor substitutes its own path

the seventh, eighth, and ninth are each a POSITIVE claim about a different subject: a program, a
party, a published ref. this one is an **absence**, and an absence has a property none of them has:

> **you cannot read a list of what is not there.** so the auditor reaches for the nearest artifact it
> CAN read — what it did not encounter — and that is a fact about its own path, never about the
> territory.

that makes the absence shape the hardest of the four to catch, because the substitution is not a
lapse. it is the only move on offer. an auditor who asks *"does a mechanism exist?"* has no inventory
to consult, so it consults its memory of arrivals — and a memory of arrivals is complete about what
arrived and silent about all that never came.

### the cure was already written, one rule over

`rule.forbid.prescribe-how-on-dispatch` models the sound form and calls it high-value:

> **honest absences** — "i searched for X and could NOT find it; treat as unexplored" is
> high-value. it saves a search AND flags a real unknown.

set the two side by side and the whole defect is one clause:

| the sound form | the defective one |
|---|---|
| *"i searched for X and could not find it"* | *"there is no X"* |
| carries its search, so a reader can widen it | carries naught, so a reader inherits the bound |

> **an absence claim must carry the search that produced it.** *"no mechanism surfaced these"* is
> true and useful as *"no mechanism surfaced these TO ME"*; it becomes a partial audit the moment it
> drops the last two words.

### why it is strong evidence

the ninth's entry notes that camp-grove had never read this file, and calls that the class of support
which closed `substituted-criterion`'s weakest leg. this one has the same provenance and one property
beyond it: **the party caught it itself, on its own record, with no reviewer who found it.**

so one artifact holds the instance, its refutation, and its author's own diagnosis. that is the
cheapest kind of evidence to trust and the rarest to come by.

## the FOURTEENTH — mechanism 1, with a structural bias

2026-08-13, mine, and it is recorded here to reconcile a count: the learner journal at r107 called
its own case *"the 14th"* while this table held 13 rows, so the two disagreed by one.

`rule.require.nudge-parked-clones` grades a pane change on a conjunction of THREE axes — body,
elapsed, and width. i read two, named the cause, and never measured the third.

| the question | the answer |
|---|---|
| what chose its subjects? | **i did** — the two axes legible in the pane in front of me |
| why that filter? | body and elapsed are a READ; width is a **comparison against a read i did not keep** |

so the axis that costs effort to measure is the axis a supervisor silently drops, every time, by
default. that makes it mechanism 1 with a **structural** bias rather than a careless one — and the
rule now carries a fourth row for the state a reader will most often occupy: *an axis you did not
measure is not an axis that agreed.*

### the relation it yields, recorded rather than paved

the subject set there IS the criterion's own inputs, so:

> **when a criterion is stated as a CONJUNCTION over N measurements, a partial audit of the
> measurements IS a substituted criterion in the verdict** — one event, seen from the input side
> and the output side.

**one instance.** per the restraint bar this earns a note of its own at two; this is where the
second will find the first. full account in the learner journal at r107.

## the FIFTEENTH — a claim that was TRUE, and unfounded

2026-08-14, mine, and it is the first row here where the claim was **correct**.

a fleet-wide commit freeze lifted. i read the meter — in **nheuron**, the repo i stand in — saw
`global: not blocked`, and primed three mechanics in three OTHER repos. to one of them i wrote:

> *"your local quota is unlimited with push + stage allowed."*

that was true of ghlitch. i held no artifact for ghlitch's meter.

### the mechanism — the fourth, and the subject is a PEER repo

`git.commit.uses` carries three independent scopes — global, org, and **local** — and the local
state lives at `.meter/git.commit.uses.jsonc`, a **relative** path. so it is per-repo by
construction, and a lift at one scope grants naught at another.

| the question | the answer |
|---|---|
| what chose its subjects? | the repo my cwd sat in |
| what does the command silently exclude? | every OTHER repo's meter — and there were eleven |
| **is the subject i read the same instance as the subject i claim?** | **no** |

the ninth instance's wide form covers it exactly: *an artifact records the state of the subject it
IS.* nheuron's meter is a true artifact about nheuron.

### why a TRUE claim is the sharper instance

every prior row here was refuted. this one was not, and that is what earns it the entry:

| | a wrong partial audit | **a right one** |
|---|---|---|
| what follows | it is refuted, and the record corrects | naught follows |
| what a reader sees | a correction, dated | a claim that reads exactly like a founded one |
| how long it survives | one round | **forever** |

so the outcome supplies no signal at all — the shape `term=crew._.choice.reason.md` records one
term over, where a verdict was right for ~90 rounds on a reason that was wrong the whole time.

**and the fleet proved the gap was real.** two peer repos read `no quota set` in the same minutes
nheuron read `unlimited`. had i sent that same sentence to either, it would have been false — and
from where i stood i could not tell the three apart.

### the CURE this round adds — hedge the claim into a hypothesis

every cure on record here answers *"how do i get the right evidence?"* — read `origin/main`, read
the writer's source, run the sweep in an `afterAll`. not one of them reaches a subject in a repo
you are not in, because the artifact sits outside every read your cwd can bound.

what i reached for, in the same sentence:

> *"re-check it yourself; the meter is authoritative as you said."*

> **a claim shipped with an instruction to re-verify is a hypothesis, not a verdict.** the audit is
> still partial; what changes is that its subject-set gap becomes the RECIPIENT's to close — and
> the recipient stands where the artifact is.

it is the twelfth instance's lesson, inverted:

| | the twelfth | this one |
|---|---|---|
| who checks harder | **you**, because a stranger will act on it | **they**, because you asked them to |
| what it protects | a claim you have held too long | a claim you cannot found from here |

**it worked, and not by luck.** all three mechanics re-read the meter rather than inherit my claim
— the `rule.require.retry-before-you-escalate` move — and two of them found the local gap i would
never have found from nheuron.

### the bound the cure carries

a hedge is not a license. it converts a partial audit into a hypothesis **only where the recipient
can reach the artifact**, and only where they are told which artifact. a hedge with no named
subject (*"double-check this"*) buys naught: it hands over the doubt and withholds the address.

## the SIXTEENTH — an audit built as the CURE for the very defect it then missed

2026-08-15, and it is **not mine**. `rhachet-roles-ghlitch`'s mechanic reported it against its own
work, unprompted, mid-cicd-repair:

> **the audit I'd written to prevent it graded only that one vector, so it stayed green straight
> through.**

eight suites were green on a laptop and red on the runner: ten skills fork on an absent
`AWS_ACCESS_KEY_ID` and the prod gate forks on `CI`, so a runner takes one arm and an SSO laptop
the other. its first fix scrubbed those in the shared harness — and three suites stayed red,
because ten runners never call that harness at all; they spawn bash off a bare
`{ ...process.env }`.

### the mechanism — the FIRST, with a property no prior instance carries

it is mechanism 1 (a filter the auditor picked), and the countermeasure's first question answers
cleanly: *what chose its subjects?* the auditor did — it graded **the vector it had just fixed**.

what is new is WHAT the audit was for:

| | every prior instance | **this one** |
|---|---|---|
| the audit's purpose | to grade some subject | **to prevent a NAMED defect class** |
| its subject set | narrower than the claim | narrower than **the class it was built to guard** |
| what its green meant | a wrong claim | **that the guard held** — while the class recurred |

the fifth instance is the near neighbor and it is not the same: there i wrote a clamp hours after
i paved the countermeasure into this file, so the failure was that *to know the general term did
not protect me*. here the guard was authored for **this exact defect**, by name, and it still
missed — because a defect class has many vectors and the guard graded one.

that is the sharper form, and it inverts what a green verdict buys you:

> **a guard built for a defect class is the one audit whose green a reader most trusts — and its
> subject set is the one nobody re-derives, because the guard's existence stands in for the check.**

### the cure it supplies, and it is a SHAPE rather than a question

the four cures on record are all *read a different artifact*. this one is not — no artifact was
misread. ghlitch's own repair:

- the contract became **a call rather than a remembered delete** — `asEnvHermetic()` carries
  credentials + `CI` + `BASH_ENV` together, as one unit
- `case3` then greps **for the call by name**

so the audit's subject set was no longer *"the sites i remembered"*; it became *"every site that
must invoke the named contract."* the guard no longer enumerates vectors; it enumerates
**callers of the one contract every vector must use**.

> **where an audit guards a CLASS, do not grade its vectors — give the class one named contract and
> grade the calls.** an enumeration of vectors is a subject set that a new vector silently leaves.

that is the r58 lesson (*move the guarantee where neither order nor scope can step around it*)
aimed at a defect class rather than at a teardown, and it is the same move
`rule.require.clamp-edge-cases` asks for when it says clamp the **boundary**, not the value.

### ⚠️ the bound on THIS entry — read from a pane, not from source

every claim above comes from the mechanic's own summary in its duct, read at
`duct:///rhachet-roles-ghlitch_beav_fix-provision-declastruct-auth/mechanic`. i did not read
`asEnvHermetic`, `case3`, or the ten runners at source; that repo is not mine and the read would
have crossed a boundary this supervisor does not govern.

so it is recorded at the confidence obtained: **an account of a defect, by the party that hit it**,
never a verified read of their code. the ninth instance's wide form applies to me here as much as
to anyone — a claim about ghlitch's source needs ghlitch's source.

what makes it worth the entry regardless: the mechanic **caught and named it against its own
work**, and its clamp is bite-proven by revert (*"removed the scrub → red on exactly the arm
divergence; restored → green"*), which is the one part of the account that carries its own proof.

## the EIGHTEENTH — a CONJUNCTION, and the short circuit picks the conjunct

2026-08-15, mine, and it settles a relation r107 left at one instance.

`rule.require.pause-babysit-cron-after-idle-streak` states its counter as a conjunction:

> a no-change tick = **(the sweep took no action)** AND **(no duct but the instrument changed)**

for ~90 ticks I reported `streak = 0` and attributed the reset to conjunct 2 — a foreign duct on
the grove, genuinely in motion. r109's journal records that attribution verbatim:

> *"the streak is structurally pinned at 0 **while the grove moves**, so
> `pause-babysit-cron-after-idle-streak` cannot fire."*

that sentence is true, and it is half. conjunct 1 was ALSO permanently false: the sweep's resize
is a `duct.send`, and the counter's action row listed `send` unqualified. so the streak had **two**
independent reasons it could never advance, and every report I emitted named one.

### the mechanism — a SHORT CIRCUIT, and it is structural

the fourteenth instance is mechanism 1 with a cost bias: *the axis that costs effort to measure is
the axis dropped by default.* this one costs no effort at all — I knew what I had sent. it is
dropped for a different and sharper reason:

> **in a conjunction, ONE false conjunct settles the verdict — so an auditor who finds one is
> logically entitled to stop.** the conjunct it stops at is whichever it happened to check first,
> and that order bears no relation to which conjuncts are false.

so the filter is neither a preference nor a cost. it is **the evaluation order of the criterion
itself**, and it fires hardest on the audits most rigorous about the verdict — because a correct
verdict really does need only one false conjunct.

### what it costs, and why the verdict's correctness hides it

| | a wrong verdict | **this** |
|---|---|---|
| what a reader sees | a correction, dated | `streak = 0`, forever, and TRUE every time |
| what it conceals | naught | that the counter is **structurally** dead, twice over |
| when it surfaces | at once | only when the NAMED conjunct falls — never for the unnamed one |

the surface event is on record: on 2026-08-15 the grove fell still for the first time in ~90 ticks,
conjunct 2 finally held, and conjunct 1 stood alone as the reason. **a defect concealed by a second
defect surfaces only when the second one lifts** — and a short circuit is precisely what keeps the
second one unexamined.

### the rule this yields, and it promotes the fourteenth's relation

the fourteenth recorded that relation at one instance and said a second earns it a note. this is
the second, so the note:

> **an audit of a conjunctive criterion owes a verdict PER CONJUNCT, never one verdict for the
> conjunction.** say which conjuncts held and which failed — every time, even where one failure
> already settles it.

that discipline costs a sentence per tick. the short circuit cost a rule that could not fire, for
~90 ticks, on two counts, with one named.

and it is not merely a report discipline. **a verdict per conjunct is what makes a REPAIR
auditable**: the rule's 🔴 section repaired conjunct 2's row and left conjunct 1's untouched, and
that repair read as complete for four days precisely because no reader had ever been shown the
conjuncts apart.

## the NINETEENTH — the excluded portion sat INSIDE the quoted evidence

2026-08-24, mine. I audited the claude cli's option table to settle whether a human's proposed
`/rename driver` → `--resume driver` could work. the line I read — and transcribed verbatim into my
own notes:

```
-r, --resume [value]   Resume a conversation by session ID, or open interactive picker with optional search term
```

I rendered *"`--resume` takes a session ID"*, so a display name could not address a session, so the
proposal could not work. the human answered: *"thats a fact ive proven."*

the second clause is where their usage lives. **`--resume driver` opens the picker with `driver` as
a search term**, and the display name `/rename` sets is what the picker searches. the proposal was
sound end to end.

### the mechanism — the FIRST, and the subject set was a CLAUSE

mechanism 1, a filter the auditor picked, and the countermeasure's first question answers at once:
*what chose its subjects?* I did — the first clause of a two-clause sentence.

what no prior instance carries: **the excluded portion sat inside the evidence already in hand.**

| | every prior instance | **this one** |
|---|---|---|
| where the excluded subject sat | outside the read — an untracked file, a peer repo, `origin/main`, a dir registered later | **inside the quoted line, one comma along** |
| what a wider read buys | the answer | naught — the read was already complete |

### why it defeats every cure on record

the four mechanisms each yield a cure that WIDENS the read: enumerate the untracked, consult
`origin/main`, run the sweep where scope cannot step around it, hold the right KIND of artifact.
all four presume a subject the auditor never reached.

here the auditor reached it, transcribed it, and quoted it back. **a cure that says "read more" has
no purchase on a defect that fires after a complete read.**

### the cure it supplies

> **a claim drawn from a sentence is bounded by that sentence's terminal punctuation, never by its
> first comma.** a coordinated `or` clause names a SECOND subject, and an audit that halts at the
> first has enumerated one of two.

it reaches past prose to every enumerated contract a reader skims: an option line, an error that
names two causes, a union type, an `||` in a guard. the shape is one artifact that declares N cases
and a reader who prices the first.

#### ⚠️ the cure binds a SENTENCE — and a flag NAME is a sentence with its comma already gone

2026-08-27, mine, three days on. I ran `rhx git.crew.open --tree <tree> --resume mechanic` to
recover a felled crew's conversation. it landed on a session picker filtered to `⌕ mechanic`, no
match — the second clause, verbatim, of the very line quoted above.

so the cure held on the artifact it names and had no purchase here, because **today's subject was
not a sentence.** it was a flag name:

| | the r19 read | this one |
|---|---|---|
| the artifact | a two-clause option line | the token `--resume` |
| where the second case sat | one comma along | **absent — a name has no second clause to skim** |
| what the cure asks | read to the terminal punctuation | there is none to read to |

a flag name is a one-word summary of its own documented sentence, and a summary is a truncation
with the comma taken out. so it re-creates the r19 defect in the one form where the tell is gone:
`--resume` names an OUTCOME, while its declaration names an ACT whose outcome is conditional.

> **a NAME is a claim about a contract, never the contract. where a name reads as an outcome, read
> its own declaration before you price it** — the second clause the name dropped is where the
> caveat lives.

it composes with `false report`'s r40 rule (*ask whether the instrument's NAME over-promised its
scope*) and adds the direction r40 does not cover: r40 fires on a report already in hand; this one
fires **before the call**, on a flag you are about to pass.

**the factory upgrade it seeds:** `git.crew.open --help` documents `--resume` as *"send `claude
--continue` into this role's duct after boot"* — honest about the act, mute on the value's fate. a
role name (`mechanic`, `foreman`) is not a session display name unless a human `/rename`d it, and
no boot path does that. so the flag appears to land on an empty-filtered picker **by
construction**, and its help says so nowhere. *(a hypothesis, per the fifteenth — the check is
whether any session carries a role name as its display name. I observed one case, never the
class.)*

### the cost — a wrong retraction, AND a build nobody needed

worse than an ordinary wrong verdict, because it ran two directions at once:

| what the verdict produced | the cost |
|---|---|
| a retraction of the human's proposal | I told them their own proven usage could not work |
| a substitute design one layer down | a `sessionId` field on the duct row, plus two accessors — to rebuild an address `rhx enroll --as @:<slug>` already ships |

the second is the sharper one. a partial audit that merely reports wrong is corrected on the next
read; one that motivates a BUILD spends a round before the correction can land, and the build's own
plausibility then argues for the verdict that produced it.

## .the twentieth — a CHEAP read is a filter, and the answer was already in context

2026-08-24. as I drafted a dispatch to `rhachet-roles-bhuild`, I needed to know what a role's
anatomy looks like there. I read `dreamer` — 5 files, one call, the smallest role in the repo —
and then wrote into the issue that it has **no briefs dir at all**, so *"a supervisor with briefs
is a shape this repo has not yet had to express"*, and told the recipient to verify the role
builder even supports one.

`behaver` has **40 brief files** and a 38-line `boot.yml` with an explicit say/ref split. the
shape had been expressed all along, by a peer role, one directory over.

the human caught it in four words: *"why does it have anything to do with the dreamer"*.

### the two mechanisms, and both are new

**1. cost is a filter, and it does not feel like one.**

I did not think I had filtered. I thought I had *sampled for convenience* — picked a small role
because a small read is cheap. but the criterion that chose my subject was **file count**, and
file count bears no relation to *does this role carry briefs*. it is the classic orthogonality,
in the one costume that evades the countermeasure question.

ask *"what chose its subjects?"* and the honest answer here is **"whatever was cheapest to
read"** — which sounds like no criterion at all, and is in fact the strongest one I applied.

> **a read chosen for cheapness is a filtered read. the filter is cost, and cost is orthogonal
> to nearly every property worth measurement.**

**2. an EXISTENTIAL claim over a set cannot be answered by a member.**

the claim was *"this repo has not yet had to express it"* — a `∄` over all roles. one role
answers `∄` **for itself** and says naught about the other three. the subject set for a
set-quantified claim IS the set; there is no member that stands for it.

this is the wrong-KIND mechanism (the seventh/eighth/ninth) aimed at **cardinality** rather than
at provenance or instance: the artifact I held answered a question about ONE, and my claim
quantified over MANY.

| my claim | what it quantifies over | what I read |
|---|---|---|
| *"a role's anatomy here is small"* | one exemplar — a `∃` | `dreamer` ✅ sound |
| *"this repo has not had to express briefs"* | every role — a `∄` | `dreamer` ⛔ one of four |

**the same read was sound for the first and unsound for the second.** I ran one read, drew two
claims from it, and checked the quantifier on neither.

### what makes it the sharpest instance on record

**the artifact that answers it was already loaded in my context.** the `SessionStart` boot dump
for this very session lists, at say level:

```
.agent/repo=bhuild/role=behaver/briefs/practices/behavior.verification/philosophy.verification-strictness.md
.agent/repo=bhuild/role=behaver/briefs/practices/behavior.criteria/...
   ...40 of them
```

I did not fail to reach it. **I held it, and went out and fetched a narrower answer instead.**

| | prior instances | **this one** |
|---|---|---|
| the excluded subject sat | outside the read | **inside my own boot context, at say level** |
| what a wider read buys | the answer | it was already bought — and unspent |

the nineteenth established that a cure of *"read more"* has no purchase after a complete read.
this one is worse: **a cure of "read more" has no purchase when the read was already done and its
result went unconsulted.** to fetch is not to know; a loaded context is not a consulted one.

### the cost — a dispatch that sent a stranger the long way round

the issue told its recipient to (a) verify the role builder supports briefs, and (b) look at
**`nheuron`** for prior art. both wrong: the builder demonstrably supports it, and the closest
prior art was a peer role in their own repo. a partial audit that ships inside a dispatch spends
someone else's round, and this one would have sent them across a repo boundary for a pattern one
directory over.

### the cures it supplies

> **1. name the quantifier before you name the subject set.** a claim of the shape *"no X here…"*
> / *"this repo has not…"* / *"none of them…"* quantifies over a SET, and only the set answers it.
> a single member answers only the `∃` form.

> **2. before you fetch, read what you already hold.** a boot context, a prior tool result, a
> file already open — these are reached-and-unconsulted, which reads identically to unreached
> and is cheaper to fix.

> **3. when you need a pattern, check a PEER before you look outward.** the peer role, the peer
> module, the peer repo in the same org — proximity correlates with applicability, and an
> out-of-repo citation should have to earn its distance.

## the TWENTY-FIRST — the eighteenth's mechanism, run BACKWARDS

2026-08-27, mine, and it is the eighteenth instance's exact criterion — the idle-streak counter of
`rule.require.pause-babysit-cron-after-idle-streak` — audited a second time, thirteen days on, and
wrong in the opposite direction.

i reported **`streak: 1`** on one tick and **`streak: 2`** on the next. the true value was **0**
both times. the rule's counter is a conjunction:

| conjunct | line | what i did |
|---|---|---|
| the sweep took no action | :37 | ✅ checked — true, i had sent no keys |
| no duct but the instrument reported `🌊 changed` | :38 | ⛔ **never checked** |

every one of those ticks polled `🌊 changed: 4` or `5`, on foreign ducts. the second conjunct was
false at both readings, so the streak was 0 at both, and my two verdicts were each an increment of
a counter that had never left zero.

### the inversion — and it is why the eighteenth's cure does not cover this

the eighteenth records an auditor who found a conjunct **FALSE** and stopped. that stop is logically
sound; its verdict is correct and merely thin. this one is the mirror:

| | the eighteenth | the twenty-first |
|---|---|---|
| the conjunct i read | **false** | **true** |
| was the stop entitled? | ✅ yes — one false conjunct settles it | ⛔ **no** |
| the verdict | correct, under-evidenced | **wrong** |

> **a FALSE conjunct settles a conjunction; a TRUE one settles naught.**

so the two instances share one criterion and split on the truth value of the conjunct that happened
to be read first — which is the very thing the auditor does not choose. the eighteenth's cure
(*a verdict PER CONJUNCT*) covers both, and this instance is what proves the cure was not decorative:
skip it on a false conjunct and you lose evidence; skip it on a true one and you lose the answer.

### why i stopped there, and the bias is structural

the two conjuncts cost wildly unequal amounts to check:

| conjunct | where the answer lives | cost |
|---|---|---|
| did i take an action? | **my own memory of the tick i just ran** | free |
| did any duct change? | the poll output, which must be re-read and filtered | a read |

so the cheap conjunct is answered by construction and the expensive one is answered on purpose. an
auditor with a partial answer in hand feels informed, and the feeling does not distinguish *one of
two* from *two of two*. **the order of the check was set by cost, and cost bears no relation to
which conjunct is false** — which is question 1 of this file, answered honestly for once and coming
back dirty.

### the aggravation, stated plainly

i wrote the eighteenth's cure. i edited this file twice in the same session — once for the
nineteenth's sentence-bound corollary, once here. and between those two edits i audited one conjunct
of a two-conjunct criterion, twice, and published both results.

that is r58's structural claim a third time: **to author a countermeasure is no protection against
the defect it names.** no part of having written it causes it to fire. so the cure needs a trigger
that costs less than the recall of the rule, and this is it:

> **where a criterion has N conjuncts, a verdict has N lines.** a one-line verdict on a two-conjunct
> rule is unfinished on its face — legible from the shape of the output, before any reader knows
> what the conjuncts say.

the count is the tell. it needs no memory of this file, and it fires whether the conjunct read first
was true or false.

## the TWENTY-SECOND — the claim was about MY OWN REACH, and it was the first one withdrawn

2026-08-28, mine, and the subject is unlike every row above it. the prior twenty-one all render a
claim **about the world**. this one renders a claim **about my own position**:

> *"I cannot verify this from here — it is yours."*

a mechanic stalled on a permission modal to edit `.claude/settings.json` mid-rebase. i escalated it
to the human on three stated reasons, and the load-bearer was evidentiary: **i could see one
conflict hunk, and the mechanic's claim covered the file.** to approve would have been to underwrite
regions outside my view.

that reason is sound. **the escalation was still premature**, because the subject set behind it was
my pane read, and the claim it rendered was about the reachable evidence — two different sets.

| | |
|---|---|
| what i consulted | the pane, via `duct.read` |
| what i claimed | *the evidence is out of reach* |
| what chose the subject set | **what was already on screen** |
| what i never enumerated | `git.repo.get --tree`, on my allowlist the whole time |

one tick later i ran that tool. it returned **one** conflict region, with `=======` and `>>>>>>>`
on adjacent lines — which proves the mechanic's side was EMPTY. a second read against
`origin/main` confirmed the kept block is trunk's own. both reasons dissolved, and the approval
became clean.

### the cure — the inverse of the twentieth

the twentieth says *before you fetch, read what you already hold.* this is its mirror, and it fires
at a different moment:

> **before you escalate for want of evidence, enumerate the reads you have NOT run.** an escalation
> is honest only once the reachable evidence is spent. *"i cannot see it from here"* is a claim
> about your POSITION, and a position is often one tool call away from a change.

the tell is specific and cheap: an escalation whose stated reason is **evidentiary** rather than
**authoritative** is a candidate for discharge. the two kinds do not decay alike:

| the escalation says | can you discharge it yourself? |
|---|---|
| *only you hold this authority* — a grant, a quota, an approval | ⛔ never. it is theirs by construction |
| *i cannot see enough to judge* | ✅ **often** — and the gap may close with a tool you already own |

### it is also this file's first WITHDRAWN instance, and that earns its own line

every prior row is a defect caught after it cost real work — a wrong claim published, a gate held
shut, a stranger's round spent. this one was withdrawn **before the human acted on it**, so its
whole cost was one surfaced line in a report.

that is what a cheap cure looks like when it fires, and it is the only evidence in this file that
the countermeasures pay. r58's structural claim — *to author a countermeasure is no protection
against the defect it names* — holds for the twenty-first, one round earlier. the twenty-second is
the counter-example: a round after i wrote *"a deferral list inherits its verdicts and never re-runs
them"*, i re-ran a live verdict of my own and it came back wrong.

so the pair is the honest record. **the rule did not save me from the defect; it saved me from a
second tick under it.**

## the TWENTY-THIRD — the cure was on my screen, and the VERB'S NAME sorted it

2026-09-03, mine, and it is the first instance whose countermeasure i had **read in the same
session, hours before i committed it.**

a fleet-wide reviewer malfunction named `FIREWORKS_API_KEY`. i ran `keyrack status`, saw no
`ehmpathy.prep` row, and reported the key **absent** — then surfaced three `keyrack set … --env
prep` commands as human gates and re-surfaced them across several babysit ticks. the human
corrected it in one line: *"those just needed the keyrack creds propogated."*

`keyrack list --owner ehmpath` holds the row. it was configured the whole time.

| | |
|---|---|
| what i consulted | `keyrack status` |
| what i claimed | the key is **absent** |
| what chose the subject set | **`status` reports only the UNLOCKED subset** |
| what i never ran | `keyrack list` — the verb that reports what is CONFIGURED |

### why it is not a repeat of the twentieth or the twenty-second

both of those turn on a read i failed to run. so does this one, on the surface. the difference is
**what made the un-run read invisible**, and here it was neither habit nor position — it was a WORD.

`status` reads as total. *"the status of the rack"* names no subset, admits no filter, and exits 0
over a partial answer. so the verb's name is the whole of the deception: a reader who knows the
domain, holds the allowlist, and wants the truth still stops at the first verb, because that verb
sounds like the one that answers.

⇒ **`absent` is a claim about the world. an empty result is a claim about the tool's scope.** the
two are indistinguishable in any instrument that reports a subset and does not name the subset.

### 🔴 the part that earns its own line — the cure was PRE-REGISTERED, by name

`.dream/2026_09_03.mechanic-keyrack-brief-covers-only-unlock.dream.md`, caught earlier the same
day, point 5, verbatim:

> **`list` vs `status`** — `status` shows only what is UNLOCKED, `list` shows what is CONFIGURED.
> a mechanic that reads `status` and sees no key concludes *absent* when the truth is *locked*.

and it names the term outright:

> ⇒ point 5 is the same defect as point 2, one layer up: **an instrument that reports a subset,
> read as though it reported the whole.** that is `term=partial-audit`.

i read that dream in this session. it names the tool, the two verbs, the false verdict, and the
term — and i produced the false verdict anyway, one org over.

r58 claims that to AUTHOR a countermeasure is no protection against the defect it names. this is
the stronger form, and it is worse: **to READ a countermeasure, in context, with the instrument in
hand, is no protection either.** a written cure fires only where a reader pauses to consult it, and
the nature of this defect is that no pause arrives — the first verb answered, so naught felt
unfinished.

### the cure

> **before you report a value ABSENT, name what its verb filters on.**

not *"did the tool fail?"* (it did not) and not *"is the content true?"* (it was — of the unlocked
subset). the question is narrower, and it is about the instrument's own vocabulary:

| the verb | what it enumerates |
|---|---|
| `status` | the **unlocked** subset |
| `list` | the **configured** set |

⇒ where a tool ships a `list` / `status` pair, they are **not** a verbose/terse pair of one answer.
they name different subject sets, and only one of them can settle *"does this exist?"*

### the cost, and why it compounded

a wrong `absent` does not sit still. it became three fabricated human gates, each re-surfaced on
its own tick, each one a request for work already done. **a false absence manufactures a task**,
where a false presence merely wastes a read — so of the two directions this defect can fail, the
one it took is the expensive one.

## .see also

- `term=partial-audit._.choice._.md` — the choice itself
- `term=false-report._.choice.reason.md` — the neighbor, and r49's open note this closes
- `rule.require.pause-babysit-cron-after-idle-streak` — the conjunctive criterion of the eighteenth
  **and the twenty-first, thirteen days apart**
- `rule.require.clamp-edge-cases` (mechanic) — a clamp whose subject set is narrow shares the defect

---

written by human + beaver 🦫
