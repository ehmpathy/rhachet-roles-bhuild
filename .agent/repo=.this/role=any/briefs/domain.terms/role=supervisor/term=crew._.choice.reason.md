# domain.term.choice.reason: crew

## .etymology — a human coinage, verbatim

the word was **not** authored by a robot. vlad coined it on 2026-08-09, in his own words:

> "create a brief that explains this hierarchy / **crew** = set of clones that works on a
> tree; our standard crew = mechanic + foreman"

that provenance is recorded as what it is: a **human attestation**, not a citation of prior
art. per `rule.require.domain-discovery-for-term-proposals`, a term the domain expert
recognizes with no gloss is discovered rather than invented — and this one arrived from the
expert's mouth with its definition and its standard membership already attached.

it is the second term in this glossary with that provenance (`factory upgrade` was the
first), and the pattern holds: the terms that stick are the ones the human says out loud
while pointed at the referent.

## .why `crew`

the beaver's world was already the repo's metaphor before the word landed — dams, lodges,
logs, a supervisor who "builds dams that shape the flow" rather than swims the river
(`im_a.bhuild_supervisor.md`). a crew is what that world calls a small band assigned to one
job site, and a tree IS a job site here.

`crew` also carries the right two properties without a gloss:

- **assigned to one site** — you say "the crew on that build", never "the crew" in the
  abstract. the 1:1 bind to a tree is baked into the word.
- **a set with roles, not a headcount** — a crew has a foreman. that the standard membership
  is `mechanic + foreman` is a fact the word already implies rather than one we bolt on.

## .why the forbidden synonyms distort

| ⛔ synonym | why it distorts |
|-----------|-----------------|
| `team` | implies persistence and identity across jobs. a crew exists only while its tree does, and dies with the fell. "the auth team" survives a branch; "the crew on beav/fix-x" does not |
| `squad` | military, and implies interchangeable members. a mechanic and a foreman are NOT interchangeable — the mechanic is a brain that does the work, the foreman is an empty terminal the supervisor reaches through, and that asymmetry is the whole design |
| `pair` | freezes the count at two. the standard crew is two, but `--roles` takes any list, and a third role (a reviewer, a prober) breaks the word |
| `worker set` | names the members and drops the site. a crew is defined by the tree it is on; a set of workers with no tree is a fleet's leftovers |
| `clone group` | same defect, plus `group` is the least specific noun available. it says a collection exists and naught about what binds it |
| `tree agents` | inverts the possession — it reads as agents *owned by* a tree rather than assigned to it, and `agent` collides with the harness's own word for a subprocess |

## .the evidence — why the word earns its own layer

`crew` is not a label over a pair of ducts. it names the layer that owns an ORDER, and the
order is what makes it worth a word.

### the order, and what it cost to learn

a crew is booted in three steps, and step 2 must precede step 3:

1. **tree** — find the worktree, verify it exists
2. **duct** — the tmux session per role, findserted **with an explicit `--cwd`**
3. **term** — the kitty tab per role

`term.open` findserts a duct of its own. so a tab opened against an absent session creates
that session **in the caller's directory**. on 2026-08-09, after a machine reboot, that is
exactly what happened: reclaimed mechanics landed in `nheuron` rather than in their own
worktrees, and a `claude --continue` from there resumes nheuron's conversation — the wrong
repo, the wrong task, and no error at any step.

a caller who remembers the order gets it right. a caller who invokes `crew.boot` cannot get
it wrong. **that is the argument for the layer, and therefore for the word.**

### the two axes, and the safety they fixed

the first cut of the verbs was `crew.open` / `crew.stop` (the verb is `crew.boot` today — see
the dispute below), with `crew.stop --keep-ducts` as the way to close a window and keep the work.

that had the safety exactly backwards: the **destructive** act was the bare verb, and the
**safe** act cost a flag. the cheap, reversible move was harder to ask for than the one that
ends a conversation forever (`rule.require.safe-by-default`).

the human caught it in one line:

> "whats crew.stop do? kill the duct? also, can we have a crew.hide"

which produced the 2x2 that now defines the term:

| axis | on | off |
|------|-----|-----|
| work | `crew.boot` | `crew.stop` |
| view | `crew.show` | `crew.hide` |

so the word does not merely name a set — it names what HAS two halves of unequal cost, and
the verbs are shaped by that inequality. a term that named only "two ducts" would have
carried none of it.

### the read it made possible

