# term = false report — the reason

## .the discovery — a defect found by a mechanic, then found in my own mouth

on 2026-08-04, `declastruct-github.beav.feat-org-security-lockdown` printed a line mid-sweep:

> "grepsafe --glob false zero again"

that was a mechanic's note to itself about a tool it had learned to distrust. what made it a
term rather than a bug report was the next move: **the supervisor checked whether it had made
the same mistake, and it had.**

in the round immediately prior, the supervisor had written into its own distillation record:

> "`grepsafe` confirms `clamp` appears **nowhere** in nheuron's `repo=.this` briefs."

the evidence for that sentence was `rhx grepsafe --pattern clamp --glob '.agent/repo=.this/**/*.md'`
→ `matches: 0`. the same glob shape the mechanic had just called broken.

## .the reproduction — single variable, isolated

the claim was not accepted on the mechanic's word. it was reproduced, with exactly one
variable changed:

```
--pattern 'prefer the narrow option' --glob '*.md'            →  1 match  ✅
--pattern 'prefer the narrow option' --glob '.agent/**/*.md'  →  0 match  ❌
```

same pattern, same repo, same minute. the matched line lived at
`.agent/repo=.this/role=any/briefs/rule.require.babysit-cron-per-dispatch-fleet.md:163`, so the
path-prefixed glob searched a tree that provably held the string, and reported none.

the root conclusion (`clamp` is absent) survived — an independent tool confirmed it. but
**the evidence cited for it was worthless, and no amount of care would have revealed that.**
that gap between a true conclusion and a hollow proof is the whole reason the term exists.

## .why the `fail*` family cannot absorb it

the repo already carries a family for how a mechanism behaves when it goes wrong, and the
temptation is to file this as a fifth member. it does not fit, and the misfit is precise.

every `fail*` member presumes **a failure that occurred and must be routed**:

- `failfast` routes it to a halt
- `failloud` routes it to the operator, with a fix named
- `failhide` routes it to the void
- `fail-open` routes it to stdout and then ignores it

a false report has **no failure to route**. the tool did the task it was asked, exited 0, and
produced its ordinary output. the defect is not in the error path. it is in the answer.

this is why a `fail*`-shaped coinage (`failwrong`, `failquiet`) would mislead: it would send a
reader to the error handler, which is the one place the defect is guaranteed not to live.

## .why `report`, and what it beat

- the **`-ing` noun form of `read`** was the first choice — instruments give them, and it covers
  every instance. it is barred by `rule.forbid.gerunds`. the rule is right to bar it, and the
  loss is small.
- **`signal`** is vague about the source. a signal can come from the world; a report comes from
  an instrument you asked. the accountability is in the word.
- **`verdict`** is already taken, twice — `duct.poll` prints per-duct verdicts, and peer
  reviewers render verdicts. to overload it would be exactly the double-duty
  `rule.forbid.domain-term-synonyms` forbids.
- **`report`** is already the word for what these tools emit (`duct.poll` prints "one report"),
  so `false report` composes onto extant vocabulary rather than adds a fresh noun.

## .why it belongs to nheuron, and is not deferred outward

`rule.require.domain-term-itemization` scopes itemization to terms that compose objects and
operations **this repo declares**. four of the five evidenced instruments are nheuron's own
skills — `duct.poll`, `duct.list`, `duct.send` — declared at
`.agent/repo=.this/role=any/skills/`. only `grepsafe` belongs to `repo=ehmpathy/role=mechanic`.

this differs from earlier rounds, where a term was cited outward rather than paved: the
harness/feature split went to `rhachet` (r4) and `clamp` stayed with
`repo=ehmpathy/role=mechanic` (r6). in both, the word governed another repo's mechanism. here
the mechanisms are ours, and so is the vocabulary that describes how they lie.

**the `fail*` family is a separate matter and stays where it lives.** should the family's owner
wish to add a peer, that is their call; this term does not annex it, and deliberately draws its
boundary against it rather than inside it.

## .what makes it dangerous, stated plainly

a broken tool that crashes costs you a retry. a broken tool that answers costs you every
decision downstream of the answer, and charges no interest until one of them matters.

the six instances share one property: **each report was in the correct format.** `matches: 0`,
`✔ submitted`, `⌨️ box empty`, `🌊 changed`, `💥 malfunction`, `❔ box UNKNOWN` — every one of
these is a valid, expected output that the same tool produces truthfully at other moments. there
is no glyph, no exit code, and no log line that distinguishes the true instance from the false
one.

that is why the countermeasure cannot be vigilance. it must be a **second instrument**.

## .the pattern this completes

three of today's costly errors share one root, and the term names the third:

| the error | what was trusted |
|-----------|------------------|
| a destructive `git restore` recommended on a pane read | a claim about state, unverified |
| a `--prefix` wrapper blamed on a corrupt credential store | a causal story, unverified |
| `clamp` "confirmed absent" by a broken glob | **an instrument, unverified** |

the first two are covered by `rule.require.trust-but-verify` — verify the claim. the third
extends it one layer down: **verify the instrument that produced the claim.** an operator who
has internalized the first two will still fall to the third, because the instrument feels like
the ground truth rather than another claim.

## .the restraint this term was measured against

six prior rounds of `learn.domain.terms` paved zero terms, on a stated discipline: a term must
be **compelled** by evidence, never manufactured to satisfy an hourly hook. round 5 wrote
"a taxonomy that grows every hour is not a taxonomy"; round 6 declined two candidates outright.

this one was tested against that bar before it was written:

- **a new kind?** yes — every `fail*` member presumes a failure; this presumes success
- **evidenced?** five instances, four in this repo's own skills, one reproduced by a
  single-variable test
- **a victim?** a mechanic, and the supervisor's own record
- **would it be re-derived?** it already was — twice, by two parties, on the same afternoon

it cleared every line. the six rounds of restraint are what make this one credible.

## .the first near miss — what this term does NOT cover

one round after this term was paved, a second tool defect surfaced, and the pull to file it
here was immediate. it does not belong, and the reason is worth the record.

`declastruct-github` found that `rhx git.repo.test --what unit --mode apply --resnap` **accepts
the flag and does not resnap** — confirmed against three flag orders and against the full suite.
a flag honored in appearance and not in fact reads, at a glance, exactly like a false report.

the discriminator settles it:

| | false report | the `--resnap` defect |
|---|---|---|
| exit code | **0** | non-zero |
| the run | succeeds | **fails** |
| what the operator sees | an answer | an error, with a remedy named |
| when they learn | perhaps never | at once |

**a false report's whole danger is that no failure occurs.** the `--resnap` run failed loudly,
printed jest's own remedy hint, and the mechanic applied the two snapshot entries by hand and
re-verified clean in the same turn. the cost was minutes, not a wrong decision carried
downstream.

the accurate name for that defect is narrower: **an accepted flag that is silently ignored,
whose failure then names a different remedy.** one instance so far, so it is recorded as a
defect to report rather than paved as a term.

the near miss is kept because the over-application was live — the supervisor reached for this
term and had to stop itself. a term's first use in the field is where it is most likely to be
stretched, and a term stretched past its discriminator discriminates naught.

