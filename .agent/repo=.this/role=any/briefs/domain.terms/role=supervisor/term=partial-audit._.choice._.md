# domain.term: partial audit

term.chosen   = partial audit
term.kind     = noun
term.synonyms.forbidden:
- sample
- spot check
- incomplete audit
- partial review
- shallow audit

## .what

an audit whose **subject set is narrower than the claim it renders** — and whose auditor does not
know it.

the mark that separates it from every honest subset: **the selection criterion is orthogonal to the
measured property.** the auditor filtered on one axis, measured on another, and reported as though
it had read the whole.

```
audited:  the blocker list
measured: novelty
reported: "no novel classes remain"
truth:    a novel class sat in the NITPICK bucket, unread
```

severity chose the subject. novelty was the claim. the two have no relation, so the filter silently
excluded cases the claim covered.

## ⚠️ .the DIRECTION is incidental — a subject set can be too WIDE

the `.what` above says *narrower*, and nearly every instance below is one. that word describes
the common case and it is **not** the mark. the mark is the orthogonal criterion, which admits
both directions:

| the subject set | what the audit does | |
|---|---|---|
| narrower than the claim | under-reports — it MISSES cases the claim covered | nearly every row below |
| **wider** than the claim | **over-reports** — it counts subjects the claim never named | the 2026-09-01 case |

evidenced 2026-09-01, on an instrument whose two prior repairs were each the narrow kind. a
fleet tally swept every key in a box registry and reported the count as *"these roles"* —
where the rendered rows carry at-work crews alone. `down` and `phantom` crews hold registry
rows too, so it read `❔unknown × 2` where exactly ONE role sat at a keyboard, and the number
reconciled against no row on screen.

it is **mechanism 4**: a registry row is not a role at a keyboard, so the read was complete
over a subject of the wrong KIND. mechanism 4 names no direction, and it should not — to hold
the wrong artifact under-counts or over-counts by mere accident of which set is bigger.

⚠️ **the wide case is the harder one to catch**, because the first three questions all come
back clean AND *"did i read it all?"* returns **yes** — it read more than all. only the fourth
question separates them: *is what i read the same KIND as what i claim?*

## .why it needs its own word

an audit is what a supervisor substitutes for a full read. it exists precisely because a read of
everything is too costly — so its whole value rests on the subject set matching the claim.

when it does not, the audit is worse than absent: it **retires the question.** nobody re-audits a
class already declared clear, so the gap persists exactly as long as the record does.

## .the shape

three parts, and the third is what makes it hard to catch:

1. the audit runs to completion and returns a verdict
2. its verdict is stated over the FULL population (*"no novel classes remain"*)
3. **its subject set was a filtered subset, and the filter is invisible in the verdict**

no part of the output records what was skipped. a partial audit and a total one render the same
sentence.

## .the evidenced instances

| the audit | the filter it ran on | the property it claimed | what it missed |
|---|---|---|---|
| camp-grove's novelty audit | severity = blocker | novelty | a novel class in the nitpick bucket, for a full round |
| r48's countermeasure audit | the case in front of me (a poll verdict) | "the r47 fix holds" | the compose surface, where r50 found it broken |
| camp-grove's policy-document scan | `git ls-files` — TRACKED files only | "these are the documents we declare" | `resources.scp.dangerous.ts`, untracked — and the one over the size limit |
| camp-grove's vpc flow-log coverage note | aws's flow-log service — its own default exclusion set | *"a COMPLETE record"* | `amazon-dns-server` traffic — every dns query the camp resolver serves |
| termwork's `[case7]` litter sweep | `DIRS_MADE` **as of the moment it ran** | *"NOT ONE dir survives it"* | every dir registered after it — and, under `--scope`, its own entire subject set |
| my own tmux-plugin scan | `~/.tmux/plugins/` — ONE of TWO candidate dirs | *"continuum was never installed"* | whatever sits in `~/.config/tmux/plugins/`, never read |
| my dev-env-setup handoff | the two config FILES on disk | *"install_env writes TWO configs"*, *"the XDG file is hand-authored"* | the installer's source (it writes ONE) and git history (the file is repo output, frozen at `3cc42b6`) |
| my read of a mechanic's reflog | a record of ACTS — a hard reset onto `origin/main` | *"the MECHANIC hand-rolled a rebase"* — an actor | the shell history one scroll up: a hand-run `git status`, then `➜ nvim`. the human was at that keyboard |
| camp-grove's oidc trust verdict | its WORKTREE — one local checkout | *"the published trust admits ONE repo"* | live `origin/main` carries `repo:ehmpathy/*:*`, and the file it cited **does not exist on main at all** |
| a permission modal's option-2 grant text | the harness — the pipeline's FIRST MEMBER only | *"here is the command you would grant"* | `--mode apply`. one grant text served a read-only run AND a destructive one |
| my conflict-resolution audit | git's CONFLICT MARKERS — regions BOTH sides touched | *"the merge is resolved"* | 8 files of silent damage: 3 briefs reverted, 4 vanished, 1 resurrected — not one of them marked |
| my grepsafe diagnosis, ×4 over two months | **the two probes the SYMPTOM handed me** | *"the tool is broken"* | the flag is basename-scoped, not broken. `--path X --glob '*.sh'` searches recursively and was never once tried |
| input-only's awkwardness #11 (not mine) | its own ENCOUNTER HISTORY — how 3 collisions reached it | *"there is **no mechanism** that would have surfaced any of them"* | two: an unprompted peer handoff, and `git.repo.get`. an ABSENCE has no list to read, so the auditor reads its own path |
| my pane-change verdict | the two axes legible with no extra work — body, elapsed | a CAUSE, over a rule whose standard is a **3-axis conjunction** | width — a comparison against a read i did not keep, so it is the axis dropped by default |
| my commit-quota prime to 3 peer repos | the repo my **cwd** sat in | *"your local quota is unlimited"* — of a repo i was not in | 11 other meters. `git.commit.uses` is per-repo, and 2 peers read `no quota set` in the same minutes |
| my read of `--resume [value]`'s option line | its **first clause**, of two | *"`--resume` takes a session ID"* — so the human's proposal could not work | *"or open interactive picker with optional search term"* — one comma along, **inside a line i had transcribed verbatim** |
| my read of a repo's role anatomy | **whichever role was CHEAPEST to read** — `dreamer`, 5 files | *"this repo has not yet had to express a role with briefs"* — a `∄` over every role | `behaver`'s 40 briefs + its say/ref `boot.yml` — **already listed in my own boot context, at say level** |
| my idle-streak verdict, on 2 consecutive ticks | the conjunct answerable **from memory** — *did i act?* | `streak: 1`, then `streak: 2` | the second conjunct. both ticks polled `🌊 changed: 4`/`5`, so the true streak was **0**. the eighteenth's own criterion, re-audited 13 days on, and wrong the OTHER way |
| my escalation of a settings.json modal | **what was already on my screen** — one pane read | *"i cannot verify this from here — it is yours"* | `git.repo.get --tree`, on my allowlist the whole time. it returned the WHOLE file and both reasons dissolved. the only row whose claim is about my own POSITION, and the only one **withdrawn before the human acted** |
| my REPAIR of a poll join that had just misread a modal | the join's **token vocabulary** — which box states it knows | *"the split survives the join"* — a claim about whether the join still works | the join's **line-location**, which is what had broken it once and what broke it again 3 ticks on. i audited what it RECOGNIZES and never what it READS — then clamped that same narrow subject green |
| my FLEET REPORT, on **15 consecutive ticks** | `git.crew.poll` — whose own header prints **`scope: crews only`** | *"the fleet"* — 18 crews, 9 orphaned, 3 phantom | **5 beav trees**, invisible by construction. 20 sit on disk; it enumerates 15. and its derivation gap was **already written in `term=poll`, at say level, in the cluster for this exact instrument** |
| my read-verification of `npm run fix:readme`, **4 approvals over 4 ticks** | **NAME RESEMBLANCE** — i opened `setReadmeBrainRegistry.ts`, whose name most resembles the command | *"it writes `readme.md` only"* — a claim about what the COMMAND does | `package.json:31`, which names a **different** entry point (`fixReadmeBrainRegistry.ts`). the one artifact that DEFINES the subject is the one i never opened, four times running |
| my residue sweep, after a dogfood probe | `git diff --stat <path>` — **TRACKED files only**, the same default as row 3 | *"an empty diff, so the file is byte-identical to HEAD and the probe left nought"* | the file was **untracked**, so it was never in view at all. the empty output is true of the INDEX and silent about the file i named |
| my colour diagnosis | the **GROVE's** tmux server — the one host i happened to be inside | *"the colours are weird"* — a defect the human meets at **their own local terminal** | the **local** server, which carries a different defect at a different depth. one report named one cause for two machines |
| my keyrack absence verdict, re-surfaced over several ticks | `keyrack status` — the **UNLOCKED** subset, one of two peer verbs | *"`ehmpathy.prep.FIREWORKS_API_KEY` is absent"*, so a human must `set` it | `keyrack list` holds the row — configured all along, merely locked. the filter is named by its **peer verb**, and the cure was written **by name, in a dream i had read that same session** |