`crew.list` ran on its first invocation over a 26-duct fleet and surfaced, at a glance, two
**half crews** — a tree with a foreman and no mechanic, and one with a mechanic and no
foreman. `duct.list` had reported those same 26 ducts every day for a week and the gap was
invisible, because a reader had to pair them by eye.

a half crew matters: a supervisor with no foreman SEAT has no shell on the tree to run a check
or a `git tree del` from — every such command would land in the mechanic's own shell and
interrupt the worker (`howto.supervise-routes`). the defect was always there; the word is
what made it legible.

## .the boundary against its neighbors

| term | what it names | the bind |
|------|---------------|----------|
| **clone** | one worker | a role, addressed via its duct |
| **crew** | the set on ONE tree | 1:1 with a tree |
| **tree** | the worktree | 1:1 with a branch and a pr |
| **fleet** | every crew, every tree | what a supervisor sweeps |
| **grove** | the machine a crew runs on | a coordinate, not a rung |

`grove` is deliberately orthogonal — it is *where*, not *what*. a crew is the same crew on
`local` or on `cloud://grove-1`.

## .the count, put to the test — a crew of four, with one role repeated

the say file rejects `pair` on the ground that "`--roles` takes any list, and a third role (a
reviewer, a prober) breaks the word". on 2026-08-10 both halves of that argument turned real, in two
different ways:

| what turned up | what it shows |
|---|---|
| `duct://grove-1/main/prober` | a **third distinct role**, live — the exact case the rejection named |
| `foreman-2`, then `foreman-3`, on `camp-grove` | a **repeated role** — a shape the rejection never imagined |

the second is the one worth a record, because it tests a word the say file uses precisely: a crew is
"the **set** of clones". three foremen on one tree could have refuted that. they do not. the CLONES
are distinct — `foreman`, `foreman-2`, `foreman-3` are three addresses, three shells, three claude
conversations — and it is the ROLES that repeat. so a crew is a **set of clones whose roles form a
multiset**, and the say file's "a crew has a foreman" reads as *at least one*.

that survives contact, so no dispute is owed. it is recorded because a claim tested and upheld reads
exactly like one never tested at all — the same reason the `crew.open` field use above earns its
lines.

### what the repeat did break, one layer down

the role vocabulary is fine; the **flag** that reads it is not. `duct.poll` documents
`--role mechanic | foreman | any` in its own header, and
`rule.require.babysit-cron-per-dispatch-fleet` publishes the same table — but `--role` is
**reserved by rhachet**, so it never reaches the skill at all:

```
$ rhx duct.poll --role foreman --brief
error: BadRequestError: no skill "duct.poll" found with --role foreman
tip: did you `npx rhachet roles link` the --role this skill comes from?
```

the reservation was already on record — `nheuron`'s `howto.create-worktrees.md` states
it outright: *"`--repo`, `--role`, and `--skill` are reserved by rhachet."* the skill and the rule
were authored against it anyway.