## .the second near miss — a report that is TRUE and worthless

the first near miss was refused because the run FAILED. this one is subtler: it succeeds,
exits 0, and prints its ordinary format, so it clears that discriminator outright.

`rhx git.repo.test --what acceptance … --resnap` writes the snapshot, then compares against
what it just wrote. it is green by construction. a mechanic in this fleet named the hazard
unprompted and refused to bank the result:

> "now the run that actually proves it — a second, independent run with no resnap"

it applied the same suspicion to a second confound in the same round: a full suite came back
2372 passed / 0 failed, and it discarded one suite's verdict because it had edited that file
mid-run. a green report from a run whose input moved is evidence of naught.

the pull to file both here was strong. neither belongs, and the reason sharpens the term:

**a false report's content is WRONG. a resnap-green report's content is RIGHT.** the snapshot
really does match — it matches because the run made it match. the defect is not in the answer;
it is in what the answer is evidence FOR. a true statement that carries no information.

so the term has two discriminators, and a case must fail neither:

| | false report | a resnap-green run |
|---|---|---|
| did the tool fail? | no | no |
| is the content untrue? | **yes** | **no — it is true** |
| what is defective? | the answer | the answer's evidentiary worth |

the accurate name for the second is **circular verification** — an instrument whose own act
produces the condition it then measures. established prior art, so it is cited rather than
coined, and it belongs to `repo=ehmpathy/role=mechanic`, whose `rule.require.clamp-edge-cases`
already carries the principle: *a clamp with no teeth reads as protection while it guards
naught.*

two near misses now, both the supervisor's, both caught before they landed. a term reached for
twice in error and refused twice has a boundary that works — but this record exists because the
reach was real both times, and the second was harder to stop than the first.

## .the third near miss — a TRUE report whose reader inferred the wrong cause

on 2026-08-05 a mechanic's every hook died in one worktree, each with the same line:

> `/bin/sh: 1: ./node_modules/.bin/rhx: not found`

the human read it and asked, reasonably: *"why is .bin/rhx not found again? didnt we just install it?"*
that inference — a bad or absent install — was wrong, and turns had already been spent on it.

the pull to file it here was the strongest of the three, because the mechanic itself described the shape
in this term's own language: *"the failure reports as another cause entirely."*

it still does not belong, and the reason is exact:

| | false report | this |
|---|---|---|
| did the tool fail? | no | **yes — the hook died, exit non-zero** |
| is the content untrue? | yes | **no — rhx really was absent at that relative path** |

it fails BOTH discriminators, not merely one. the message is a true statement about a narrow fact: the
path `./node_modules/.bin/rhx`, resolved against the shell's cwd, held no file. what went wrong was the
INFERENCE a reader drew — that the package was absent, rather than that the path was relative and the cwd
had moved below the repo root.

so the defect sits in a third place, and to name it completes a set:

| where the defect lives | the name |
|---|---|
| in the answer | **false report** |
| in what the answer is evidence FOR | circular verification (cited; `repo=ehmpathy/role=mechanic`) |
| in the inference a reader draws from a true, narrow answer | **neither — it is the reader's own** |

a term stretched to cover the third would cover every misread of every honest error message, which is to
cover naught. the countermeasure there is not a second instrument; it is `rule.require.trust-but-verify`
turned on one's own inference.

three near misses now, and each has tightened the term rather than widened it. that is the pattern a
healthy term shows: the refusals teach more than the acceptances.

## .the fourth reach — the first one NOT caught in time

the three above were each stopped before they landed. on 2026-08-06 a fourth was not, and the
difference is the whole reason it earns a record.

a mechanic ran `git.repo.test --resnap`, a CI-mode guard refused the write with an exit 2 and a
printed error, and the mechanic then edited the snapshot by hand. the supervisor relayed that to a
human as **the `--resnap` accepted-and-ignored defect from the near-miss table, in a new coat.**

**run the discriminators and it is not this term at all.** d1 asks whether the tool failed; it did
— exit 2, error printed, guard named. that alone refuses it, exactly as near-miss #1 was refused
for exactly the same reason. the two cases ARE the same shape; the error was to say that shape
belongs to this table when this table's own `.not-this` section exists to exclude it.

what makes it worth the record is not the misclassification. it is WHERE it happened:

| the three prior | the fourth |
|---|---|
| reached for, checked, refused | reached for, **stated to a human**, refused only after |
| cost: a minute of the supervisor's own | cost: a human read a wrong classification |

the r44 entry already named this exact surface — *"what actually slid between the two referents
was the supervisor's own prose, in reports written to a human"* — and this is its third instance
in four rounds. the pattern is stable enough to state:

> **the discriminators are cheap to run and easy to skip, and they get skipped in PROSE far more
> than in analysis.** a supervisor that would never bank a false report as a conclusion will still
> reach for the term as a figure of speech — and a figure of speech in a report to a human reads
> as a classification.

the countermeasure is the one the term already carries, aimed one layer further out: **before you
name this term in a sentence, run d1.** one question, and it costs less than the correction does.

## .the fifth reach — a DECLARATION read as a state

on 2026-08-09, minutes after a machine reboot, i read `~/.tmux.conf` and found:

```
set -g @plugin 'tmux-plugins/tmux-continuum'
set -g @continuum-restore 'on'
set -g @continuum-save-interval '15'
```

`~/.tmux/plugins/` held only `tpm`. neither plugin was ever installed, and `~/.tmux/resurrect/`
did not exist — so the 15-minute autosave had been a no-op for as long as that config has sat on
disk.

what i found was correct and useful. **the label i put on it was not.** i told the human:

> *"that's a `false report` in the config's own voice — the `.tmux.conf` is a map … `~/.tmux/plugins/`
> is the territory."*

run the say file's own procedure and it collapses. said out loud in its own words, the config says
*"i want continuum, and i want restore on."* is that sentence false? no — it is a true statement of
intent. the false sentence — *"continuum is installed and saves every 15 minutes"* — is mine.

so it fails d2, and fails the subject test besides: a config file is not an instrument that emits a
measurement. it is a wish addressed to a plugin manager that may never have run.

**this is the second consecutive round where the misuse landed in PROSE, to the human, rather than
in analysis.** the fourth reach recorded that pattern and prescribed the cure — *"before you name
this term in a sentence, run d1"* — and one round later i did not run it. so the cure as written is
insufficient: a rule that fires only when you remember to fire it cannot help the case where you
never noticed you were about to classify.

what would have caught it is cheaper and far less voluntary:

> **the term reaches for an INSTRUMENT. if you cannot name the tool and the command that produced
> the output, it does not apply.**

there is no command behind a `.tmux.conf` line. that check runs off the sentence in front of you
rather than off a memory to run a check.

the case is kept because **what i found was right and the label was wrong**, and those two are easy
to conflate. a correct diagnosis dressed in the wrong term still spreads the wrong term.

## .the correction — two instruments DETECT, they do not ADJUDICATE

on 2026-08-05 `grove-1` produced the cleanest demonstration yet, and it is still **OPEN** as this
is written — which is exactly why it earns the record.

a global reinstall reported success: `Packages: +194`, `Done in 10.2s`, exit 0. its own peer note
named a package as present in the tree:

> `└─┬ with-simple-cache 0.15.3` … `✕ unmet peer with-simple-cache@>=0.17.0: found 0.15.3`

a second instrument — the worktree's own diagnostic probe — reported the opposite:

> `✋ no with-simple-cache@* in the global virtual store`

both cannot be true of one tree. so a false report is present, **and the second instrument did not
tell me whose.** the probe may be sound and the install partial; or the install may be sound and
the probe's store-path assumption wrong — which would make the PROBE the false report, in the exact
broken-glob species this term was paved on.

i did not settle it, and deliberately did not guess. what the case teaches is a boundary the
countermeasure section had blurred:

- a second instrument **DETECTS** the discrepancy
- a **single-variable test** — one input changed on the SAME instrument — **ADJUDICATES** it

the r7 reproduction was a single-variable test, not merely a second tool: same pattern, same repo,
same minute, one glob changed. that is what made its verdict sound, and the say file has been
corrected to say so rather than leave "a second instrument" to stand as a settlement.

the honest shape of an unsettled case is worth as much as a settled one. a record that shows only
successes teaches a reader to expect one.

## .the sixth instance — INSIDE an instrument i wrote, in the same file as its countermeasure

on 2026-08-09 i built a test harness for `ductwork`, and its teardown leaked socket files into a
shared `/tmp` — 43 of them across six runs, while every clamp reported green.

three hypotheses, each wrong, and all three wrong the same way:

| # | the hypothesis | the proxy it rested on |
|---|---|---|
| 1 | the poll exits early because tmux unlinks the file first | the socket FILE, for server liveness |
| 2 | a race — the kill lands but the file lingers | reachability, for liveness |
| 3 | a stray pid is the creator | the pid, for the party that spawned it |

hypothesis 1 was disproven by injection: i neutered the poll (`attempt < 0`) and the suite stayed
green with `/tmp` clean. so the poll was not the fix, and i said so rather than keep the repair
that had happened to coincide with the symptom's absence.

then i neutered `kill-server` outright — `execFileSync('true', …)` — and **all 34 clamps passed**.
that is the strongest self-indictment on record here: with the teardown's whole purpose removed,
not one clamp went red. the reason is the newest species. my `rmSync` unlinked the socket
unconditionally, tmux reaches a server through its socket path, and so every survivor was rendered
*unreachable* — and `hasTmuxServer`, the predicate i had written that same hour, read unreachable
as down.

**the instrument's own side effect manufactured the answer it then gave.**

what broke it open was a witness the action could not reach. `/proc` holds a tmux process whether
or not its socket is linked, so a scan of the process table answered what the socket could not:

```
up: false, pids: [529038, 529042]
```

one line, self-contradictory, and the first honest sentence either instrument produced that hour.
the same scan then named the actor by argv:

```
tmux -S /tmp/tmux-1000/ductwork-test-send-…  new-session -d \
     -s rhachet_beav_feat-keyrack-unlock-scope/foreman  -c …/_worktrees/…
```

a LIVE-FLEET duct name, spawned into a test's private server, seconds after that server had
provably been emptied. the cause: a duct's pane inherits `DUCTWORK_TMUX_SOCKET`, so the operator's
interactive rc ran inside the pane and planted its sessions on my socket. the fix was three-fold —
`SHELL=/bin/sh` in the pane, a `duct.stop` at the end of case5, and a teardown that converges on
the process table.

### why this instance matters more than the five before it

1. **it is inside a tool i wrote**, in the same session, in the same file where this term's
   countermeasure is cited. to know the term is no protection against a fresh one from my own
   hand.
2. **a second instrument would not have saved me.** any tool that reads the same socket path
   inherits the same broken proxy. they agree, both are wrong, and the agreement reads as
   corroboration — the derived-pair trap, except the pair is derived from a fact i created.
3. **the green clamp is itself a row in the table.** `[case10] NOT ONE survives its own teardown`
   passed while 43 sockets sat on disk, because it checked the FILE and tmux unlinks early. a
   clamp is an instrument, and a clamp built on a broken proxy is a false report with a badge on.

the rule the say file now carries — *read FIRST, act SECOND; where you must act before you can
read, read a witness the action cannot reach* — is a **structural** countermeasure rather than a
vigilant one, which is what this term has needed since r7. every prior countermeasure asked the
operator to be suspicious at the right moment. this one asks a question about the code's shape:
**does this party have both the motive and the means to make its own report come true?** a
teardown that reports what it tore down, a cleanup that counts what it cleaned, a migration that
verifies its own result — each answers yes, and each is checkable by a reader who suspects naught.

## .the seventh instance — my own SWEEP manufactured the change it then counted