### the twenty-fifth — a NAME is not a LINK, and it is the cheapest filter to fall to

every prior row's filter is something an auditor can point at: a severity, a `git ls-files` default, a
clock, a cwd, a file count. this one's filter is **a resemblance**, and a resemblance leaves no trace
at all — i did not *choose* `setReadmeBrainRegistry.ts` over a rival, i simply arrived at it.

the shape, and it generalizes past commands:

| the claim is about | the artifact that DEFINES its subject |
|---|---|
| what a **command** does | its **declaration** — the `package.json` entry, the makefile target, the shell alias |
| what an **endpoint** does | the route table, never the handler whose name matches the path |
| what a **hook** does | the settings entry, never the file in the hooks dir |
| what a **cron** does | the crontab row, never the skill it appears to name |

in each case a plausibly-named file sits nearby and answers a **different** question. it is not a
wrong file — `setReadmeBrainRegistry.ts` is real, is called, and does exactly what i said. it was
merely never established to be **the** subject, and a chain has hops.

⚠️ the verdict came back **right**, which is what let it survive four rounds. `fixReadmeBrainRegistry.ts`
is nine lines — one import, one call — so the hop is a no-op and every approval was sound. that is
`term=substituted-criterion`'s fifth-instance shape: **a right answer from a link never checked reads
exactly like a right answer**, and it is the state most likely to freeze into a habit.

> **a name is not a link.** where a claim is about what a COMMAND does, its subject is fixed by the
> command's own declaration — never by which nearby file's name most resembles it. open the
> declaration first; it is one line, and it is the only artifact that can name the subject at all.

the tell that would have caught it on round one, and it costs no read: **ask what would happen if the
resemblance were coincidence.** where the answer is *"i would have audited an unrelated file and never
known"*, the resemblance is doing the work a declaration should.

### the twenty-sixth is row 3's mechanism on a SIBLING command — which is what earns it a row

row 3's filter was `git ls-files`; this one's is `git diff`. one auditor could dismiss the first as a
quirk of that one command and stay careful around it alone. **two commands, one default, settles it:
the tracked-only bound belongs to GIT rather than to either command**, so no per-command care will
catch the third.

it also names its own cure, and the cure is cheaper than a rule:

> **for a claim about a FILE, use an instrument whose subject is a file.** an instrument whose subject
> is the INDEX will answer about the index — correctly, in its ordinary format — and say nought about
> the question you asked.

⚠️ the sweep that caught it was a **grep**, which reads the file rather than the index. and a grep that
returns zero is the empty-filter species (`term=false-report`), so it owed a **positive control** —
the same filter aimed at a string i knew was present. both probe strings: 0 hits. both restored
strings: found, at the lines they belong on. only the pair adjudicates.

### the twenty-seventh — the FIRST host instance of the wide form

the ninth widened mechanism 4 past provenance to *"even the same file at another location, another
ref, another host"*. its evidence was a **ref** boundary — a worktree read, a claim about
`origin/main`. the **host** clause was predicted and had no instance behind it. this is the first.