**it fails SAFE, and that is the only reason it went a week unseen.** the unreachable flag is the
one that NARROWS, so the sole reachable scope is the widest — `fleet`, which matched `foreman-2` and
`foreman-3` correctly on their first poll. the rule's own blocker (*"a tick pinned to `--role
mechanic|foreman` = blocker"*) forbids a state that is now structurally unreachable.

it is a **gap**, not friction (`term=factory-upgrade._.choice.reason.md`): there is no compliant path
to a role-scoped poll, and the error routes the reader to `roles link`, which cannot ever help.
recorded here rather than repaired, because the repair is a flag rename in a skill plus a correction
in a rule, and neither is this round's errand.

### the COST the multiset carries — priced 2026-08-10, on a crew of six

the section above establishes that `--roles` takes repeats, and celebrates that the `pair` rejection
was right. it never prices what each repeat buys you, and one round later the price showed up.

`camp-grove` went to **six clones on one tree** — `mechanic`, `foreman`, and `foreman-2` through
`foreman-5`. within minutes, `foreman-5`'s write to
`conformance/scpSizeBounded.conformance.test.ts` was refused with
`Error: File has been unexpectedly modified.` — `foreman-2` had renamed the very exports
`foreman-5` was mid-edit on (`getResourcesOfBurnRateScp` → `getResourcesOfScpBurnRate`) between
`foreman-5`'s read and its write.

**this is the ordinary lost-update race, and it is not a new term.** optimistic concurrency control
names the mechanism, TOCTOU names the window. it earns no cluster here, and the prior art is cited
rather than re-coined.

what IS ours, and what the multiset section owed a reader:

> **a crew is 1:1 with a tree, so every clone in it shares ONE checkout — and naught in `crewwork`
> coordinates their writes.** the crew size is therefore the count of concurrent writers on one
> checkout, and it has no lock, no queue, and no owner map.

so the rejection of `pair` still stands on the vocabulary, and the multiset is still the right read
of the word. but `--roles a,b,c,d,e,f` is not a free knob: **each name past the first is another
writer against the rest**, and the sole guard between them is a per-file mtime check that belongs to
the harness rather than to us.

three properties follow, and each is worth a reader's attention before they grow a crew:

| property | why it matters |
|---|---|
| the guard is the HARNESS's, not ours | `crew.boot` opens N writers and knows naught of it; a clone that writes by another path gets no check at all |
| it fails LOUD, this time | the refusal named the fix (*"read it again"*) and `foreman-5` recovered in one turn. that is the harness at its best, and it is not a guarantee we own |
| it scales with crew size, not with work | six clones on one small conformance dir collided in minutes. the collision rate is a property of the CREW, not of the task |

### the READER's half, which the mtime guard cannot reach — 2026-08-11, a crew of seven

every line above says **writer**, and the guard it names is a per-file mtime check that fires on a
WRITE. so the section prices what it can see. one round later the other half surfaced, and it needs
no write at all from the party it costs.

`camp-grove/foreman-4` derived the same grid twice from one file, minutes apart, while peers
rewrote it:

| the read | the count |
|---|---|
| first derivation | **43 rows** |
| second derivation, same file, same command | **39 rows** |
| the yield's own header | `39 vectors × 6 assets = 234 cells` |
| the yield's own body, four lines on | `33 vectors × 6 assets = 198 cells` |

its own words, twice in one turn: *"the file has moved under me"* · *"the axis moved again
mid-check."* and a peer review, derived at yet another instant, disagreed with both.

**not one of those numbers is wrong.** each was true of the instant it sampled. that is what parts
the reader's half from the writer's:

| | the WRITER's collision | the READER's skew |
|---|---|---|
| who is harmed | a clone mid-edit | a clone mid-**audit**, which wrote naught |
| what the guard sees | a write against a moved file → refused, loud | **naught** — no write, so no mtime check fires |
| what the victim gets | an error that names the fix | a clean exit and a wrong number |
| what lands in the record | a retry | a **yield whose header and body disagree** |

the last row is the cost. the writer's race is caught and retried; the reader's skew is banked into
an artifact, and the artifact is what a later round trusts.

**the prior art is canonical and is NOT ours to coin.** two reads of one datum that differ because a
concurrent writer landed between them is a **non-repeatable read**; a set of reads mutually
inconsistent across instants is **read skew**. both are named in the ANSI SQL isolation literature
and predate this repo by decades. cited here rather than re-coined, exactly as the write-side
collision was.

what IS ours is where those words land: **a crew's `--roles` count is not merely the count of
concurrent writers, it is the count of concurrent readers over a subject those same writers move.**
the second number is the larger of the two, because every clone reads far more than it writes.

and it explains a defect the write-side account cannot: a clone that only reads can still poison a
downstream artifact, so *"stay off the files a peer has claimed"* — the supervisor's fiat, recorded
above as the fourth cure — protects writers from each other and does **naught** for a reader whose
subject a peer is entitled to rewrite.

**recorded, not repaired**, and the repair differs from the write side's. a lock or an ownership
split fixes the writers. a reader needs a **stable instant** — derive from a committed ref
(`git show HEAD:<path>`) rather than from the worktree, so the subject cannot move mid-audit. that
is a real design question and it belongs to the layer that owns the crew.

**recorded, not repaired.** a fix is a real design question — a file-ownership split by role, an
advisory lock in `crewwork`, or simply a documented cap on writers per tree — and it belongs to the
layer that owns the crew, not to a glossary round. what the glossary owes is that the multiset
section no longer reads as an unqualified win.

### a FOURTH cure, exercised the same day — the supervisor partitions by fiat

the three cures listed above all live in `crewwork`, and none of them exists. a fourth does, and it
was used on `camp-grove` on 2026-08-10 with no code at all:

> **the supervisor is the only party that sees both clones, so it can partition the work by fiat.**

`foreman` was mid-sweep across 78 `isAbsenceError` sites. `foreman-2` was live on the same checkout.
one message — *stay off the files foreman has claimed* — and the two ran in parallel with no
collision.

**this is the first PREVENTED collision on record.** every prior row in this section is a collision
observed AFTER it fired: a rename that landed between a read and a write, a refusal the harness
raised. a prevented one leaves no artifact, so it earns its line here or it is invisible.

what makes the fiat possible is a visibility asymmetry the layer diagram already implies:

| party | what it sees | can it partition? |
|---|---|---|
| a **clone** | its own pane | no — it cannot know a peer is mid-edit |
| a **crew** | naught — it is a SET, never a coordinator | no — there is no party there to decide |
| the **supervisor** | every pane, every tick | **yes** |

so the absent coordinator is not absent from the stack. it sits one layer up, in the party that
sweeps. that is worth the record because the three cures above all propose to build the coordinator
INTO the crew, and the cheapest one available today is to use the one that already watches.

**the honest caveat, and it is the reason an advisory lock still wins:** a fiat holds only while a
supervisor is watchful. it does not survive a paused babysit cron, a supervisor on another tree, or
a crew a human booted by hand. the lock survives all three. so the fiat is a MITIGATION a supervisor
owes a crew it grows past two, never a substitute for the repair.

## .an open inconsistency, recorded rather than papered over

this round introduced `--grove local | cloud://<name>` while duct uris already spell the
same concept as a bare authority (`duct://grove-1/main/mechanic`).