2026-08-10. the babysit tick opens with a mandated resize: every DETACHED fleet window is set to
200x50, because a kitty tab closed on the way out freezes its window at a tiny transient width, and
a narrow pane breaks `duct.poll`'s detectors (a live claude mechanic false-reports as `no input
box`).

that step is correct, and it is also the defect. **a resize rewraps the pane, so its bytes change,
so the content hash changes, so `duct.poll` reports `🌊 changed` for a clone that did naught.**

the tick that caught it read **7 changed**. two of those were `sdk-aws-lambda` mechanics whose panes
were byte-identical to a read taken four ticks earlier — same final line, and the same frozen
elapsed markers (`Baked for 6m 7s`, `Baked for 4m 37s`). a session that had worked would not carry
the same elapsed.

### settled by the STRONGER move, for once

r71 recorded a self-indictment: the say file's rule says re-run the SAME instrument with one input
varied, and i had reached for a second instrument instead — which detects without adjudication.

here the single-variable test was run: **poll again, with no resize between.** `7 changed → 3
changed`, and the four that dropped were exactly the four with frozen elapsed. one command, same
instrument, one input removed, cause isolated. the three that stayed had genuinely moved in the
seconds between the two polls.

### why this is worse than a plain miscount — it DISABLES a rule

`rule.require.pause-babysit-cron-after-idle-streak` counts a no-change tick as **no action AND no
fleet change**, and pauses the cron at six in a row. that is the only mechanism by which a fully
parked fleet stops consumption of ticks.

if the sweep's own first step fabricates a fleet change every tick, **the streak can never reach
six and the cron can never pause.** the rule is not merely hard to satisfy; it is structurally
unreachable while the resize runs first.

so the observer-side-effect species has a consequence class the prior six did not show: a false
report that silently voids a DIFFERENT rule which reads its output. the miscount is local; the dead
rule is not.

### the cures, cheapest first

| cure | who owns it | cost |
|---|---|---|
| poll twice, trust the SECOND verdict | the supervisor, today | one extra read-only call per tick |
| hash the pane NORMALIZED for width (strip the wraps) | ductwork | a real change, and the true fix |
| resize AFTER the poll | nobody — it breaks THIS tick's detectors | rejected |

the third invites a reach and it is wrong: the detectors need the wide pane on the tick that reads
them, so a resize deferred to the end trades a fabricated `changed` for a fabricated `no input
box`. one false report swapped for another.

recorded, not repaired. the normalized hash belongs to the layer that owns `duct.poll`.

### ⚠️ the first cure is UNSOUND as a measurement — and i reported its output as fact for three ticks

the first cure — *poll twice, trust the SECOND verdict* — works as a **cure**: the second verdict is
free of the resize's rewrap, so acting on it is correct.

it does **not** work as the **measurement** i turned it into. across three ticks i reported the delta
as a fabrication count:

| tick | poll 1 | poll 2 | what i said |
|---|---|---|---|
| A | 8 changed | 5 changed | *"three were my own resize"* |
| B | 11 changed | 5 changed | *"six of the eleven were my own resize"* |
| C | 6 changed | 2 changed | *"four of the six were my own resize"* |

**the delta is not a fabrication count, because the two polls measure different INTERVALS.**

- poll 1 compares against **last tick's** hash — a ~15 minute window
- poll 2 compares against **poll 1's** hash — a window of seconds

so a clone that genuinely worked during the 15 minutes and has since gone quiet reads `changed` in
poll 1 (**correctly**) and `unchanged` in poll 2. it lands in my delta and it was never fabricated.

the honest reading of the delta: **fabricated OR real-but-now-stopped, and the method cannot part
them.** the only two i ever PROVED fabricated were proven by a different route entirely — a pane read
showing the same frozen `Baked for 6m 7s` elapsed marker across both polls.

### which species this is, run through the discriminators

| | |
|---|---|
| d1 — did the tool fail? | **no.** both polls ran clean |
| d2 — is the content untrue? | **no.** poll 2 truthfully reported 5 panes differing from poll 1 |

it fails d2, so it is the **reader-inference** family, and its cause is **scope**: poll 2 answers a
narrower question (*what moved in the last few seconds?*) than the one I put to it (*which of poll 1's
changes were fabricated?*). that is the r40 rule — *when a true report misleads, ask whether the
instrument's scope matched the question* — and the cure there is the same as it is here: **a different
instrument whose reach matches the question.**

what makes this worth the entry rather than a footnote: **I built the mis-measurement myself, out of a
cure this very file prescribes, and then published its output three times.** a cure that is sound for
ACTION and unsound for MEASUREMENT is a trap with no warning on it, because the same two commands
serve both and only one of them is right.

### a FOURTH cure, which measures soundly — reorder the tick

the ordering that separates the two cleanly costs no extra call:

```
1. poll            → change verdict over the true 15m window, no resize contamination
2. resize          → widen the detached panes
3. poll            → box-state verdict on wide panes
```

step 1's verdict is the honest answer to *"who moved?"*, and that is the verdict with a rule
downstream of it. step 3's hash becomes the baseline for the next tick, and since that baseline is
also a wide-pane hash, the two stay consistent tick over tick.

> ⚠️ **corrected on its first run, 2026-08-10.** the line above originally read *"step 3's delta is
> PURE fabrication"*. it is not, and the error is the very one this section indicts. step 3 compares
> against step 1's hash — a window of SECONDS, not zero — so a clone that moves in that window lands
> in the delta honestly. the window is far smaller than the two-poll cure's, so contamination is far
> less likely; **"far less likely" is not "pure."**
>
> exercised: poll 1 = 10 changed over the true window, poll 3 = 4 changed. that 4 is *resize
> fabrication OR movement in the seconds between*, and the method still cannot part them.
>
> what the reorder DOES buy, and it is the whole point: **step 1's verdict is uncontaminated**, so
> `rule.require.pause-babysit-cron-after-idle-streak` finally reads an honest input. the fabrication
> COUNT stays unmeasurable by this route, and to want one is the appetite that produced the defect.

the cost of the old order, now visible: the detectors read on step 3 either way, so **no gain was
bought by a resize that ran first.** the order was arbitrary and it corrupted the one verdict that has
a rule downstream of it.

### the SECOND consequence, one tick later — the idle CLOCK is reset too

the section above treats the damage as a fabricated `🌊 changed`. one tick later the worse half
surfaced: the poll's other verdict is **`🧊 unchanged (Nm)`**, and `N` is time since the last hash
change. a resize that rewraps a pane changes the hash, so **it resets that clone's idle clock to
zero.**

> ⚠️ **corrected the very next tick.** the first draft of this line read *"resets EVERY detached
> clone's idle clock"*, and the next tick refuted it: `sql-dao-generator/mechanic` went 283m → 298m
> and `apigateway/mechanic` went 15m → 30m across a resize — both grew by the full interval, so
> neither was reset.
>
> the true rule is narrower and worse: **a resize resets the clock only of a window whose width it
> actually CHANGES** — that is, a window whose kitty tab was closed since the last resize. a window
> already at 200 cols is re-set to 200, no rewrap, no hash change, no reset.
>
> so the corruption is **intermittent and correlated with tab closures**, never systematic. that is
> the harder shape to catch: a systematic offset gets noticed and subtracted, while an intermittent
> one reads as real movement on exactly the ticks a human was last at the keyboard.
>
> recorded here rather than silently patched, because the overstated version was on record for one
> tick and a reader who saw only that would have drawn a wrong conclusion about which figures to
> distrust.

proven from data already in hand, with no new read:

| tick | `sdk-aws-lambda apigateway/mechanic` | what actually happened |
|---|---|---|
| 19, pre-resize | `🧊 unchanged (60m)` | parked on its vision gate |
| 19, post-resize | `🌊 changed` | **verified byte-identical** — same frozen `Baked for 6m 7s` |
| 20 | `🧊 unchanged (15m)` | still parked; the clock restarted at tick 19's resize |

the clone has sat on `1.vision, judge, approved? 👋` for hours. the instrument reports 15 minutes.

**this caps `rule.require.nudge-parked-clones` at the tick interval.** that rule fires on a clone
that reads idle **and has been unchanged a while** — but a sweep every 15 minutes means no clone can
ever read idle for more than 15 minutes. the trigger the rule was written around cannot be observed
by the sweep that is supposed to observe it.

so one side effect voids two rules from opposite directions:

| rule | what it needs | what the resize does |
|---|---|---|
| `pause-babysit-cron-after-idle-streak` | six ticks with NO fleet change | fabricates a change every tick — streak never reaches six |
| `nudge-parked-clones` | a clone unchanged **a while** | resets the clock of any rewrapped window — "a while" restarts at each tab closure |

the first is starved of stillness; the second is starved of duration. **both starve on the same
meal**, and neither failure is visible in the verdict a reader sees.

that is the sharpest form this species has taken. the r58 rule — *do not let an instrument's side
effects touch its own subject* — was written about a teardown that reported its own work. here the
side effect touches a subject the instrument merely **watches**, and the damage lands not on the
report but on two rules downstream that read it. a reader who audits the poll finds it honest about
what it measures; the lie is in what a rule then infers from `N`.

the cure is unchanged and it is the same one: a width-normalized hash. until then, the two extra
words a supervisor owes are **"the clock is mine, not theirs"** — the idle figure after a resize is
the age of my own keystroke.

### a SECOND source of fabricated change — and the reorder cannot touch this one

2026-08-10, r83. `camp-grove/mechanic` read `🌊 changed` on a tick where it did no work. its verdict,
its board, and its ask were identical to two ticks prior. what differed sat in the harness's own
status bar:

```
tick A   🗿 5.3.verification, yield, blocked ✋        0% until auto-compact
tick B   🗿 5.3.verification, yield, blocked ✋        new task? /clear to save 148K tokens
         ⏵⏵ accept edits on (shift+tab to cycle)      0% until auto-compact