a human asked why a colour read wrong in a duct. i measured the **grove's** tmux server, found
`default-terminal = screen` (8 colours), and reported *"the colours"* — a single cause. the human
came back with *"why are the colours STILL broken?"*, and the local server turned out to carry its
own, unrelated defect: `tmux-256color` with **no `RGB` feature**, so truecolor snaps to the
256 palette. two machines, two depths, two fixes. my report held one.

| | the grove | this box |
|---|---|---|
| `default-terminal` | `screen` — **8 colours** | `tmux-256color` — 256 |
| an `RGB` feature | absent | **absent** |
| what a fix takes | two settings **and a pane respawn** | one line, and a reattach |

⚠️ the two share a *symptom* and a *word*, which is precisely why one report covered both without
a seam a reader could see. **the shared symptom is what made the subject-set gap invisible** — had
the grove read wrong and the local read fine, no claim would have spanned them.

> **a claim about "the colours" is a claim about a machine.** where a symptom appears on N machines,
> the audit owes N reads — a config is per-server, and a server is a subject.

it also names the general trigger, which costs no read: **ask where the human is SAT.** every prior
row's subject was an artifact i chose; this one's subject was chosen by **where the observation was
made**, and that is a fact about the reporter rather than about the tool.

⇒ and the cure for the durable half is `term=false-report`'s, unchanged: i did not guess which conf
governed, i asked the tool — `tmux display-message -p '#{config_files}'` — and then proved the file
was repo output with `git.repo.get` against `origin/main` rather than with a local read. the
mechanism that made the twenty-seventh row is the same one whose cure i ran correctly two steps
later, on the very next claim.

the twenty-third is the term aimed at a **repair** rather than at a read, and it is the shape most
likely to recur: a defect presents through one mechanism, the repair takes that mechanism as its
subject, and a clamp then certifies the narrow subject with a green. so ask, at the moment you
fix: **is the mechanism i just found the DEFECT, or one of its symptoms?** — and where a second
mechanism could produce the identical symptom, the repair owes that one a verdict too.

### the twenty-fourth — the instrument DECLARED its own scope, and the declaration is the filter

every prior row asks *what chose the subjects?* and answers with a filter the auditor set, a
default a tool imposed, a clock, or a subject of the wrong kind. this one answers: **the instrument
said, in its own output, on every run.**

`git.crew.poll` opens with three lines, and the second is `scope: crews only`. its subject set is
`crew ledger ∪ duct registry ∪ live tmux` — three CREW-layer records. a tree whose crew predates the
ledger, holds no duct, and holds no tmux is outside all three, so it is unenumerable by
construction. four such trees were `👌 merged` and one held work; none appeared in any report i gave.

the proof costs one command, and is worth keeping as a **technique**: i felled three of them and
re-ran the poll. it came back **byte-identical** — same 18 crews, same 3 phantom, same 9 orphaned.

> **an instrument cannot un-count what it never counted.** so where you suspect a blind spot,
> DELETE a suspected-invisible subject and re-read. a count that does not move is a count that never
> held it — and unlike a wider read, this answers even when you cannot enumerate what is absent.

that is a live cure for the file's own `⚠️` about absence claims: *"an ABSENCE claim has none — you
cannot read a list of what is not there."* you cannot read the list. you can perturb the set.

#### ⚠️ and this is NOT the "recorded, not repaired" pattern — it is worse

three cases in this glossary share the shape *a countermeasure its own author could not hold within
the hour*. this one is not that. i did not forget a countermeasure i wrote; **i had never read the
one that was handed to me**, though it booted into my context every session:

> `term=poll._.choice._.md` — ⚠️ *"its shipped derivation is the crew ledger ∪ duct registry ∪ live
> tmux, **not trees on disk as its own header argues**. the gap is recorded, not repaired."*

say-level. the cluster for the exact instrument. the exact gap. it named the defect before i met it,
and i reported past it fifteen times.

so the failure mode is distinct and it deserves its own name in the operator's toolkit:

| the shape | why the record failed |
|---|---|
| a countermeasure **remembered** and not held | it needed a mechanical form |
| a countermeasure **written by you** and not held | same, and the authorship gave false confidence |
| **this** — a caveat written, booted, and never CONSULTED | a record only pays where a reader has a REASON to open it |

> **a documented gap is not a mitigated gap.** the glossary made the fact available; naught made it
> ARRIVE. an instrument's own caveat is owed at the moment of USE, and the only mechanism that
> delivers it there is the instrument's output — the very place `scope: crews only` was already
> printing, unread.

⇒ the cheapest general move, and it costs one read per instrument rather than one per claim: **the
first time a tick leans on an instrument, open its cluster and read what it declares it cannot
see.** once, not per-use. a subject set you have read once is a subject set you notice the edge of.

the **nineteenth and twentieth** rows are the ones whose excluded subject sat **inside the evidence
already in hand**, so no wider read could have caught either. every cure above answers *"how do i
reach the subject i missed?"*; in the nineteenth the subject was reached, quoted, and half-priced,
and in the twentieth it was **loaded into context and never consulted**. see the reason file.

the twentieth adds the one filter that evades question 1 outright: **cost.** *"i read the smallest
one"* feels like convenience rather than selection, so *"what chose its subjects?"* returns
*"naught in particular"* — while file count was in fact the strongest criterion applied, and it is
orthogonal to nearly every property worth measurement.

the fifteenth is the first row here whose claim was **TRUE**, which makes it the sharpest: a wrong
partial audit earns a dated correction, while a right one reads exactly like a founded claim,
forever. it also supplies the file's first cure for a subject you cannot reach — **hedge the claim
into a hypothesis**, so its subject-set gap becomes the recipient's to close. see the reason file.