that is **two spellings for one concept in contracts written the same hour** — the drift
`rule.forbid.domain-term-synonyms` exists to catch. it is left OPEN here rather than settled
in a rush, because the two serve different grammars (a flag vocabulary vs a uri authority)
and the reconciliation deserves its own look. `grove` is not yet itemized; when it is, this
is the first question its `.reason` owes an answer to.

### it ESCALATED on 2026-08-10 — from HOW the word is written to WHAT the machine is named

`declastruct-aws`, which owns the resource, renamed the grove repo-wide:

```
grove-ehmpathy-1  →  grove-ehmpathy-v20260810
```

its reasons are sound and belong to it, not to us — a rebuild becomes a NEW NAME rather than an
in-place mutation (so a replaced box cannot inherit a predecessor's ssm key-track path), and the
ordinal's prefix-collision hazard vanishes by construction, since `grove-ehmpathy-1` is a strict
prefix of `grove-ehmpathy-10` and a fixed-width date cannot prefix another. it cites a real prior
incident: a track param keyed on a stable exid survived a rebuild, and reconcile decided KEEP on a
box whose disk had been wiped.

so the two sides no longer merely SPELL the concept differently. **they now disagree on the name of
the same machine**: our duct registry holds `duct://grove-1/main/mechanic`, and the repo that
provisions it says `grove-ehmpathy-v20260810`.

### the latent false report this creates — and why it is worse than an ordinary one

the rename is repo-only today (uncommitted, unapplied), so the live alias is untouched and the
grove's `💥 malfunction` on every poll is still hibernation. **that is a claim about today, and not
a claim about the day after the apply.**

once it applies, the ssh alias moves with the name — the doc-note says so outright, and names the
cost: *"the alias an operator types changes on every rebuild."* at that moment
`duct://grove-1/main/mechanic` becomes a registry row that points at an alias with no host behind
it. and a stale alias and a hibernated box **produce the identical `💥`**.

that is the `term=false-report._.choice._.md` shape with a twist that makes it sharper: it is not a
report that lies today, it is one that **will begin to lie on a date nobody will connect to the
symptom.** worse, the supervisor is already conditioned — the babysit prompt itself carries the
line *"`duct://grove-1/*` is a hibernated remote and reports 💥 every tick — known, not
actionable,"* and i have relayed that verdict on every tick of this session **and never once
checked it.** an inherited claim, held across dozens of reports, about to be quietly falsified by a
rename in another repo.

the countermeasure is the one the term already names, aimed one layer earlier: **a second,
independent instrument.** hibernation and a dead alias are indistinguishable from the duct layer,
so the adjudication has to come from somewhere that shares no source with it — whether the host
resolves at all.

recorded, not repaired. the rename is `declastruct-aws`'s call and its foreman holds the pen; what
is OURS is the stale row, and the row cannot be fixed until the name settles.

### ⚠️ the prediction LANDED — 2026-08-10, one round later

`duct.poll` now shows **`duct://grove-ahbode-v20260810/main/mechanic`**, and it reads `🌊 changed`
— a live, reachable remote. in the same tick `duct://grove-1/main/mechanic` vanished from the
registry entirely, while `duct://grove-1/main/prober` remained at `💥`.

so the apply happened, and it happened exactly as the section above said it would: a machine
renamed in another repo, a registry row left aimed at the old alias, and a `💥` whose MEANING
changed underneath a verdict that reads identically.

what this entry got RIGHT is the shape. what it got wrong is the name.

**the org segment does not match.** this entry recorded `grove-ehmpathy-v20260810`, read from
`declastruct-aws`. the live duct says `grove-`**`ahbode`**`-v20260810`. two readings, one date, two
orgs. either the scheme is `grove-<org>-v<date>` and there are two groves, or one of the two
readings is wrong.

**i do not know which, and i decline to guess.** that is precisely the move that produced the r70
correction. what is recorded here is the observation, never a reconciliation.

### what the split now proves about the `💥`

before the apply, `grove-1`'s `💥` was ambiguous between hibernation and a dead alias. now a
replacement machine is up AND answers, so the evidence tilts hard toward **stale alias, box
replaced**.

that is a tilt, not a verdict. the countermeasure named one round ago is still the one owed:
**whether the host resolves at all** — a witness that shares no source with the duct layer. until
that runs, `grove-1/main/prober` stays a row i decline to clear, because to clear it on the
strength of a replacement that answers would be an inference dressed as an adjudication.

### the inherited claim, finally checked

the babysit prompt still carries *"`duct://grove-1/*` is a hibernated remote and reports 💥 every
tick — known, not actionable."* this entry called that an inherited claim held across dozens of
reports and never once checked.

it is now checked, and it is **half wrong**: `grove-1/main/mechanic` is no longer a duct at all, so
the claim's scope (`grove-1/*`) over-reaches its own truth. a fixed line in a prompt is a
declaration, and a declaration decays exactly like the config lines this glossary already indicts —
except a prompt has no `display-message` to ask what it loaded. its only check is a reader who
doubts it, and for dozens of ticks that reader was not me.

### ✅ the OWED CHECK, finally run — 2026-08-10, and it refutes the tilt above

the countermeasure named twice above — *"whether the host resolves at all"* — was deferred for two
rounds and named as drift in the r77 journal. it costs one command:

```
$ for h in grove-1 grove-ahbode-v20260810 grove-ehmpathy-v20260810; do ssh -G "$h" | grep -m1 hostname; done
grove-1                    => hostname localhost
grove-ahbode-v20260810     => hostname localhost
grove-ehmpathy-v20260810   => hostname grove-ehmpathy-v20260810
```

`ssh -G` echoes the literal argument back when no `Host` block matches. so a rewritten hostname means
an entry EXISTS, and an echoed name means it does not. two findings, and both correct this entry:

| the claim above | the verdict |
|---|---|
| *"the evidence tilts hard toward stale alias, box replaced"* | **refuted.** `grove-1` still resolves; its alias is not stale at all |
| the org discrepancy — two readings, one date, two orgs | **settled.** `ahbode` is live; `ehmpathy` has NO ssh entry |

> ⚠️ **corrected 2026-08-10, one round on — this check is a DERIVED pair, and the derivation is
> through its ARGUMENT rather than its source.** the two sources are unrelated (a duct registry and
> an ssh config), which is the test this glossary prescribes and it passes. but the NAME i typed as
> `ssh -G`'s argument came out of the duct registry read two sections above. so the command was
> asked *"does this string map to a host?"* and answered yes; it was never asked *"is this string
> the right string,"* and could not have been.
>
> the tell: `duct.list` today reads `grove-ahbode-`**`v20260810.ground`** — a suffix this entry
> records nowhere. either the host was renamed again, or the quoted `duct.poll` line above is my own
> truncation. **left OPEN**; the `ssh -G` read that would part them is gated behind a permission
> this session does not hold, and a guess is what produced the org error two paragraphs down.
>
> the general form is now filed under `term=false-report._.choice._.md` → *the SECOND derivation*.

> 📌 **r82 — three consecutive polls now show it WITHOUT the suffix**: plain
> `duct://grove-ahbode-v20260810/main/mechanic`, every time. against that, exactly one read carries
> `.ground`, and that read is mine.
>
> the tilt is toward **my own transcription error**, not a second rename. it is a tilt and not a
> verdict, and the reason is the discipline this very entry exists to enforce: three reads of one
> registry are **one instrument polled three times**, not three witnesses. an adjudication needs a
> source the duct layer does not derive from — and that read is still gated.
>
> what changes is only the burden: the `.ground` read is now the outlier rather than the
> incumbent. **left OPEN.**

### ✅ SETTLED 2026-08-13 — the grove is UP, and the `💥` was never hibernation

the section below ran `ssh -G` and refuted the stale-alias hypothesis, then declined to say what the
`💥` WAS, because a dead tunnel and a hibernated box are indistinguishable from the duct layer.

a `duct.poll` on 2026-08-13 answered it, and the answer arrived with no new instrument at all: the
row flipped from `💥 malfunction` to **`🌊 changed`**, and a `duct.read` returned a live pane —

```
camper@ip-10-20-2-97:~$ setsid bash -lc bash\ \$HOME/git/more/dev-env-setup/src/devenv.upgrade._.sh …
[1] 524372
camper@ip-10-20-2-97:~$
```

a real shell, at a prompt, on a reachable host. **the machine is up.** so the babysit prompt's
long-carried line — *"a hibernated remote, reports 💥 every tick — known, not actionable"* — is
**refuted on its first half and upheld on its second, for a different reason than recorded**:

| the claim | the verdict |
|---|---|
| *"hibernated remote"* | **refuted.** a live box with a live shell |
| *"reports 💥 every tick"* | **refuted.** it reports `🌊 changed` and reads clean |
| *"not actionable"* | **upheld — new reason.** it holds a BARE SHELL: no claude session, no route |

the third row is what earns this the record. the verdict a supervisor acted on was RIGHT for ~90
rounds and its reason was wrong the whole time. **a correct act built on a wrong reason is the
hardest defect this glossary chases, because the outcome supplies no signal at all** — and it
survived two rounds of deliberate audit (`ssh -G`, three consecutive polls), each of which narrowed
the question and never reached it.

**what settled it was neither instrument, and neither audit.** the box came back up. so the honest
read is that this was not solved — it **expired**, and an expiry reads exactly like a resolution.

### the name question is settled too, and the answer was a THIRD name

the note above left OPEN whether the host was `v20260810` (this file's record) or a
`.ground`-suffixed variant. the live registry on 2026-08-13 says neither:

```
duct://grove-ahbode-v20260811/main/mechanic
```

**`v20260811`** — one day on from the recorded `v20260810`, and no suffix. so the `.ground` read
really was my own transcription error (r82's tilt was correct), and the ordinal moved because
`declastruct-aws` names a grove `grove-<org>-v<date>` and rebuilds it under a NEW name rather than a
mutation in place — that repo's stated design, at work exactly as designed.

so the registry row was never stale. it tracked a rename this glossary did not. **the drift was in
the RECORD, never in the fleet** — the inverse of what three rounds of this section assumed.

### ⚠️⚠️ REFUTED the next round — 2026-08-13, r98, by a read of the registry's own FILES

every claim in the two paragraphs directly above is wrong, and the read that refutes them took one
glob of `~/.ductwork/`:

```
hosts/grove-ahbode-v20260810.json          hosts/grove-ahbode-v20260811.json
hosts/grove-ahbode-v20260810.ground.json   hosts/grove-ahbode-v20260811.ground.json
ducts/main/mechanic.json  ->  { "host": "grove-ahbode-v20260811.ground" }
```

**four host registrations**, two dates × two suffix forms, and the live duct's `host` field carries
the suffix. so:

| the r97 claim | the verdict |
|---|---|
| *"the `.ground` suffix was my own transcription error"* | **refuted.** it is a real registered host name, and was at `v20260810` too |
| *"no suffix"* on the live row | **refuted.** the duct's own json holds `.ground` |
| *"the drift was in the RECORD, never in the fleet"* | **refuted.** the fleet carries four names for at most two machines |

what SURVIVES: the ordinal genuinely moved `v20260810 → v20260811`, and the rebuild-under-a-new-name
design is real. that half was right.

#### the mechanism — `partial audit`, and the filter was the tool's default population

r97 read `duct.poll` three times and `duct.list` once, and rendered a claim about **what the registry
contains**. those tools print **one name per duct** — the `host` field of a live row. they have no
way to print a host registration that no duct points at, so three of the four sat outside the subject
set by construction, and the verdict carried no trace of that.

that is `term=partial-audit._.choice._.md` mechanism 2. and it is the second consecutive round in
which a claim about this same name was drawn from what a tool PRINTED rather than from the files it
printed from.

**the sharpened rule, and it corrects this file's own prescription one paragraph up:** *"read the
REGISTRY for the instance"* is exactly what i did, and it misled me — because i read what the
registry PRINTS, never what it HOLDS. what it holds is files. read the files.

#### the defect this exposes

**one machine is registered under two names that differ only by a `.ground` suffix.** that is a
synonym in a host registry — the drift `rule.forbid.domain-term-synonyms` catches, one layer beneath
the vocabulary it usually governs. its cost is concrete: an operator who types the unsuffixed form
addresses a registration that no live duct points at, and earns a `💥` that reads exactly like a box
that is down.

**recorded, not repaired.** which form is canonical belongs to the layer that owns ductwork and to
`declastruct-aws`, which mints the name.

**the transferable form:** a name written into prose decays on the schedule of what it names.
`declastruct-aws` rebuilds a grove per date, so any glossary line that spells a grove instance is
stale within a day by construction. cite the **shape** (`grove-<org>-v<date>`), and read the
registry's **files** — never its printout — for the instance.

### what the org half actually was

`grove-ehmpathy-v20260810` was read from `declastruct-aws` **source**, uncommitted and unapplied. it
is a `declaration`, never a state — the exact species this glossary indicts one section above, and i
fell to it in the same file, one section later. there are not two groves. there is one grove and one
wish for a grove, and i compared them as though both were facts.

### what the `💥` is, and what it is NOT

the alias resolves, so the prober's `💥` is **not** a dead alias. what it IS remains unknown, and the
honest read is that `hostname localhost` means both groves reach through a forward — so a dead tunnel
and a hibernated box are still indistinguishable from here, and `ssh -G` cannot part them either.

recorded as unknown. the tilt is withdrawn rather than replaced, because a check that refutes one
hypothesis does not thereby prove its rival — the shape this file keeps re-deriving.

### the cost of the two-round deferral, priced

the check was one command and it ran in under a second. against that: two rounds carried a tilt that
was wrong, and one entry above carries an org-name reconciliation i twice declined to attempt while
the answer sat behind a command i already had permission to run.

**a check declined for want of certainty is not caution when the check itself is the cheapest move in
the room.** the r70 lesson was *do not guess*. its absent half, learned here: *and do not let "i
decline to guess" stand in for "i decline to look."*

## .disputes

### dispute: open  —  raised 2026-08-09  —  status: RESOLVED (rename to `crew.boot`)

- raised.by  = human ("didnt we rename crew.open -> crew.boot?")
- claim      = `open` is the wrong verb for the work axis. it is the ONLY one of the four whose
               pair does not read as an antonym (`open`'s opposite is *close*; `stop`'s is
               *start*), and — far worse — it overlaps in sense with `crew.show`. an operator
               who wants a window on screen reaches for the most obvious verb, and the most
               obvious verb is the **irreversible** one.
- counter    = `open` matched the layer beneath it (`duct.open`, `term.open`), so the stack read
               uniformly. that uniformity is exactly the defect: those two are cheap findserts
               and this one consumes a branch, two sessions, an install, and a bound route.
               a verb that hides that asymmetry is a mislabel, not a convention.
- resolution = rename to `crew.boot`. you boot a **machine**; you do not boot a window — so the
               word carries the cost, and no reader confuses it with `show`. `open` recorded as
               a forbidden synonym. 56 call sites and the skill file renamed the same hour.

### what the rename actually repaired

the two-axis split (`crew.stop --keep-ducts` → four verbs) fixed the safety **mechanically** and
left it broken **lexically**. the cheap act got the less obvious name:

| axis | on | off | the pair reads as |
|------|-----|-----|-------------------|
| view | `crew.show` | `crew.hide` | exact antonyms |
| work | ~~`crew.open`~~ → `crew.boot` | `crew.stop` | `open`↔`stop` did not pair; `boot`↔`stop` does |

that is the same defect as `--keep-ducts`, one layer up: there the safe act cost a **flag**; here
it cost a **less obvious word**. both make the expensive move the path of least resistance
(`rule.require.safe-by-default`, `rule.forbid.ambiguous-labels`).

the lesson worth a record: **a safety fix in the mechanism is not finished until the names carry
it too.** a reader reaches for a verb before they read a table, so the verb is the interface the
2x2 only documents.

### dispute: open (again)  —  raised 2026-08-09  —  status: RESOLVED (revive, for the COMPOSITE)

- raised.by  = human ("maybe we should declare a crew.open which idempotently runs crew.boot and
               crew.show … that way i can say open the crew and it'll be a findsert on boot and a
               findsert on show")
- claim      = the two on-verbs are the two halves of "a crew i can work with", and to pick
               between them a caller must first KNOW which half is up. that read is a cost the
               verb set imposes and a findsert-on-both removes.
- counter    = `open` was forbidden hours earlier, in the dispute directly above. to revive it
               reads at first like the drift `rule.forbid.domain-term-synonyms` exists to catch.
- resolution = **revive it — for the composite only.** the first dispute's objection was precise:
               `open` overlaps in sense with `show`, so a reader who wants a window reaches for
               the verb that ends a conversation. a verb that reaches BOTH axes **has no wrong
               axis to send them to.** reach for `open` when you want a window and you get the
               window, plus the work if it was down. the defect the word carried was a mis-route,
               and a composite has nowhere to mis-route to. `open` stays forbidden on the work
               axis; `crew.boot` keeps that seat.

### the evidence the composite was owed — a lookup paid purely to pick a word

the case that produced it was live, one round earlier. a crew was asked for; its ducts were live
and its tabs were closed. the verb choice took a `term.audit` **first** — a read whose only
purpose was to answer *"which of these two words applies?"*. that is the exact question a findsert
exists to make moot (`rule.require.get-set-gen-verbs`).

### the first field use, one round later — the prediction held

`crew.open` was invoked twice in anger on 2026-08-10, on the two `sdk-aws-lambda` trees, and both
runs landed in the exact state the composite was built for: **ducts live, tabs closed.**

| tree | work axis | view axis |
|---|---|---|
| `apigateway-wire-response` | 2 ducts **found** — untouched | 2 tabs opened (pid 3757940) |
| `input-only-validation-and-hydration` | 2 ducts **found** — untouched | 2 tabs opened (pid 3760154) |

what makes it evidence rather than a mere success: **no `term.audit` ran first.** the dispute's
whole case rested on a lookup paid purely to pick a word, and one round later that lookup was not
paid — not because the caller recalled the state, but because the verb no longer asks.

so the resolution predicted a cost would vanish, and it vanished. that is the cheapest kind of
corroboration a settled dispute can get, and it earns a line precisely because **a resolution
never exercised reads the same as one that is.**

### what the composite exposed — the 2x2 was a false report about its own code

`crew.boot` had opened tabs inline since it was written. so the table in the say file read
`work | crew.boot` while the mechanism did work **and** view — **the documentation of the split
was untrue of the code the split governs.** nobody noticed, because the table is what a reader
consults and the code is what a reader trusts it to describe.

it surfaced only because the composite forced the question: a `crew.open` added on top of a boot
that already opened tabs would produce **two words for one end state**, which is the overload
`rule.forbid.domain-term-synonyms` forbids. so the composite could not be built honestly unless
the axes were made true first. boot now opens no tab, and a clamp holds it there — proven by
revert: re-add the tab pass and 3 clamps go red.

that is the round's transferable lesson, and it is the inverse of the first dispute's:

> the first said a safety fix is not finished until the NAMES carry it.
> this one says a name is not trustworthy until the CODE carries it.
>
> a 2x2 that documents a split its own mechanism does not honor is not a diagram — it is a
> `false report` with a table's authority. **and a new verb is one of the cheapest routes to
> one, because a composite cannot be defined over halves that do not exist.**

### the asymmetry: there is no `crew.close`

the composite is offered in the ON direction only. the off-verbs cost wildly unequal amounts —
`hide` is free and reversible, `stop` ends a claude conversation for good — so a composite off
would bundle the cheap act with the irreversible one. that is the `--keep-ducts` defect in a
different hat: a single word whose blast radius the caller cannot see.

so the rule the verb set now embodies: **compose the safe direction, never the destructive one.**
a caller who wants a crew down must name which half they mean, and that friction is the feature.

## .see also

- `term=crew._.choice._.md` — the choice itself
- `define.work-primitive-hierarchy.md` — the stack a crew sits in, and where it ejects to
- `term=duct._.choice._.md` — a crew's work half is a set of ducts
- `rule.require.duct-name-pattern.md` — `$tree/$role`, the address form a crew is built on
- `rule.require.one-pr-per-worktree.md` — why the crew↔tree bind is 1:1

---

written by human + beaver 🦫