```

`148K` is a **counter**. it moves as the conversation grows, so the pane hash moves with it — and the
clone need do naught at all.

**this matters more than one miscount, because the reorder cure does not reach it.** r78 established
that MY resize fabricated the change, so a re-sequence of my own tick removed it. this source sits
inside the clone's own ui, on a clock i do not own and cannot sequence around. three clones on this
fleet sat near their context limits the same afternoon, so three of twenty-one had a live counter in
the very region the poll hashes.

so `rule.require.pause-babysit-cron-after-idle-streak` has a **second** independent way to never
reach six, and this one no supervisor discipline can close.

### ⚠️ i mis-stated the cause in the same breath i reported it

my tick report said the pane *"shifted (its yield file redrew)."* that was an inference, offered as
fact, and it was wrong — the yield body was identical; the status bar moved.

the check i owed is the one this file already carries, aimed at my own prose: **say the report's
content out loud in its own words.** `duct.poll` said *"these 40 lines differ from last tick's 40."*
it never said WHICH line, and it cannot. every word past that was mine.

**and the correction owes its own bound.** i read `--lines 12`; the poll hashes **40**. so what i can
honestly claim is *within the twelve lines i read, the delta was the status bar* — never *only the
status bar changed*. a correction stated wider than its evidence is the same defect a second time,
in the coat of a repair.

#### ⚠️ THIRD instance — 2026-08-26, and it stood ten ticks before the reader consulted this page

a supervisor verified one `🌊 changed` duct per tick, ten ticks in a row, with
`duct.read --lines 12` against a poll that hashes 40. its tick reports said, more than once:

> *"the clone's own output is **word-for-word identical** to last tick; only its acceptance suite's
> timer moved, `51s` → `15m 48s`."*

the first clause is a claim of identity **over the whole pane**, drawn from 12 of 40 lines. the
second names a CAUSE — which line differed — and `duct.poll` cannot report that at any line count.

worse, the duct in question carried a live `4% until auto-compact` counter, seen in its own pane two
ticks earlier. so the bytes that actually moved the hash may well have been the compaction counter,
in the 28 lines never read — the very mechanism this section documents, on the very duct it was
documented from.

**the verdict was sound and its stated reason was not.** *the clone took no turn* is provable from
the 12 lines read: its `●` prose was identical there. *only the suite timer moved* is not provable
from any read shorter than the hash window.

##### the cure this instance adds is MECHANICAL, where the two before it were disciplines

r83's cure was *bound your claim* — a discipline, which is exactly the kind of cure this file has
twice found insufficient. the cheaper one is a flag:

> **match the verify read to the poll's hash window.** the poll announces it in its own header
> (`duct.poll --role fleet --lines 40`), so `duct.read --lines 40` makes the two commensurable and
> the delta locatable. at any smaller count, the honest verdict is *the clone took no turn* and the
> honest cause is **unknown**.

that is one flag against three recorded instances across sixteen days, two of which produced a
mis-named cause stated as fact.

##### why the reader had not read this page

the supervisor had spent the prior two rounds in this very file — it paved `term=down` and
`term=at-work` beside it, and wrote r124's three-state table for `🌊 changed` INTO it. it then spent
ten ticks on `🌊 changed` verdicts without a search of the file it had just edited.

r124's own cure names this exactly: *a claim that names an INSTRUMENT owes a look at every other row
that names the same instrument.* the claim was made ten times and the look was taken once, at the
end, and only because a stop-hook forced a fresh round.

> **a file you recently WROTE feels like a file you have READ.** authorship is the strongest
> illusion of coverage there is — stronger than a stale memory, because the recency is real and only
> its scope is imagined.

### ⚠️ REPRODUCED on a second clone — and the mechanism was mis-named both times

2026-08-13. `sdk-aws-lambda/feat-apigateway-wire-response` read `🌊 changed` on a tick where it did no
work. the same shape, to the glyph:

```
tick A   🗿 route complete 🌴🤙                    2% until auto-compact
tick B   🗿 route complete 🌴🤙   new task? /clear to save 261K tokens
         ⏵⏵ accept edits on (shift+tab to cycle)  2% until auto-compact
```

the clone was **provably idle**: its body was word-for-word identical to a read two ticks prior, and
its elapsed marker was frozen at the same `✻ Cooked for 1m 4s`. a session that had taken a turn does
not carry the same elapsed — r78's tell, applied.

#### the correction — an APPEARANCE was named a TICK

r83 called `148K` a counter and wrote *"it moves as the conversation grows, so the pane hash moves
with it."* **neither instance observed it move.** in both, tick A carried no suggestion line at all
and tick B carried one, so the event was that line's **appearance** — a single one-way transition.
and in mine the clone was idle, so its conversation did not grow, so a counter had no cause to tick.

r83 named a mechanism it did not measure. the figure may well move on a busy clone; that is a claim
neither tick tested.

#### why the distinction is not cosmetic

the two shapes cost wildly unequal amounts, and r83's conclusion rests on the one it did not observe:

| the mechanism | what it costs the idle streak |
|---|---|
| a live **counter** | one fabricated `🌊` EVERY tick — the streak is structurally unreachable |
| a one-way **appearance** | ONE fabricated `🌊`, then never again for that clone |

r83 concluded that `rule.require.pause-babysit-cron-after-idle-streak` *"has a second independent way
to never reach six, and this one no supervisor discipline can close."* against an appearance that is
too strong: such a clone costs the streak one tick and then adds no more, so six consecutive stays
reachable, merely delayed.

**recorded, not repaired.** which shape it takes on a BUSY clone is unmeasured, and the read that
would settle it is two polls of one clone with the suggestion line already up.

## .the FOUNDING instance, reproduced two months on — and still unfixed

2026-08-10. i reached for a section of a glossary file and ran:

```
rhx grepsafe --pattern 'OPEN in one direction|weakest leg|unprompted' \
  --glob '.agent/repo=.this/role=any/briefs/domain.terms/term=substituted-criterion._.choice.reason.md'