the tenth is the term's first instance where the audited artifact is a **grant**, never a read. it is
mechanism 2 (a tool's default population) with the stakes inverted: an ordinary partial audit renders
a wrong claim, while this one would have handed over an authority whose reach its own text does not
show. see the note it corrected in `rule.require.babysit-cron-per-dispatch-fleet`.

the second is this repo's own, and it is the reason the term is ours rather than cited outward. it
also demonstrates the durability: r48's claim stood as settled for two rounds.

the third is a different KIND, and it moves the countermeasure. no auditor chose that filter —
`git ls-files` bounds to tracked files by default and says so nowhere in its output. so the
question *"what chose its subjects?"* returns naught useful, because there is no chooser to
interrogate. see the reason file for the second question it forces.

the fourth is the third's kind again — aws chose the exclusion, not the author — and it supplies
the sharpest measure yet of what a partial audit costs. the exclusion was never secret: aws
publishes the set on its own limitations page, and `DeclaredAwsVpcFlowLog` enumerates it in
source as `VPC_FLOW_LOG_TRAFFIC_UNRECORDED`. the answer sat in two places a reader could reach,
and the word *"COMPLETE"* survived **three rounds of review** regardless. so the defect is not
that the gap was hidden. it is that a rendered verdict retires the question, and nobody re-reads
a published page to check a claim already declared settled.

the fifth is mine, in a clamp i wrote hours after i had paved the r58 countermeasure into this
very file — and it adds a **second axis** the first four do not carry. its subject set was
narrowed by TWO independent mechanisms, and each alone was enough:

- **ORDER** — `[case8]` registers a dir AFTER `[case7]` has already iterated the list, so two
  `prefixcheck` dirs survived EVERY full run while the clamp reported green
- **SCOPE** — a `--scope case4` run filters `[case7]` out entirely, so its whole subject set went
  unswept and no verdict was rendered at all

so a subject set is narrowed not only by a filter the auditor chose, and not only by one a tool
imposed, but by **WHEN the audit runs inside a mutable set**. a snapshot of a list that is still
under construction is a partial audit even when no filter exists anywhere.

the cure it forces is structural rather than a sharper question: move the guarantee to a teardown
that **neither order nor scope can step around**, and make it FAIL LOUD. `[case7]` stays as the
proof the mechanism works; the `afterAll` is the promise. the measured cost of the gap: 1,786
orphan dirs in a shared `/tmp`, accrued under a green clamp.

the sixth is the third's kind — a tool's default population — with one twist worth the row: **i
caught it by a route that had naught to do with the audit.** i had read `~/.tmux/plugins/`, found
only `tpm`, and rendered *"continuum was never installed"*. an unrelated round later exposed that
tmux keeps **two** config trees on this box, so `~/.config/tmux/plugins/` exists too and was never
read. the verdict may still be right; it is simply **unfounded**, and it had been on record for a
round as though settled.

the seventh is a **fourth mechanism**, and the cheapest to fall to: the subject set was of the
wrong KIND entirely. i read two config files on disk and rendered a claim about **the program
that writes them** — *"install_env writes TWO configs"*. it writes one. two of its own past
revisions wrote to the other path and neither cleaned up, so the second file is a fossil, not an
output. the second claim rode the same gap: i read the file's reasoned comment block and inferred
a hand author, when `git show 3cc42b6:src/tmux.conf | diff` proves it byte-identical to repo
output.

no filter, no tool default, no clock. the subject set was **complete** — both files, read in
full. it was simply not the set the claim was about. a claim about a WRITER is answered by the
writer's source and its history; a claim about FILES is answered by the files. i held the second
and rendered the first.

that is the mechanism a complete read cannot protect you from, and it is why *"did i read it
all?"* is the wrong self-check. the right one: **name the subject the claim is about, then name
the subject i actually read, and see whether the two are of one kind.**

the cost is measured and it is the term's highest yet: the claim survived into a handoff, the
handoff was delivered by hand to `dev-env-setup`, and **their** learner caught both errors from
`git log -S'.config/tmux'` before i did. a partial audit that leaves the repo is one another party
must spend a round to refute.

the eighth is the seventh's mechanism a second time, one round later, and the pair makes the fourth
question **answerable** rather than merely askable. i read a reflog — a record of ACTS — and named an
ACTOR from it. both instances share one shape: the artifact recorded a **state**, and the claim was
about its **provenance**.

> **an artifact records its own state, never its causation. a claim about provenance — who wrote
> this, who ran this, what produced this — needs a provenance artifact.**

it also explains why a total read is no defense, in the one way the seventh did not: **a subject-set
gap makes you want more; a subject-KIND error makes you feel complete.** i stopped 5 lines short of
the shell history that named the human, and i stopped there because i believed i already held the
answering artifact — so a deeper read had no purpose i could name.

and it raises the stake, because the subject was a PARTY: a wrong claim earns a retraction, but a
wrong claim that names someone is an **accusation**, and mine reached the accused with an instruction
to confess. see the reason file — a false confession lands in a yield, and a yield is what a later
round trusts.

what the sixth adds: the countermeasure questions are asked at AUDIT time, and this gap became visible
only when a later round changed what i knew about the environment. so a partial audit can be
created **retroactively** — the read was complete against the world as i understood it, and a
later fact narrowed it after the fact. no question asked at the time could have caught it. the
only defense is that a rendered verdict stays revisable: when you learn the subject space was
bigger than you thought, **go back and re-open every claim you made over it.**

## .the ninth — the fourth mechanism, from a party that never read this term

camp-grove's round-14 redteam found that its own round-13 keystone was false.
`getGithubOidcTrustCondition.ts`, cited as fact #1 of four the convergence verdict rested on, **does
not exist on `origin/main`.** it lives only in an unmerged branch. live main carries
`repo:ehmpathy/*:*`, so the published trust admits every repo in the org rather than one.

it had been verified from the worktree.

### it GENERALIZES the fourth mechanism past provenance

the seventh and eighth were both provenance — an artifact of state, a claim about causation. that
yielded a narrow rule: *a claim about who wrote this needs a provenance artifact.*

this one is not provenance at all. the claim and the read concern the **same property of the same
file** — what does this trust condition say? and it still failed, because the file has two
INSTANCES and only one of them is published:

| the instance | what it records |
|---|---|
| the worktree copy | what THIS branch proposes |
| `origin/main` | what the org actually enforces today |

so the rule widens, and the wider form is the one to carry:

> **an artifact records the state of the subject it IS. a claim about a DIFFERENT subject — even
> the "same" file at another location, another ref, another host — needs that subject's own
> artifact.**

provenance is one case of it (the artifact is the effect, the claim is about the cause). publication
is another (the artifact is local, the claim is about remote). both are one error: the read was
complete, and it was complete over the wrong instance.

camp-grove's own cure is the mechanical form, and it beats a question:

> *"a claim about what is PUBLISHED is checked with `git show origin/main:<path>` or a live read.
> never with a worktree read."*

### it corroborates r58's structural claim, from outside

camp-grove had **recorded this exact defect class one round earlier** — its own `D13-2`, logged as
*"marked FIXED on a worktree grep while the leak channel is a public remote"* — then committed it
again while the correction sat in its own file.

that is r58's lesson, reproduced by a stranger:

> *to know a defect's name, to have just written its countermeasure, and to commit it regardless
> within the hour — that is a defect that needs a structural cure rather than an alert reader.*

r58 was mine, about a clamp i wrote hours after i paved that very countermeasure. this is another
party, another repo, another defect class, same interval, same shape. **two independent parties,
neither able to hold a countermeasure each had personally just authored.** that is the strongest
support this file carries for the claim that the cure must be mechanical.

### the boundary held, on a case neither of us authored

the two neighbors parted cleanly, no argument needed:

| | verdict |
|---|---|
| d1 — did the tool fail? | **no.** the worktree read ran clean |
| d2 — is the content untrue? | **no.** the file genuinely IS in the worktree |
| so `false report` | **refuses it** — fails d2, reader-inference family |
| so `partial audit` | **takes it** — fourth mechanism, wrong instance of the subject |

a discriminator pair tested on a case i did not author, and it routed correctly on the first read.
that is worth more than a case i sorted myself.

## 🔴 .the tenth — a REVIEW LANE is a partial-audit instrument, proved by three trees in one day

every instance above audits a **fleet** — a `term.audit`, a `crew.list`, a poll. the tenth moves
the term into a subdomain none of them touched: **a peer review lane.**

three trees, three distinct causes, all 2026-09-05, and **all three diagnosed by the clones
themselves rather than by a supervisor:**

| the tree | the cause | what the lane actually graded |
|---|---|---|
| `fix-keyrack-all-skips-manifest` | **the two axes conflated** — `--paths-with` is BREADTH (what to grade), `--diffs since-main` is PROVENANCE (whose work). a branch with zero commits makes merge-base equal HEAD, so the provenance axis goes degenerate | the whole uncommitted tree — 23,509 insertions across 208 files |
| `fix-contemplation-gate-on-entrance` | **the repeated-flag collapse** — `--paths-with '**/*.test.ts' --paths-with '**/*.snap'` keeps only the LAST | one glob's worth, where two were declared |
| `fix-contemplation-gate-on-entrance` | **the empty bind** — `paths: (none)` → 286 files → 950.5k tokens, **122.2% of window** | naught. it overflowed before it read a line |

⇒ run the definition against each row: *an instrument chose its own subject set, and its verdict
carries no trace of what it excluded.* **all three fit with no amendment.**

#### 🔴 for row 1, the OBVIOUS repair is INERT — measured 2026-09-05

the row names the cause and invites one fix: *restore the `--diffs` flag.* the `fix-keyrack`
clone tried exactly that, and reported what it found:

> *"`--diffs since-main` computes a merge-base. on a branch with zero commits the fork point IS
> head, so the provenance axis is degenerate — **a correction that restores the flag is inert.**"*
>
> *"⇒ **a review scope is a fact about the repo STATE, not only about the FLAGS.**"*

⚠️ **every other row here is repaired by a fix to an argument. this one cannot be** — the argument
is already correct, and the repo state is what emptied it. so a supervisor who reads row 1,
restores the flag, and calls it closed has changed naught and now believes otherwise.

⇒ that is a **partial audit one layer up**: the repair itself reports success over a subject set
it never touched. the row's true remedy is a **commit**, which is a human gate — see the spiral
note below, whose exit this identifies.

⚠️ **and a written caveat is not a guard.** the same clone recorded that it had this caveat
written and *"still violated it five times."* the check belongs in the guard's own scope
computation, never in a note the caller is trusted to hold in mind.

### 🔴 why this EXTENDS the term rather than merely adds to it

every prior instance is an instrument a **supervisor** reads. a review lane is an instrument a
**guard** reads — and the guard passes or blocks a stone on its verdict.

⇒ so a partial audit here does not mislead a reader. **it moves a stone.**

the third row is the sharpest, and `rule.always.diagnose-reviewer-malfunctions` names the trap by
name: an overflowed lane **returns terminal and unlocks the next level**, so it reads much like a
lane that ran. every other malfunction announces itself as broken; this one announces itself as
done.

⚠️ and the first row is a **`spiral`** as well as a partial audit — every artifact written to
satisfy a lane enlarges the diff that blinded it (`rule.always.break-the-zero-commit-review-spiral`).

### .the countermeasure the clones supplied, and it is one layer past the operator's

none of the three filed its find as a verdict; each diagnosed the instrument first. one wrote the
sentence this whole section rests on:

> *"a review scope is a fact about the repo state, not only about the flags."*

⇒ the operator's countermeasure below says **name your subject set**. this adds the harder half:
**a subject set can go degenerate for a reason no flag shows.** the flags were correct in row one
— the repo state made them inert.

## .why the forbidden synonyms distort

| ⛔ synonym | why it distorts |
|-----------|-----------------|
| `sample` | a sample is DELIBERATE and carries a stated inference from part to whole. a partial audit believes it read the whole — the defect is that its own gap is invisible to it |
| `spot check` | same defect, plus it advertises its own narrowness. a spot check that finds naught claims naught |
| `incomplete audit` | names the outcome, not the mechanism. EVERY audit is incomplete in some direction; this term names the specific case where the selection criterion is orthogonal to the measured property |
| `partial review` | `review` is taken — it is the bhrain route object with verdicts, budgets, and a contemplation loop. one word, two concepts |
| `shallow audit` | depth is a different axis. an audit can read every subject shallowly, or one subject deeply; this is about WHICH subjects, never how closely |

## .the operator's countermeasure

do not ask *"did the audit pass?"* — ask **"what chose its subjects, and does that criterion bear on
what it measured?"**

| the criterion | the claim | verdict |
|---|---|---|
| the same property being measured | that property | sound |
| a property orthogonal to it | that property | **partial audit** |
| a deliberate subset, stated as such | an inference, stated as such | a sample — sound |

the cheap check: **state the subject set out loud, then state the claim.** if the sentence
*"i read X and therefore Y holds everywhere"* does not follow, the audit is partial.

and where the subject set is MUTABLE, a third question is owed — *"could the set still grow after
i read it?"* a filter is not the only way to narrow a subject set; **timing is another**, and it
leaves no trace in the verdict at all. for that case the cure is not a better question but a
different placement: run the audit where neither order nor scope can step around it.

and a fourth question, owed even when the read was COMPLETE — *"is the subject i read the same
KIND as the subject my claim is about?"* a claim about a program is answered by its source and its
history; a claim about files is answered by the files. to hold one and render the other is a
partial audit whose subject set has no gap at all, so the first three questions all come back
clean. this is the only mechanism a total read cannot defend against.

**four** instances of that fourth mechanism now sit on record, and each of the last two widened the
rule the pair before it yielded. the narrow form, from the seventh and eighth:

> an artifact records its own state, never its causation. a claim about provenance — who wrote
> this, who ran this, what produced this — needs a provenance artifact.

the ninth is not provenance at all — a worktree read, a claim about `origin/main`, the same
property of the same file. so carry the wide form, which subsumes the narrow one:

> **an artifact records the state of the subject it IS. a claim about a DIFFERENT subject — even
> the "same" file at another location, another ref, another host — needs that subject's own
> artifact.**

the practical shape it takes most often: **local is not published.** a claim about what the world
sees is answered by `git show origin/main:<path>`, a live read, or a fetch — never by the copy
under your cursor.

⚠️ **the wide form presumes an artifact exists to read. an ABSENCE claim has none** — you cannot read
a list of what is not there. so the auditor reaches for what it CAN read, which is what it did not
encounter, and that is a fact about its own path rather than about the territory. the thirteenth
instance is exactly that: *"there is no mechanism that would have surfaced any of them"*, derived
from how three collisions happened to arrive.

for those the cure is not a different artifact but a stated bound:

> **an absence claim must carry the search that produced it.** *"no X surfaced"* is sound as *"no X
> surfaced TO ME"*, or as *"i searched HERE and found no X"*. it becomes a partial audit the moment
> it drops the bound and reads as a fact about the world.

and one hard stop rides on top of it, because the eighth instance's subject was a PARTY:

> **before you name an actor, check that you hold an artifact which records actors.** a wrong claim
> earns a retraction; a wrong claim that names someone is an accusation.

⚠️ **and where the criterion is a CONJUNCTION, one false conjunct settles the verdict — so an
auditor is logically entitled to stop at the first it finds.** that entitlement IS the filter: the
conjunct it stops at is whichever it checked first, and that order bears no relation to which
conjuncts are false.

> **an audit of a conjunctive criterion owes a verdict PER CONJUNCT, never one verdict for the
> conjunction.** say which held and which failed — every time, even where one failure already
> settles it.

the cost is invisible by construction: the verdict stays correct while a second, unnamed conjunct
is equally and permanently false. see the eighteenth instance.

⚠️⚠️ **and a TRUE conjunct entitles no stop at all — which is where the twenty-first instance costs
the answer, not merely the evidence.** the two cases split on the truth value of whichever conjunct
got read first, and that truth value is the one factor the auditor does not choose:

| the conjunct read first | the stop | the verdict |
|---|---|---|
| **false** | entitled | correct, under-evidenced |
| **true** | ⛔ unentitled | **wrong** |

> **a FALSE conjunct settles a conjunction; a TRUE one settles naught.**

and the ORDER is usually set by cost, never by relevance — the conjunct answerable from memory gets
read, the conjunct that needs a second look does not. so carry the trigger rather than the rule:

> **where a criterion has N conjuncts, a verdict has N lines.** a one-line verdict on a two-conjunct
> rule is unfinished on its face, before any reader knows what the conjuncts say.

⚠️ **and every cure above presumes you can REACH the right artifact.** sometimes you cannot: the
subject is a peer repo, a remote host, a machine your cwd does not cover. the fifteenth instance is
that case — a claim about three peer repos' commit meters, rendered from the one meter i stood in.

for those, hedge:

> **a claim shipped with an instruction to re-verify is a hypothesis, not a verdict.** the audit is
> still partial; what changes is that its subject-set gap becomes the RECIPIENT's to close — and the
> recipient stands where the artifact is.

it holds only where the recipient can reach that artifact AND is told which one. a hedge with no
named subject (*"double-check this"*) buys naught: it hands over the doubt and withholds the address.

⚠️ **and every cure above says READ MORE — which buys naught where the subject is a SENTENCE.** a
sentence you already quoted is a subject you already reached, so no wider read exists to run. the
nineteenth instance is that case: an option line transcribed verbatim, priced at its first clause.

for those, bound the read by the punctuation:

> **a claim drawn from a sentence is bounded by that sentence's terminal punctuation, never by its
> first comma.** a coordinated `or` clause names a SECOND subject, and an audit that halts at the
> first has enumerated one of two.

so ask question 1 of the WHOLE sentence: *what chose its subjects* — the artifact, or where my eye
stopped? it reaches every enumerated contract a reader skims: an option line, an error that names
two causes, a union type, an `||` in a guard.

⚠️ **and question 1 returns CLEAN when the filter was cost.** *"i read the smallest one"* feels
like convenience rather than selection, so *what chose its subjects?* answers *"naught in
particular"* — while file count, or proximity, or whatever was already open, was the strongest
criterion applied, and it is orthogonal to nearly every property worth measurement.

for those, ask the quantifier instead:

> **name the QUANTIFIER before you name the subject set.** a claim of the shape *"no X here…"* /
> *"this repo has not…"* / *"none of them…"* quantifies over a SET, and only the set answers it. a
> single member answers the `∃` form and **naught** about the `∄`.

the tell is that ONE read can be sound for an `∃` claim and unsound for a `∄` claim drawn in the
same breath — so the read is never what is at fault, and no scrutiny of it will surface the gap.

and one cure that costs no read at all: **before you fetch, consult what you already hold.** a
boot context, a prior tool result, a file already open — reached-and-unconsulted reads exactly
like unreached, and is the cheaper of the two to fix.

⚠️ **and every cure above audits a READ. a green CHECK is a subject set too — and its roster is
invisible.** *"types, lint, format, unit — all green"* reads as total verification. it is a subject
set of four instruments, and the question in hand may sit outside every one of them.

evidenced 2026-08-26, and **refused rather than committed**. a mechanic had planted a deliberate
probe in its own source to prove a clamp bites, and the open question was whether it had put the
source back. its four gates were green. **not one of them could have gone red on that defect** — the
clamp that catches the violation is an acceptance SNAPSHOT, and acceptance was still inflight. so the
greens were honest, complete, and mute on the only question asked. i opened the file instead.

> **a check that could not have gone red on the defect is not evidence about the defect.** before you
> accept a green as proof, ask what it would have done had the defect been present. where the answer
> is *"the same"*, its jurisdiction does not cover your claim — and its roster, never your question,
> is what chose the subject set.

this is `rule.require.clamp-edge-cases` step 2 — *prove the clamp bites* — turned around and aimed at
someone else's evidence. that rule asks an author to EARN a clamp; this asks a reader to PRICE one
before they bank it.

it is not the circular-verification near miss that `term=false-report` records. there the check is
derived from its own subject, so it agrees by construction. here the checks are fully independent,
entirely honest, and **blind on the one axis that mattered** — which is why they read as proof.

⚠️ **and every cure above audits a claim about the WORLD. a claim about your own REACH is a subject
set too** — *"i cannot verify this from here"* is a verdict, and the set behind it is whatever you
happened to consult. the twenty-second instance is that case: i escalated a permission modal on
evidentiary grounds while the tool that closed the gap sat on my own allowlist, unread.

this is the exact inverse of *"before you fetch, consult what you already hold."* that one says a
reached artifact went unconsulted; this one says an **unreached** artifact went un-enumerated:

> **before you escalate for want of evidence, enumerate the reads you have NOT run.** *"i cannot see
> it from here"* is a claim about your POSITION, and a position is often one tool call away from a
> change.

the tell is cheap and it sorts every escalation into two kinds:

| the escalation says | can you discharge it yourself? |
|---|---|
| *only you hold this authority* — a grant, a quota, an approval | ⛔ never. it is theirs by construction |
| *i cannot see enough to judge* | ✅ **often** — the gap may close with a tool you already own |

the second kind is a candidate for discharge, always. to surface it un-enumerated spends the
scarcest resource in the loop on a gap that was yours to close.

⚠️ **and both kinds presume the escalation is YOURS. a RELAYED one is a third kind, and it evades
the table by construction** — because it wears kind 1's shape while its premise is kind 2's.

evidenced 2026-09-01, over days. a mechanic reported its blocker as
`gh secret set FIREWORKS_API_KEY --repo ehmpathy/rhachet-roles-bhrain`, and i surfaced that to the
human on every tick. it reads as kind 1 — a repo secret is the human's to set, theirs by
construction — so the kind-2 discharge check never fired.

but a `gh secret set` escalation carries a **premise**: that the secret is absent. that premise is
squarely kind 2, and two reads settled it in under a minute:

| the read | what it showed |
|---|---|
| `gh api -X GET repos/…/actions/secrets` | `FIREWORKS_API_KEY`, `updated_at 2026-06-16` — present, and months old |
| the failing shard's step env | `FIREWORKS_API_KEY: ***` — it reaches the job |

so the gate did not exist. the mechanic had held the wrong diagnosis for hours, and **i converted
its diagnosis into a fact by the act of relay** — a claim it owned became a claim i asserted,
with no read of my own between the two.

> **a relayed escalation is a claim you have adopted. the AUTHORITY half may be theirs and the
> PREMISE half is always checkable — so sort the two before you pass it on.**

the shape generalizes past secrets, because nearly every kind-1 escalation carries a kind-2
premise underneath it:

| the relayed escalation | its authority half (kind 1) | its premise half (kind 2) |
|---|---|---|
| *"set this secret"* | only they can write it | **is it absent?** |
| *"grant commit quota"* | only they can grant it | **is the meter actually at 0?** |
| *"fill this keyrack key"* | only they can fill it | **is it truly unfilled, or merely locked?** |
| *"approve this stone"* | only they can approve | ✅ genuinely pure — no checkable premise |

only the last row is a true kind 1 with naught beneath it. the others are a kind-1 verb resting on
a kind-2 fact, and the fact is the half that goes stale.

**the tell, and it costs one read:** where an escalation names an ACT the human must take, ask what
STATE that act would change — then read the state. where the state is already what the act would
produce, the escalation is discharged and the real blocker is elsewhere.

#### ⚠️ the premise has DEPTH — presence is not validity

the tell above says *read the state*, and it does not say **how far in**. i ran it on the secret
row and it came back clean:

| my read | what it showed |
|---|---|
| `gh api -X GET repos/…/actions/secrets` | present, `updated_at 2026-06-16` |
| the failing shard's step env | `FIREWORKS_API_KEY: ***` — injected |

so i discharged the escalation and told the human it was false. **it was not.** the mechanic dug
one layer past my two reads and found every shard fails **401**: the key was rotated ~2026-08-15,
three sibling repos got the new value within five days, and bhrain was never visited. its replica
holds the revoked string.

both of my reads were correct. my conclusion was wrong, because *"is it absent?"* and *"is it
LIVE?"* are two questions and i answered only the cheaper one.

> **a premise is a chain, and a discharge must reach the END of it.** presence, injection, and
> validity are three separate facts about one credential, and each is answerable by a different
> read. to answer the first two and stop is a partial audit **of the premise** — the same defect
> the section names, one layer down.

the general shape, for any kind-1 verb whose premise you mean to check:

| the escalation | the shallow read | the read that actually settles it |
|---|---|---|
| *"set this secret"* | is it declared? | does a call with it **succeed**? |
| *"grant commit quota"* | is a meter row present? | does `git.commit.set` actually pass? |
| *"fill this keyrack key"* | is it listed? | does an unlock **return a value**? |

the pattern: the shallow read asks about the RECORD, the settling read asks about the EFFECT. a
record can be present, well-formed, and wrong — which is why `term=false-report`'s whole
declaration cause exists.

##### 🔴 2026-09-05 — the INSTRUMENT can conflate the two, and then no care reaches the end

every row above assumes the shallow read and the deep read are two calls a reader chooses
between. **sometimes one call answers the shallow question and RENDERS it as the deep one.**

measured on `grove-ahbode-v20260901`, with a token string invented on the spot:

```
CLAUDE_CONFIG_DIR=~/.tokprobe CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-notarealtoken \
  claude auth status --json
→ { "loggedIn": true, "authMethod": "oauth_token", "apiProvider": "firstParty" }
```

`loggedIn: true`, for a literal nobody minted. the verb reads *"is a credential PRESENT?"* and
prints a field whose name asserts *"is it LIVE?"*

⚠️ **and the same instrument is honest one arm over.** under `claude.ai` oauth it returns a real
`email` and `orgId` — it caught a swap that had silently re-authed the very account we meant to
leave, and it did so four times this session. so it is not a broken tool; its fidelity **depends
on which arm it reads**, and it never says which.

⇒ the cause sits in the scopes: a setup-token carries `user:inference` alone, with no
`user:profile`, so no identity exists for the verb to fetch. **it answers with the strongest
claim its data can carry, rather than with the claim its field name makes.**

> **a discharge must reach the end of the chain — and where the instrument itself stops short, a
> reader cannot get there by care. only a DIFFERENT instrument reaches it.**

so the read that settles a token is a call that **spends** it:

| the claim | the shallow read | the read that actually settles it |
|---|---|---|
| *"this box holds a live token"* | `claude auth status` — **true for garbage** | an inference call that returns content |

⚠️ the durable half is the generalization, not the instance: **before you trust a field, ask what
the verb could have measured.** a boolean named for a property the tool has no data to observe is
a `false-report` that waits on its first reader, and it reads as confirmation every time.

⇒ acted on: `git.grove.auth --mech token` is barred from this terminus by its own clamp
(`work.surface [case25] t8`), which asserts the token arm returns BEFORE the `auth status` call
the oauth arm ends at.

##### 🔴 row 93 RECURRED on 2026-09-07 — and the read that settles it was already prescribed, by name, here

row 93 records a commit-quota claim rendered from the wrong repo's meter. the repeat is worse in
two ways, and it earns the lines because a repeat is this file's strongest evidence class.

**first, a second and independent cause** the row does not carry. row 93 says the meter is
per-repo — true, and insufficient. even the RIGHT repo's org meter settles naught:

> **an `allowed` org meter is a VETO LIFTED, never a QUOTA CONFERRED.** the two are AND-ed, and
> the local state file is what confers the count. **`allowed ⇒ quota` is a step the code does not
> take.**

so i read `global: not blocked` + `ehmpathy: allowed`, plus a bare `get` in **my own** repo that
answered `left: unlimited` — three correct reads, one claim, and the claim was about a subject
none of them covered. the third is row 93 verbatim; the first two are new.

**second, the cure was on this page.** the table directly above prescribes the read that settles
this exact verb — *"does `git.commit.set` actually pass?"* — and i ran the shallow one regardless.
a crew refuted me with that precise command, `exit 2`, and wrote the sentence to carry:

> *"the enforcement-path probe is the only read that outranks the composition, **because it IS the
> composition**."*

⇒ that is this file's *"a caveat written, booted, and never CONSULTED"* shape, turned on the file
itself. **a prescribed read is not a read that was run.** where a claim has a command beside it
that settles it, the shallow read is no cheaper version of the audit — it is a different audit, of
a different subject.

#### ⚠️ and a SELF-AUTHORED escalation has a premise too

the section above opens *"both kinds presume the escalation is YOURS"*, which reads as though a
relayed one were the sole exception. it is not. **an escalation you author yourself rests on a
premise, and yours is as checkable as anyone's.**

evidenced 2026-09-01. a mechanic sat on one permission modal for **1848 minutes** —
`source use.apikeys.sh && rhx review …` — which i had graded `escalate` on every tick, faithfully,
off the auto-decline row *"anything that names a key, secret, token, or credential → escalate,
always."*

that grade carries an unstated premise: **the human holds a thing this command wants.** i read
that file, and the premise was false:

```bash
if [[ -f ~/.config/rhachet/apikeys.env ]]; then source ~/.config/rhachet/apikeys.env
```

it sources a plain file outside the repo — a hand-rolled credential path parallel to keyrack. the
human had naught to grant. the mechanic did not need a permission; it needed a **different door**,
and the keyrack door was allowlisted the whole time. the correct verdict was **decline + steer**,
and it had been available for thirty hours.

> **an escalation is a claim that the human holds the key. that claim is a premise, and the party
> best placed to check it is the one about to make it.**

what makes this the harder case: a relayed escalation at least arrives from elsewhere, so it wears
a visible seam. a self-authored one is produced by a rule you applied **correctly** — and a rule
applied correctly does not feel like a claim at all. it feels like a lookup.

**the tell that fires on it:** where a rule routes you to `escalate`, name the thing the human
would supply. where you cannot name it — or where the name is *"permission to run this exact
string"* rather than a credential, a grant, or an approval — the rule matched the SHAPE and not
the situation, and a steer is owed instead.

## .not-this

- **a sample with a stated inference** — sound. the narrowness is declared and reasoned
- **an audit that reads every subject and errs** — that is a wrong judgment, not a partial one
- **a `false report`** — that term requires the subject be an INSTRUMENT emitting a measurement.
  an audit renders a judgment. see `term=false-report._.choice._.md`, and the r49 note on its
  implicit subject bound

## .see also

- `term=false-report._.choice._.md` — the nearest neighbor, and the discriminator that parts them
- `term=escalate._.choice._.md` — the VOCABULARY for the escalation sections above (the two
  halves, the two kinds, the two authors, the boundaries). this file holds the mechanism and
  every instance of it; that one holds the words
- `rule.require.clamp-edge-cases` (mechanic) — a clamp whose subject set is narrow has the same defect
- `rule.require.trust-but-verify` (mechanic) — verify the claim; this asks what the claim covered

---

written by human + beaver 🦫