→ matches: 0
```

the file exists — `globsafe` listed it in the same minute. so i ran the single-variable test the say
file prescribes, and varied the ONE argument most likely to be at fault:

```
rhx grepsafe --pattern 'substituted criterion' --glob 'term=substituted-criterion._.choice.reason.md'
→ 4 matches, in that exact file
```

**same tool, same file, same minute. a path-prefixed glob finds naught; a bare-filename glob finds
four.** that is row 1 of the say file's evidence table, unaltered, two months after this term was
paved on it.

three notes, and the third is the one that earns the entry:

1. **the defect was never repaired.** this file recorded it as a factory upgrade with no victim
   beyond the observer, and predicted such upgrades go unfixed. they did.
2. **the discipline worked, and it cost two commands.** the say file's cheap rule — *when a filtered
   read returns empty, re-run it UNFILTERED before you believe it* — fired on the first `matches: 0`
   and settled it before the empty answer was banked.
3. **i almost did not run it.** the `0` was a plausible answer: the section i sought might genuinely
   have been renamed. that is the species' whole danger restated — a broken filter and a true
   absence render the same bytes, so the check has to fire on the SHAPE of the answer rather than on
   any suspicion about it.

the third note sharpens the rule the say file carries. it is not *"re-run when the empty result
surprises you"* — surprise is a sensation, and none was present here. it is **re-run on EVERY empty
filtered result**, unconditionally, because the one case where no surprise arrives is the case the
filter has already fooled you into.

## ⚠️⚠️ .the FOUNDING instance is WITHDRAWN — 2026-08-12

the section directly above is a fourth reproduction of a case that **is not an instance of this
term**. the full argument lives in the say file (*the grepsafe half is NOT a false report*); the
short of it:

`--glob` is matched against the **basename**. every pattern that holds a `/` finds naught; every
pattern that does not, works — `--path .agent --glob '*.sh'` among them, which searches recursively
and was never tried across four reproductions. so `matches: 0` is a **true** statement about
basenames, it fails d2, and the case belongs to the reader-inference family, cause = **scope**.

two claims in the section above are refuted by that:

| the claim | the verdict |
|---|---|
| *"the defect was never repaired"* | there is no defect to repair. the flag has a narrower reach than its peers, and only its silence about the mismatch is at fault |
| *"a path-prefixed glob finds naught; a bare-filename glob finds four"* — offered as proof of a broken tool | correct as an observation, wrong as a diagnosis. both results are consistent with a basename-scoped flag, and that hypothesis was never tested |

what the section got RIGHT, and what is worth its keep: notes 2 and 3. the empty-filtered-read rule
fired, unprompted, and settled the read before it was banked. that rule is untouched by this
correction — it protects a reader from a narrow filter exactly as well as from a broken one.

### the pattern this makes visible

four reproductions, two months, one hypothesis, never once tested. each rerun returned the same two
results and each was scored as fresh corroboration.

> **a hypothesis that predicts your evidence is not thereby proven — only unrefuted.** the two
> commands run four times over could not part *"the tool is broken"* from *"the flag is narrow"*,
> because both hypotheses predict them exactly. the third command parts them, and no amount of the
> first two would ever have suggested it.

so the discipline the say file already carries — *vary ONE input on the SAME instrument* — needs its
own companion: **vary the input your hypothesis says does not matter.** the reruns varied the glob's
CONTENT, which the broken-tool hypothesis predicts; none varied its SHAPE, which only the narrow-flag
hypothesis cares about. a single-variable test aimed inside your own hypothesis confirms it forever.

## .a COMPOUND line does not share one fate — grade it clause by clause

2026-08-15, t33. `duct:///rhachet.beav.fix-machine-wide-reach-unlock/mechanic` polled:

```
🧊 unchanged (12m)   ❔ box UNKNOWN (remote — treat as ghost, do not submit)
```

the say file already carries that box-state row as evidence — *"two untruths in one line: the
locality and the box state."* the duct is **local** (`duct:///`, three slashes), and its box held a
live 3-option wisher-decision modal. a read of the pane settled both.

what this round adds is not the lie. it is **what to do with the rest of the line.**

### the question the evidence table never asks

a caught false report reads, at a glance, as a poisoned instrument — and a poisoned instrument is
one you no longer read at all. that instinct is wrong here, and expensively so: the
`🧊 unchanged (12m)` clause on that same line is what let me honestly withhold a re-surface on a gate
already surfaced (`rule.forbid.self-grant-human-gates` — once per state change). to discard it would
have cost the human a duplicate report, on the strength of a lie in a **different clause**.

### the test — name the MECHANISM behind each clause

the two clauses do not share a derivation, and that is the whole of it:

| the clause | how it is derived | steps that can fail |
|---|---|---|
| `🧊 unchanged (12m)` | a **content hash** of the pane, against the prior poll | one, and it is arithmetic |
| `box UNKNOWN (remote …)` | a **shape match** against pane chrome, PLUS an inference about locality | two, and the second is an inference |

so the clause that carries an inference is the clause that lied, and the clause that carries a
measurement held. that is not a coincidence — it is the same cut
`term=volunteered-diagnosis._.choice._.md` draws inside one clause (*"which half of this line did
the tool SEE?"*), applied one level out, between clauses.

> **a false report indicts the CLAUSE whose mechanism produced it, never the whole line. grade a
> compound report clause by clause, and name the derivation behind each.**

### ⚠️ the bound, and it is what keeps this from a loophole

this licenses you to still trust part of a line you have **caught in a lie**, which is precisely the
move a careless reader would reach for to save an inconvenient verdict. so it holds only where you
can name the two mechanisms **separately**:

- **separate derivations** → the clauses do not share fate. grade each
- **a shared derivation** → one lie indicts both, and no split is available

worked against the r78 case for contrast: there the `🌊 changed` verdict and the idle clock `(Nm)`
are BOTH read off the same content hash, so a rewrap that fabricated one fabricated the other. one
mechanism, one fate, no split. that is the case this section does not cover, and it is on record
above.

## .a ZERO that renders as ONE — and the countermeasure it makes structurally unreachable

2026-08-26. `rhx git.repo.get lines --words 'DOGFOOD PROBE'` over a live worktree returned:

```
   │  │ >    0:
   │  └─
   └─ found: 1 matches
```

no file header. line number `0`. a match block with an empty body. i could not read it, so i made
the one move the say file forbids in every other row: **i supplied an account of it and moved on** —
i said the match sat in a non-source artifact, the dogfood record `rule.require.clamp-edge-cases`
asks for, and not in live code.

there is no such artifact. there is no match at all.

### the adjudication — four commands, one variable

| query | true matches | reported |
|---|---|---|
| `DOGFOOD` | **3**, one file, real line numbers, real content | `found: 3 matches` ✅ |
| `DOGFOOD PROBE` | **0** — the superset above holds no line with `PROBE` | `found: 1 matches`, line `0`, no file ⛔ |
| `zzzznope zzzzalsonope` | **0** — a string that cannot exist | `found: 1 matches`, line `0`, no file ⛔ |
| `zzzznope` | **0** — the same string, ONE word | `found: 1 matches`, line `0`, no file ⛔ |

rows 1–2 **detect**: a subset cannot out-count its own superset, so one of the pair lies. rows 3–4
**adjudicate**, and they moved the cause twice — row 2 invited *"the space breaks it"*, and row 4
refuted that in a single command.

> **`git.repo.get lines --words` renders a genuine zero as `found: 1 matches`.**

### the discriminators

| | verdict |
|---|---|
| d1 — did the tool fail? | **no.** exit clean, ordinary tree format, its own header echoed back |
| d2 — is the content untrue? | **yes.** said out loud: *"one line in this tree matches."* none does |
| subject — an instrument that emits a measurement? | **yes** |

### it is the FOUNDING species, run backwards

this file's first species is *a filtered read that matches naught and says so calmly* — a `0` no
reader can part from a genuine absence. this is its exact inverse: **a genuine absence no reader can
part from a find.**

and the inversion is what makes it expensive, because this file's most-cited cure is written for the
first direction only:

> *when a filtered read returns empty, re-run it unfiltered. if THAT is non-empty, you have
> adjudicated.*

**that cure can never fire here.** the instrument does not return empty — it cannot. every zero
arrives dressed as a one, so the trigger condition of the cheapest countermeasure in this file is
unreachable on this instrument by construction.

that is the same shape `rule.require.pause-babysit-cron-after-idle-streak` carries in its own text: a
rule whose precondition the mechanism it governs can never satisfy. **a countermeasure with an
unreachable trigger reads as protection and guards naught.**

### the cure this instance adds — containment, where the extant one keys on emptiness

> **a subset query may never out-count its superset.** where a narrower pattern reports MORE matches
> than a broader one that contains it, one of the two is a false report — and the pair alone names
> which, because a superset that returns real files and real line numbers is corroborated by its own
> content, while a bare count is corroborated by naught.

it costs one extra command, it needs no prior knowledge of what the subject holds, and unlike the
known-present probe it works when you have no idea what the tree contains at all.

### the reader-side defect, which is the worse half

the instrument lied once. **i then made its lie durable.**

confronted with a report i could not read, three moves were available: hold it as unknown, probe it,
or explain it. i explained it — fluently, in the repo's own vocabulary, with a citation to a real
rule. the account was plausible enough to retire the question for two further ticks.

> **an unreadable report is not a settled report. and a plausible account of one is worse than no
> account, because it converts an open question into a closed one at no cost in evidence.**

the tell is specific, and it is checkable: **i named an artifact i had not opened.** every honest row
in this file cites a path, a line, a command. mine cited a *category* — "a non-source artifact" —
which is what an explanation sounds like when it has no subject beneath it.

so the check, and it is cheap: when you account for an anomaly, ask whether your account **names an
artifact you could open**. if it does not, you have not explained the anomaly — you have agreed to
end your search of it.

## .an instrument BLIND on one axis, where a lower layer's REFUSAL chose the blind spot

2026-09-03. `duct.poll` returned a verdict for every duct in the fleet, on time, with no error. for
all **11 grove ducts** that verdict was `❔unknown` — and for no local duct, ever. 11 of 11, no
exceptions.

`unknown` routes to *"treat as a ghost, do not submit"*, and it suppresses the stone line. so **no
cloud crew could report `🚧 PROMPT` and none rendered a route position.** a grove clone halted on a
live workspace-trust modal was invisible to the sweep; the human found it by eye.

### the discriminators

| | verdict |
|---|---|
| d1 — did the tool fail? | **no.** it polled 36 ducts, exit 0, every row rendered |
| d2 — is the content untrue? | **yes.** `unknown` claims the box state could not be determined. it could — the pane was read fine and never looked at |

⇒ a `false-report`, and in the same family as the sixth instance: **inside an instrument, and the
instrument is the one the babysit tick is built on.**

### what is NEW here — the exclusion was inherited, not chosen

every prior instance in this file has an author who made the call. this one does not:

```bash
# duct.poll.sh — the entire classifier
if [[ "$uri_host" == "" ]]; then          # ← the blind spot
```

that gate is not a judgment about groves. it is a **consequence** of a refusal one layer down:
`duct.read --raw` declined every remote uri, on the claim *"a remote raw read is unsupported."* the
classifier needs the escapes, so it could only ever run where it could get them.

so the poll's author never decided to exclude the cloud. **a lower layer's refusal decided it for
them**, and the gate reads as a local-optimization rather than as a scope. that is why it survived
review: no line at the poll's own layer looks wrong.

> **a refusal propagates upward as a silent scope.** the layer that refuses states its reason; the
> layer that inherits it states none at all, because it has none to state — it merely never runs.

⇒ and the refusal's stated reason was **false**. `capture-pane -p -e` is the same flag over ssh. the
only true half was the second — *"a plain fallback would hand you color-blind text while it claims
to be raw"* — which is a reason to keep the guarantee, never a reason to refuse the read.

### it is also a `partial-audit`, and the pairing is the lesson

mechanism 2: the harness chose the subject set, the verdict carried no trace of what it excluded,
and the reader was not positioned to notice. the render even **named** its own exclusion —
`❔ box UNKNOWN (remote — treat as ghost)` — and a reader took that as a statement about a host
rather than about a gap in coverage.

⇒ so the two terms met on one line: the audit was partial, and its report of that partiality was
what made the partiality look intended.

### the cure, and the cheap detector it yields

the fix went to the **refusal**, not the gate: the lib now owns both raw arms, and the poll's guard
became `[[ $rc -eq 0 ]]` — so `unknown` now means *the pane was not read*, which is checkable and
true. the render says `(pane unread)`.

the detector, and it costs one query: **when an instrument's verdict correlates perfectly with a
property of its SUBJECT rather than with its subject's state, that is a scope, not a finding.** 11
of 11 groves and 0 of 25 locals is not a fact about groves. no real-world property sorts that
cleanly.

## .a PLEA that was already ANSWERED — the proxy row's first field instance

the row was paved on the choice file 2026-09-03, from reason alone:

> | `git.crew.poll`'s `🙋 PLEA SEEN` | this pane's scrollback holds a grant command | **proxy** —
> a stand-in for "a grant is OWED", blind to one already granted |

it was met in the field the next day. **2026-09-04**, a babysit tick, the sweep raised a sixth plea:

```
🙋 PLEA SEEN — svc-jobs_beav_fix-queue-addressed-by-access/foreman printed a HUMAN-only
   grant command. read it, then relay — never self-grant
```

the drill-in found the command, and it had **already run, by a human, and succeeded**:

```
💥1 ➜ rhx route.stone.set --stone 1.v --as approved
🗿 route.stone.set
   ├─ stone = 1.vision
   └─ ✓ approved
```

⚠️ **the pane held the grant text twice and the grant once.** a first attempt died on
`BadRequestError: --stone is required`; the corrected run landed two seconds later. so the very
surface the detector keys on carried a doubled cue for a gate that was already shut.

### what makes it the proxy species rather than a miscount

the sweep's sentence is true, clause by clause: the pane **did** print a human-only grant command.
the false sentence is the reader's — *"a grant is owed here"* — and it is the one the render
invites, because `PLEA SEEN` seats the sixth in the same list as five that were genuinely owed.

⇒ **five true and one false, rendered identically, is the shape that costs the most.** the reader
gets no cue to drill into the sixth rather than relay all six, so the defect is paid for by a
human's attention on a gate they already closed.

### the cure, and it is one clause

the detector keys on the grant COMMAND. it must also require that the command was **not already
run** — and the pane answers that directly, since `route.stone.set` prints `✓ approved` on the
very next lines. key on the absence of that verdict beneath the command.

⇒ that closes the `+ not-already-run` arrears the term round carried, and it is cheap: the bytes
sit in the same capture the detector already reads.

## .a PLEA from a duct with NO LIVE CLONE — the same proxy, one layer deeper

**2026-09-04**, one tick after the row above, on
`rhachet-roles-bhrain.beav.fix-contemplation-gate-on-entrance/foreman`. the sweep rendered:

```
├─ 😶 crew: at work — foreman:empty mechanic:empty
│  🗿 foreman: route.stone.set
🙋 PLEA SEEN — …/foreman printed a HUMAN-only grant command
```

the raw read shows why every clause of that is wrong:

```
➜ claude --model haiku
╭─── Claude Code v2.1.87 ───╮   ← the session STARTED
…
Resume this session with:
claude --resume 7fd77cae-…    ← and then it ENDED
➜                              ← the pane sits at a SHELL prompt
```

**there is no clone at that keyboard.** the `route.stone.set` the detector saw is scrollback from
a session that has since exited, and the tree's own mechanic is alive and mid-review two levels
downstream — so the gate the plea names was passed long ago.

### the mechanism — a dead claude leaves its CHROME behind

this is not the last-settled-transition defect. it is one layer beneath it:

| what the pane holds | what the classifier reads it as |
|---|---|
| a live claude, no text typed | `empty` ✅ |
| a bare shell, no claude ever | `shell` ✅ |
| **a bare shell, with a dead claude's `❯` + separator rules still in scrollback** | 🔴 `empty` |

⇒ **`empty` conflates "a live box, unfilled" with "a corpse's box, still drawn."** the poll proved
it can tell a shell from a claude — it printed `shell` for four other foremen on this same sweep.
it failed *here* because the chrome was present and the prompt below it was not weighed.

and the consequence chain runs the full length: box misread `empty` → the crew renders `at work`
→ a stone renders for a role that cannot advance one → the stone line is scrollback → a human is
asked to grant a gate on a tree with no clone to receive the grant.

### the discriminator, and it is a suffix test

> **does the pane's LAST line belong to claude, or to the shell?**

a live claude's final rows are its input box and its status line. a dead one's final row is a
shell prompt — `➜`, `$`, `%` — *below* the leftover chrome. **position settles it: the newest
line wins, and the chrome is older than the prompt.**

⇒ the same cure shape as the row above, and the same reason it is cheap: the bytes are already in
the capture. the classifier reads the pane bottom-up for the box; it must read one line further.

### why this one outranks the row above it

the `already answered` case wastes a human's glance. **this one addresses a request to a duct that
cannot answer** — so a grant relayed here is not merely redundant, it lands nowhere and the tree
looks granted-and-stalled forever after. and it takes the crew's `💀 down` signal offline in the
same stroke: a dead foreman renders `at work`, so `git.crew.boot` is never prompted, and
`rule.require.tree-del-before-duct-close` has no foreman to fell the tree at close.

## 🔴 .the FOURTH proxy row — a stophook that cannot tell a CORRECT stop from a failed one

⚠️ **this title is a correction.** it first read *"a stophook that counts the WRONG PANE'S
stops"* — named from a single instance, five ticks before a second arrived and showed it too
narrow. the second instance is on the **right** pane. the shared root sits one layer up:

> **the counter measures how many times a pane STOPPED. it holds no notion of whether the stop
> was correct.**

⇒ and the miss is instructive beyond this row: `rule.require.enumerate-before-you-name` warns
that a word tested on one instance cannot be shown too narrow, and the too-narrow failure *feels
like precision*. this title was written the same day that rule was cited, by the author who cited
it. **the rule does not fire on its own; you have to run it.**

### instance A — the WRONG pane, tick 32

**2026-09-04**, babysit tick 32, `rhachet-roles-bhrain.beav.fix-contemplation-gate-on-entrance`.
the **foreman** — deliberately held, told not to drive — rendered:

```
Stop hook error: route.drive 💥 failed with an error
stuck on stone 5.1.execution.from_vision after 23 attempts.
please tell a human what you saw, where you got stuck, and what you tried.
```

the stone was **not stuck.** the mechanic on that tree was live on it and advanced `i001 → i002`
in the very window the count climbed.

### the mechanism — a per-pane counter over a per-branch subject

a route binds to a **branch**, and every pane on that branch inherits its stophook. so the hook
fires on each pane and increments one shared counter, while what it names — *attempts at this
stone* — belongs to whichever pane is **actually the driver**.

| what the hook measures | what its sentence claims |
|---|---|
| this PANE stopped, 23 times, and the stone did not move | the STONE is stuck after 23 attempts |

⇒ the first is true of the measurement and the second is false of the world. **a held pane is
indistinguishable from a stalled driver, to a counter that cannot see which pane drives.**

### 🔴 why this row is the most expensive of the four

the three prior proxies each cost a **reader** — a stale surface, a wasted glance, a grant that
lands nowhere. this one differs in kind:

> **it instructs the clone to escalate.** *"please tell a human what you saw"* is a false report
> that **manufactures its own relay** — it recruits the clone as courier of a defect that does not
> exist, and aims it at the scarcest resource in the loop.

and it **feeds itself**: the more obediently a pane holds, the more it stops, so the count climbs
precisely because the clone behaves correctly. **a compliant clone looks worse each tick.**

### 🔴 instance B — the RIGHT pane, correctly halted, tick 37

**2026-09-04**, babysit tick 37, `rhachet.beav.fix-node-pty-install/mechanic`. this pane **is**
the driver, so instance A's mechanism does not apply at all — and the report is still false:

```
stuck on stone 5.1.execution.from_vision after 37 attempts.
please tell a human what you saw, where you got stuck, and what you tried.
```

the clone is halted on `keyrack unlock --owner ehmpath --env test`, which needs an **AWS SSO
browser round trip** — a human-only gate it cannot pass by any means. it had already surfaced
that, correctly, **37 turns earlier.**

| | instance A | instance B |
|---|---|---|
| is this pane the driver? | ⛔ no | ✅ yes |
| is the stone advancing? | ✅ yes, elsewhere | ⛔ no, and rightly so |
| is the halt correct? | ✅ | ✅ |
| does the hook say so? | ⛔ | ⛔ |

⇒ **the two rows agree on the only column that matters.** a correct halt and a failed drive
produce the identical observable — a pane that stops — so a counter over stops reports them the
same. instance A merely made that visible by also getting the pane wrong.

### what it costs, and it is not merely noise

instance B had burned **37 turns** on a nag it could not act on, each turn a slice of a context
window. on this very day a clone died in a reactive compact at 0% headroom, so context is not an
abstract budget — **the nag consumes the exact resource whose exhaustion kills clones.**

⇒ the cure is at the hook, never at the clone. two repairs, and the second is the load-bearer:

1. fire only on the pane that holds the route's drive, or name the pane inside the claim
2. 🔴 **distinguish a HALT from a STALL** — a clone parked on a declared human-only gate has
   stopped correctly, and the hook must say *"awaits a human"* rather than *"stuck, tell a human"*

both clones were told to ignore it. that is a patch on the reader, twice, and the instrument is
unrepaired.

## .see also

- `term=false-report._.choice._.md` — the choice itself
- `term=volunteered-diagnosis._.choice._.md` — the same measurement-vs-inference cut, drawn WITHIN
  a clause rather than between them
- `term=factory-upgrade._.choice.reason.md` — several rows in its evidence table are false
  reports; the two terms are orthogonal (one names the record, the other the defect's kind)
- `rule.require.trust-but-verify` (mechanic) — the rule this extends from claims to instruments

---

written by human + beaver 🦫
