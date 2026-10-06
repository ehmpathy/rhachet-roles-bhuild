# domain.term: false report

term.chosen   = false report
term.kind     = noun
term.synonyms.forbidden:
- false negative
- false zero
- silent failure
- flake
- stale output

## .what

a report an instrument emits **in its normal success shape, with full confidence**, whose
content is wrong.

the mark that separates it from every `fail*` case: **no failure occurred.** the tool did not
halt, did not throw, did not swallow an error. it ran, succeeded, and told you something untrue
in the exact format it uses when it is right.

## .why it needs its own word

a supervisor's whole job is to read instruments. every judgment it makes is downstream of a
report it did not personally verify. so the failure mode that costs the most is not a tool that
breaks — a broken tool announces itself — but a tool that **stays confident and goes wrong**.

the `fail*` family cannot name this, because every member of it presumes a failure to route:

| term | what happened | who can notice |
|------|---------------|----------------|
| `failfast` | error, halts | everyone |
| `failloud` | error, reported with a fix | everyone |
| `failhide` | error, swallowed | nobody, until later |
| `fail-open` | error, published and disregarded | anyone who reads the noise |
| **false report** | **no error at all** | **nobody — it looks like an answer** |

### but they are not RIVALS — `failhide` MANUFACTURES this

that table reads as five exclusive buckets, which is right for classification and wrong for
causation. `failhide` and false report sit at **different levels**, and they compose:

- **`failhide`** names what the CODE did — it swallowed an error
- **false report** names what the OUTPUT is — a confident, success-shaped, untrue statement

so a swallowed inner failure is one of the ways a false report gets MADE. the discriminators
still hold, because they ask about **the instrument in your hand**, never about its
internals:

```
crew.hide → term.stop  (FAILS, rc≠0)
         → `|| true`   (swallows it — this is the failhide)
         → prints "out of sight, still on the job", exits 0
```

d1 on `crew.hide`: did *it* fail? no — exit 0, ordinary format. d2: is the content untrue?
yes — the tabs never closed. subject: an instrument that emits a report? yes. so it IS a
false report, **and** its cause is a failhide one layer in.

**the rule that keeps them straight:** the discriminators are scoped to the instrument you
invoked, never to the whole call stack. an inner failure is part of that instrument's
implementation, not part of its report. ask *"did THIS tool fail?"* — never *"did some tool
somewhere fail?"*

**the payoff:** when you find a false report in code you own, **look for a swallowed error
first**. it is the most common manufacturer and the cheapest to find — grep the path for
`|| true`, a bare catch, or a discarded `$?`.

evidenced 2026-08-09: `crew.hide` ended its `term.stop` call with `|| true` and reported
success over a window still on the human's screen. the swallow was written by the same party
that had paved this term four rounds earlier — which is the point. to know the term is no
protection against a fresh one.

## .the shape

a false report has three parts, and the third is what makes it dangerous:

1. the instrument runs to completion, exit 0
2. it emits its ordinary success format
3. **its content is indistinguishable from a true report of the same shape**

`matches: 0` from a broken glob and `matches: 0` from a genuine absence are the same bytes.
that is why no operator is positioned to catch it in flight.

## .the evidenced instances

| instrument | the confident report | the truth |
|------------|---------------------|-----------|
| ~~`rhx grepsafe --glob 'dir/**/*.md'`~~ | ~~`matches: 0`~~ | ⚠️ **WITHDRAWN 2026-08-12** — `--glob` is basename-scoped, so `zero matched` is TRUE. fails d2; it is the reader-inference family, cause = scope. see *the grepsafe half is NOT a false report* below |
| `rhx duct.poll` (pre-fix) | `⌨️ box empty` | a permission modal was up; the cursor-glyph check read the box below it |
| `rhx duct.list` | `💥 malfunction` | the tree was felled on purpose; the registry row went stale |
| `rhx duct.send` | `✔ submitted` | the message was stranded unsent under load |
| ~~`rhx duct.poll` (spinner hash)~~ | ~~`🌊 changed`~~ | ⚠️ **WITHDRAWN 2026-08-26** — `changed` says the pane BYTES differ, and they did. fails d2; reader-inference family, cause = **proxy** — which this very file already records, in its own causes table below. the second instance of row 1's defect, and the first caught by a self-contradiction rather than by fresh evidence |
| `rhx duct.poll` (box state) | `❔ box UNKNOWN (remote — treat as ghost)` | the duct was **local** (`duct:///`), and a permission modal was up with three options. two untruths in one line: the locality and the box state |
| a **peer reviewer** (`review.peer`) | a blocker that cites a real file, a real line, and a quoted snippet | the snippet was never read from the file. it came from a PRIOR round's `.given.by_peer` report, which the review scope feeds back as a `ref`; the code at that path had since moved |
| `rhx keyrack status` | `expires in: 0m` | the key has **no expiry at all**. `ttlLeftMs: Infinity` crossed a json socket as `null`, and `Math.round(null / 1000 / 60)` is `0` — byte-identical to a genuinely expired key |
| `rhx duct.list --on 'duct:///<tree>*'` | `📡 (this machine)` / `└─ (none)` | both rows were present. a bare `duct.list` listed them plainly, and their json files sat on disk at `~/.ductwork/ducts/<tree>/` |
| `hasTmuxServer` — a predicate **i wrote that same hour** | `false` — no server answers on this socket | a LIVE tmux server, with sessions and pane children. my own teardown had unlinked its socket one line earlier, and tmux reaches a server THROUGH that path — so the verdict "down" was made true by the party who asked |
| a **green clamp** — `[case10] NOT ONE survives its own teardown` ✓ | no litter | 43 socket files in a shared `/tmp`, across six runs. the clamp checked the socket FILE, which tmux unlinks EARLY in shutdown — so the file went absent while the server ran on |
| `rhx duct.poll --brief` (box text) | `"and then dispatch a redteam for 'invasion', and dispatch a re"` | the box held a LONGER, complete line — `…and dispatch a redteam for 'exploit'`. the display clips at ~60 chars and prints the prefix **in quotes, with no ellipsis**, so a partial reads as the whole |
| `rhx git.repo.get lines --words <absent>` | `found: 1 matches` | **zero** matches. EVERY empty result renders as one phantom row, at line `0` of no file — proven by a subset/superset pair plus a string that cannot exist. it is the FIRST species run backwards, and it makes this file's most-cited cure (*"when a filtered read returns empty…"*) **unreachable by construction** — the instrument never returns empty |
| `rhx duct.list --on 'duct:///<tree>/*'` — **the form this file's own GUARD recommends** | `📡 (this machine)` / `└─ (none)` | two live ducts, listed plainly by a bare `duct.list` in the same minute. row 9's guard blocks the partial `<tree>*` and names this exact species in its own error text — then hands the caller a whole-segment form that fails identically. the paved path leads into the pit |
| `rhx git.crew.poll --live --boxes` | `mechanic:❔unknown` — the verdict reserved for a box that could not be read | the box was **`empty`**, and `duct.poll` had said so plainly one line up. **nobody had touched `git.crew.poll`.** i changed a NEIGHBOUR's render — `empty` grew a second line to carry the route stone — and a skill i never opened began to lie |
| `rhx git.crew.poll --live --boxes` | `mechanic:🚧prompt` — *"STALLED, awaits a decision"*, the verdict whose paved move is a `--keys` | a 5-option **design council**, put to the HUMAN. one keystroke on that verdict renders a wisher decision in their name, unrecoverably. the discriminator that admitted it was `Esc to cancel` — chrome the detector's OWN comment, two lines above, declares shared by every modal of either kind |
| a **PreToolUse shell classifier** — a GUARDRAIL, not a read tool | four separate rules, each a refusal: `process substitution >()`, `Zsh process substitution =()`, `ANSI-C quotes`, `shell metacharacters (;, \|, &)` | the command holds **none of them**. the bytes sit inside a quoted `node -e` string or a quoted regex, where they are JS or a pattern: `=>({b:a.b+r.bold})`, `walk=(d,o)=>`, `'overrule the malfunction$'` (a regex end-anchor, never `$'…'`), `const l=…;` (a statement separator, never a shell `;`). it matched **lexically** and asserted **syntactically**. ~12 reproductions across three crews in one day, each one a supervisor round-trip |
| ~~`rhx git.repo.get lines --words 'a\|b'`~~ | ~~`found: 0 matches`~~ | ⚠️ **REFUSED 2026-09-07** — `--words` matches a **literal** run of characters, so *"zero lines hold `a\|b`"* is TRUE. fails d2; reader-inference family, cause = **scope**, taught by a peer. see *the peer that teaches a scope can be the ALLOWLIST* below |

the classifier row is the second instrument here that is not a read, and the first that is a
**guardrail**. its false report does not mislead a reader — it **refuses a safe act**, so the cost
lands as friction rather than as a wrong belief. that inverts the usual remedy: a read tool's
false report is cured by a better read, and a guardrail's by a narrower rule. ⚠️ and it is the one
species an operator cannot route around without defeat of the guard itself, which is why the
paved answer is a supervisor approval rather than a bypass.

🔴 **but FOUR rules of that one classifier misfire the same way, so "a narrower rule" is the wrong
shape of fix.** each rule scans the raw command bytes, and each is defeated by the identical
case — a token that lives inside a quoted argument the shell never parses. to narrow them one at
a time treats four symptoms of one defect, and the fifth rule will land with the same flaw.

⇒ the cure is at the layer beneath every rule: **parse the shell-visible portion first, then let
the rules scan THAT.** which is this term's own general lesson turned on a guardrail — an
instrument that narrows its subject set and then reports on the whole is what a false report IS,
and here the narrowed set is *"bytes"* where the true one is *"tokens the shell will act on"*.

the reviewer row is the first instrument here that is not a tool. a reviewer emits a **judgment**
rather than a measurement, and a driver's whole convergence loop sits downstream of it — so a
false report from a reviewer costs a fix applied to code that does not exist.

the keyrack row is the first instance here proven by **injection** rather than by a second
instrument. its author reverted the repaired renderer and re-ran the clamp: the harness printed
the literal `expires in: 0m` in its received array, 2 red against the other six cases green.
that is a clamp with teeth (`rule.require.clamp-edge-cases`), and it is a **stronger** proof
than agreement between two tools — a second instrument only detects that one side lies, while a
revert names WHICH.

it also demonstrates the countermeasure section's claim about cost. `0m` reads exactly like an
ordinary expired key, so an operator re-unlocks and never learns why. `NaN` would have looked
broken and been chased. **the most expensive wrong answer is the one shaped like a right one** —
and here the shape was manufactured by a type that both sides declared and neither side linked.

### a SPECIES with teeth in its own guidance: a clip that does not say it clipped

the newest row is small and it earns a section, because the instrument does two things in one
block and the second undoes the first:

```
✍️  PREFILLED — a human typed this, unsent
   ├─ "and then dispatch a redteam for 'invasion', and dispatch a re"
   └─ relay ONLY if complete + steady across 2 polls
```

line 2 clips at ~60 chars and prints the prefix **in quotation marks, with no ellipsis and no
marker**. line 3 then asks the reader to judge **completeness** — from the very string line 2
clipped.

so the one judgment the block demands is the one judgment its own display makes impossible.

run the discriminators and it clears all three bounds:

| | |
|---|---|
| d1 — did the tool fail? | **no.** the poll ran clean |
| d2 — is the content untrue? | **yes.** said out loud: *"a human typed this: <string>"* — they did not; they typed a longer one. the quotes assert exact content |
| subject — an instrument that emits a measurement? | **yes** |

**an ellipsis would have made it true.** `"…and dispatch a re…"` says *here is a prefix*, and that
sentence is sound. bare quotes say *here is the content*, and that sentence is false. one glyph is
the whole difference between a measurement and a false report.

### how it was caught, and why that is not a defense

i ran `duct.read --raw` on that duct and saw the full line. but i ran it to check
**prefilled-vs-ghost** (`rule.require.distinguish-prefilled-from-suggested`) — a different
question entirely. the completeness answer arrived as a **side effect of a check aimed elsewhere.**

and before that read, i had already formed the wrong conclusion: *"that is truncated, cut off
mid-word, so the human is mid-type."* the human WAS mid-edit — the cursor sat at char 28 — but not
for the reason i gave. i was right by accident about the person and wrong about the string.

this is the r80 lesson inverted. there, a check i ran on purpose corroborated naught on the
question that mattered. here, a check i ran for another purpose happened to answer the question
that mattered. **both are luck.** the discipline is the same in each direction: name the question a
check answers, and name it before you read its output.

### the first SPECIES: a glob filter that matches naught and says so calmly

the table's first row and its newest row are the same defect in two unrelated tools, two months
apart:

| tool | the filter | the confident answer |
|---|---|---|
| `rhx grepsafe` | `--glob 'dir/**/*.md'` | `matches: 0` |
| `rhx duct.list` | `--on 'duct:///<tree>*'` | `(none)` |

both took a pattern, matched naught, and reported the empty result in the same words they use
when the set is genuinely empty. neither warned that the pattern itself might be at fault.

that is the species' mark: **a filtered read cannot tell "your filter is wrong" apart from
"there is naught to find", and it always renders the second.** a filter is the one argument a
caller is most likely to get wrong and least able to check, and every filtered read hands back
a shape that hides the error.

so it earns a rule of its own, cheaper than the general countermeasure: **when a filtered read
returns empty, re-run it UNFILTERED before you believe it.** that is a single-variable test on
the same instrument, and it costs one command. it is what settled the second instance in under a
minute, after the first answer had nearly been banked as a conclusion.

#### ⚠️ the re-run adjudicates only when it comes back NON-empty

this section formerly called the unfiltered re-run *"the one move that adjudicates rather than
merely detects."* that is true of both evidenced instances above, and it is **false in general** —
r85 hit the case it does not cover.

a path-prefixed glob returned `matches: 0`. the bare-filename re-run returned `matches: 0` too.
at that point two hypotheses stand and the rule as written cannot part them:

| hypothesis | what the double zero looks like |
|---|---|
| the string is genuinely absent | `0`, then `0` |
| the filter is broken in BOTH forms | `0`, then `0` |

so a re-run that also returns empty **detects naught**. it feels like corroboration and it is two
readings of one unanswered question.

what settled it was a **positive control** — grep the SAME glob for a string i was certain the
file held. 16 matches, so the glob reaches the file, so the `0` is genuine.

#### ⚠️⚠️ the grepsafe half is NOT a false report — corrected 2026-08-12, and it is the FOUNDING row

r7 paved this term on `grepsafe --glob 'dir/**/*.md' → matches: 0`. that row sits first in the
evidence table and it seeded this whole species. **it fails discriminator 2, and it always did.**

the true mechanism, established by a four-row single-variable sweep on one string genuinely present
at `.agent/repo=.this/role=any/skills/work/ductwork.sh`:

| invocation | result |
|---|---|
| `--glob '.agent/**/*.sh'` | `matches: 0` |
| `--glob '**/*.sh'` + `--path .agent` | `matches: 0` |
| `--glob '*.sh'` + `--path .agent` | ✅ matches, recursive |
| `--glob 'ductwork.sh'` | ✅ matches |

every pattern that holds a `/` finds naught; every pattern that does not, works. so **`--glob` is
matched against the BASENAME**. it is not broken. it has a narrower reach than the reader assumed.

now run the say file's own procedure — *say the report's content out loud in its own words*:

> *"with the glob `.agent/**/*.sh`, zero files matched."*

**that sentence is true.** no basename matches a pattern that holds a slash. the false sentence —
*"the string appears nowhere under `.agent/`"* — is the READER's paraphrase, never the tool's.

| | verdict |
|---|---|
| d1 — did the tool fail? | no |
| d2 — is the content untrue? | **no** |
| so it is | the **reader-inference** family, cause = **scope** |

#### the sub-cause it adds: a scope learned from a PEER, not from the instrument

the r40 rule reads *"when a true report misleads, ask whether the instrument's NAME over-promised
its scope."* here the name did not. `--help` says `--glob GLOB (e.g., '*.ts')` — basename-shaped,
and accurate.

**its PEERS over-promised on its behalf.** `globsafe --pattern 'src/**/*.ts'`, `sedreplace --glob
'src/**/*.ts'`, and `git.repo.get --paths 'src/index.ts'` are all path-shaped and documented so. a
caller arrives at grepsafe with a mental model three tools taught them, and one flag name shared
across four skills carries two different grammars.

so the r40 question needs a second half: **ask not only whether THIS instrument's name over-promised
its scope, but whether a PEER that shares its vocabulary did.** a reader does not read a help text
per call; they read one grammar and reuse it. an inconsistent grammar is an over-promise with no
single author to indict.

##### ⚠️ the strongest peer pressure is a CURATED TABLE — and it can list a DELEGATE as a peer

the grepsafe case's peers were incidental — four skills that happened to share a flag name. a
**table of instruments** is the same pressure, deliberate and far stronger: a reader who consults a
`| want | call |` table does not infer a grammar, they obey a recommendation.

evidenced 2026-09-01. `rule.require.bulk-over-byhand`'s own instruments table carried:

| want | call |
|---|---|
| the whole fleet: crews + trees + prs | `rhx git.crew.poll` |
| **every duct's box + change verdict** | **`rhx duct.poll --brief`** |

both rows are TRUE of their instrument. and `git.crew.poll` **calls** `duct.poll` — so they are not
peers, they are an instrument and its own **delegate**, listed side by side as though a caller
should choose. a supervisor that took row 2 got a duct-scoped read of a crew-scoped question, and
the output carried no trace of the three halves it could not see.

> **a table that lists an instrument beside its own delegate teaches a scope error the way a
> recommendation teaches — with authority, and with no help text to correct it.** the delegate's
> row is true, its reader is diligent, and the read is a `partial audit` regardless.

the tell is structural rather than semantic, so it costs no judgment: **for each pair of rows, ask
whether one call INVOKES the other.** where it does, the inner one is not a peer and does not
belong on the table — a caller reaches for the outer one, always.

this is the sharpest instance on record because the table sat inside the rule **whose whole subject
is partial audits**. a rule can enumerate a cure and recommend the disease in one file, and neither
half looks wrong on its own.

##### 🔴 the peer that teaches a scope can be the ALLOWLIST — 2026-09-07

the grepsafe case's peers were **incidental** (a shared flag name). the `bulk-over-byhand` case's
were **curated** (a doc table a reader consults). this instance is a third rung above both: the
peer is the **permission allowlist**, which the harness prints to the agent on every block.

```
✅  rhx grepsafe        --pattern 'foo|bar'          ← alternation, allowlisted
✅  rhx grepsafe        --pattern '(ERROR|WARN):'    ← alternation, allowlisted
    rhx git.repo.get lines … --words 'DomainEntity'  ← one term. no alternation shown, ever
```

two skills, one list, opposite grammars, and no line anywhere says they differ. measured:

| call | result |
|---|---|
| `--words 'grove'` | **668 matches** |
| `--words 'grove\|zzznomatch'` | **0 matches**, exit 0, `🐢 crickets...` |
| `--words 'gr.ve'` | **0 matches** — `.` is literal too |
| `--words 'grove' --paths 'src/grove.pkg.sh'` | **17 matches** ← positive control; the filter reaches |

⇒ **a superset returned fewer results than its subset**, which is arithmetically impossible for a
search and is the one tell available without a help read.

**why this rung is worse than a curated table.** a doc table is advice a reader may weigh. the
allowlist is *enforcement* — it is the list a blocked agent is told to obey, so its examples read
as the sanctioned forms rather than as illustrations. an agent that generalizes from it is doing
exactly what the block instructs, and the generalization is unsound.

> **an allowlist is a security artifact that doubles as a tutorial, and nobody writes it as one.**
> its examples are chosen to be *safe*, never to be *representative* — so the grammar a reader
> infers from it is an accident of what somebody happened to approve.

⚠️ **and this file's own cure did not fire, because the shape hides it.** the paved move is *"when
a filtered read returns empty, re-run it unfiltered."* the filter here is not `--paths` — it is the
**search term**, which no reader reads as a filter. one word of the term IS the unfiltered re-run,
and it does not present as one.

⇒ so the cure needs its subject widened: **the search term is a filter.** drop a clause from it
before you believe a zero, exactly as you would drop a `--glob`.

###### ⚠️ the phantom-row REPAIR is what made this one silent

row 100 records this same instrument rendering **`found: 1 matches`** for a genuinely absent
string. that is repaired — an absent string now returns an honest `found: 0 matches`, verified
2026-09-07 — and row 100's *"unreachable by construction"* clause no longer holds.

**the repair is correct, and it converted a loud defect into a quiet one.** under the old render, a
literal-match zero would have surfaced as `1 matches` at line `0` of no file: visibly broken, and
chased. under the honest render it surfaces as a clean `0` — the exact shape of a true absence.

> **a repair that makes an instrument honest on one axis can make a DIFFERENT defect on the same
> instrument harder to catch.** the loud wrong answer was doing unearned work as a general alarm,
> and no one costed it before it was removed.

⇒ this is not an argument against the repair. it is an argument that **a fix to a render changes
the detectability of every other defect that render carried**, and that consequence belongs in the
fix's own verification.

#### what survives the correction, and what does not

| | verdict |
|---|---|
| the SPECIES (a filtered read cannot part "wrong filter" from "naught to find") | **intact** — and now sharper: the filter need not be *wrong*, merely narrower than the question |
| the RULE (re-run unfiltered; if still empty, probe with a known-present string) | **intact** — and it is what caught this correction, twice, unprompted |
| the `duct.list --on` row | **untouched** — that pattern's rows genuinely should have matched, so its report is untrue on its face; a separate case, judged separately |
| row 1's classification as a `false report` | **withdrawn** |

#### the cost, stated plainly

this claim stood **two months and ~85 rounds**, as the first row of a 15-row table, cited into a
factory-upgrade record, and reproduced three separate times. each reproduction re-confirmed the
SYMPTOM; not one re-derived the CAUSE. every one ran the same two commands the original ran, and
none ran the third (`--path` + a basename glob) that parts a broken filter from a narrow one.

> **a reproduction is not a diagnosis.** to re-observe a symptom on demand feels like mastery of it,
> and it is the state most likely to freeze a first guess into a fact — because each rerun returns
> the same bytes, and the same bytes read as confirmation.

what finally broke it was neither care nor suspicion. it was an errand: a **seed** owed to another
repo, and `rule.forbid.prescribe-how-on-dispatch` demands verified facts rather than a symptom
report. the duty to write the defect down FOR A STRANGER is what forced the fourth command.

**the transferable lesson: a claim you must hand to someone else gets checked harder than one you
merely hold.** so when a claim has stood a long while unexamined, the cheapest audit is to draft it
as though a stranger will act on it.

> **the rule, in full: when a filtered read returns empty, re-run it unfiltered. if THAT is
> non-empty, you have adjudicated. if it is empty too, probe the same filter with a string you
> KNOW is there — a filter that finds the known string is a filter you can trust the zero from.**

the second step is the detect/adjudicate distinction this file already draws, aimed one layer in
at the filter itself. and it is the cheaper half to skip, because a second zero reads as the
first zero confirmed.

#### ✅ the second step FIRED — 2026-08-28, and the guard sent me into the defect

the rule above was paved in r85 and had never once been the move that caught a live case. on
2026-08-28 it was, and the case is worth the section because the trap was **paved by the cure**.

`duct.list --on 'duct:///<tree>*'` — the partial form of row 9 — is now **guarded**, and the guard
is excellent. it blocks the call and names this exact species in its own error text:

> *"a partial one ('<tre>*') matches naught, and would report '(none)' — indistinguishable from a
> machine that truly holds no such duct"*

that is row 9's lesson, landed as a constraint. it then offers the cure: *"a '*' is allowed only as
a whole segment: `duct:///<tree>/*`"*.

**the recommended form fails identically.** i ran it against the tree i had just felled, got
`(none)`, and it was exactly the answer i wanted. one command from banked.

what caught it was step 2, run for its own sake: probe the SAME filter with a subject you know is
there. `--on 'duct:///rhachet.beav.fix-node-pty-install/*'` — two live ducts, confirmed by
`crew.poll` and a bare `duct.list` in the same minute — also returned `(none)`. so the filter finds
naught, ever, and both zeros were the instrument rather than the fleet.

⚠️ **note what the unfiltered re-run alone would have bought: naught.** a bare `duct.list` after the
fell genuinely does lack those rows, so step 1 CORROBORATES a broken filter here. that is the r85
caveat realized — the step that adjudicates is the one that costs a second thought, and it is the
one a satisfied reader skips.

##### the shape it adds: a GUARD whose cure carries the defect it names

| the layer | verdict |
|---|---|
| the guard's diagnosis | ✅ correct, and precisely stated |
| the guard's cure | ⛔ commits the identical defect |

so a caller who obeys the guard lands in the pit the guard exists to fence. and they land there
**with more confidence than before**, because a tool that just corrected them reads as a tool that
knows this surface.

> **a guard proves its author understood the defect. it proves naught about the cure it names.**
> price the recommendation exactly as you would price any other report — the diagnosis and the
> remedy are two claims, and only the first one is what the guard demonstrates.

this is `partial audit`'s green-check cure aimed at a constraint rather than at a suite: *a check
that could not have gone red on the defect is not evidence about the defect.* the guard could not
go red on its own suggestion.

##### ⚠️ the second instance is a HINT, not a guard — and a hint is worse

2026-08-31. `duct.poll` finished a clean sweep and closed with an unprompted footer:

```
🛟 a ⏳ duct is likely a hibernated remote grove
   └─ skip remote entirely with: rhx duct.poll --local
```

that suggestion is a **blocker** under `rule.require.babysit-cron-per-dispatch-fleet`, which grades
*"a tick pinned to `--local`"* a blind spot the fleet default exists to close — and names it as one
of two shortcuts that *"quietly became the default."*

i had taken it, one tick earlier, and caught it only on the write-up.

the mechanism deserves a line, because it is not carelessness: **i did not invent the shortcut. the
instrument handed it to me, at the exact moment of the friction it names.** a hint that fires while
you are mildly annoyed is a hint you accept.

| | a GUARD | a HINT |
|---|---|---|
| when it fires | after a refusal — the call FAILED | on the ordinary success path |
| the reader's state | already corrected, already alert | at ease, over a clean report |
| how the cure is priced | as a remedy, so at least it is priced | **as a courtesy, so not at all** |

so the guard case is the milder one. a guard has at least announced a fault, which primes a reader to
think. a hint arrives while all is well, in the tool's own voice, and asks for no thought at all —
which is why it is taken without one.

> **a tool's suggestion is a CLAIM about what you should do, and it is subject to rules the tool does
> not know.** an instrument sees its own surface; it cannot see the contract its caller lives under.
> price a hint against your own rules before you take it — the tool is not a party to them.

the tell is cheap and it costs no read: **a suggestion that makes an annoyance go away is the one to
check.** every shortcut this repo has had to forbid — `--local`, `--role mechanic`, a narrowed
`--paths`, a raised `--allow-nitpicks` — began as relief from a friction that did its job.

### the newest SPECIES: a proxy the OBSERVER broke

the two 2026-08-09 rows share a shape no prior row has, and it is the worst one yet: **the
instrument's own side effect manufactured the answer it then gave.**

| | the proxy | who broke it |
|---|---|---|
| `hasTmuxServer` | socket reachability, as a stand-in for server liveness | **the teardown that called it** — it unlinked the socket one line above |
| `[case10]` | the socket FILE, as a stand-in for a felled server | **tmux itself** — it unlinks early in shutdown, long before the process exits |

so this is not a filter that missed, nor a cache gone stale. the act of measurement CHANGED the
subject, and the changed subject then answered exactly as a healthy one would.

it is the most expensive species because **no second instrument saves you**. any tool that reads
the same socket path inherits the same broken proxy — they agree, they are both wrong, and their
agreement reads as corroboration. the derived-pair trap, except the pair is derived from a fact
the observer created.

what settled it was neither a second tool nor a re-run. it was a **witness the action could not
reach**: the process table. `/proc` holds a tmux server whether or not its socket is linked, so
it answers the question the socket cannot. that read returned `up: false, pids: [529038, 529042]`
— an explicit self-contradiction in one line, and the first honest thing either instrument said
that hour.

the rule it yields is short and general:

> **do not let an instrument's side effects touch its own subject. read FIRST, act SECOND — and
> where you must act before you can read, read a witness the action cannot reach.**

the pattern is easy to spot once named, and easy to write regardless: a teardown that reports
what it tore down, a cleanup that counts what it cleaned, a migration that verifies its own
result. each is a party with both the motive and the means to make its report come true.

### the SPECIES a whole-file audit cannot see: an instrument broken by its NEIGHBOUR

every row above is an instrument that lies about its own subject, through its own construction or
its own act. row 14 is the first that lies because **a neighbour moved**.

`git.crew.poll --boxes` does not read a duct. it reads `duct.poll`'s **rendered report** and joins
the box state onto the crew. so its correctness is a hostage to a layout it does not own, and its
join keyed on position — *the box line is duct.poll's last child*, a claim its own comment stated
as the contract.

i then taught `duct.poll` to render the route stone. `empty` grew a second line, the stone took the
last-child slot, and a skill i had not opened began to report `❔unknown` over every idle crew.

| | |
|---|---|
| d1 — did the tool fail? | **no.** exit 0, ordinary format, whole fleet rendered |
| d2 — is the content untrue? | **yes.** *"this box could not be read"* — it was read, and named `empty` one line up |
| who broke it | **a neighbour.** its own source was untouched and remains correct in isolation |

#### why no audit of either file finds it

this is the part that earns the species its row. the defect exists in **neither instrument**:

- `duct.poll` renders honestly. every line it emits is true
- `git.crew.poll` parses correctly — against the layout that held when it was written
- the defect lives in the **seam**, and a seam belongs to no file

so a reviewer of the diff sees a render change over a green suite. a reviewer of the reader sees a
parse that matches its own documented contract. `partial audit`'s fourth mechanism, at the level of
a repo rather than a claim: **the subject you read is complete, and the defect is not inside it.**

#### the rule

> **a reader that keys on WHERE a value sits in its source's output is a reader its source breaks
> the next time it renders — and it breaks silently, into a plausible state.** key on what the
> value SAYS. where the content genuinely cannot be told apart, the two skills owe each other a
> declared contract, not a layout one of them happens to hold today.

the "plausible state" clause is what makes it a false report rather than a crash. a positional
read that misses does not error — it lands on some other line and scores it, so the output stays
well-formed and reads as a verdict. mine produced `❔unknown`, which is a state the tick contract
has a route for. a crash would have been cheaper.

#### ⚠️ it was the SECOND instance in three ticks, and the first repair did not reach it

the same join had already broken once, on the same cause: it keyed on the `⌨️` glyph, and a
`🚧 PROMPT` renders its own header with no keyboard glyph at all — so the one state a sweep most
needs was the one state it dropped, and it dropped it as *"this role is not live."*

the repair for that one moved the key from the glyph to the `└─` position and **wrote the new
anchor into a comment as the contract.** it read as a move from a fragile signal to a stable one.
it was a move from one positional read to another, and it bought three ticks.

> **a repair that replaces one proxy with a second proxy has not left the species.** ask what the
> new key is a stand-in FOR — if the answer is still *"where the line sits"*, the next render
> breaks it.

### the SPECIES whose cost is UNRECOVERABLE: a discriminator that does not discriminate

row 15 is the only report in this file whose cost is **an act rather than a belief**, and that is
what earns it a section beside row 14 rather than a line beneath it.

every other row here costs a wrong conclusion. a supervisor believes a duct is down, a count is
zero, a message landed. each is recoverable — the next read corrects it, and the belief cost a
tick. row 15's paved move is a `--keys`, and a keystroke on a design council **renders a wisher
decision in the human's name, with no undo.**

| | |
|---|---|
| d1 — did the tool fail? | **no.** `git.crew.poll --boxes` rendered the whole fleet clean |
| d2 — is the content untrue? | **yes.** `🚧prompt` says *"mechanic STALLED, awaits a decision"* — and the tick contract reads that as *a decision YOURS to render*. the pane held a question that was not mine |

#### the mechanism: a token true of BOTH classes, in a chain that ends at the unsafe arm

the detector sorts a modal by a chain of tells — the ask tells first, then the perm tells. among
the perm tells sat `Esc to cancel`.

**that string appears on every claude modal of either kind.** the detector's own comment, two
lines above the chain, said so in as many words. so the tell set held a token that is true of
both classes, and a token true of both classes is not a discriminator — it is a **presence check
in a discriminator's clothes**, and it silently converted the perm arm into *"a modal is up."*

worse, it is the token most likely to be the ONLY one present. it is the modal's LAST line, so it
survives whatever truncation drops the others — which is the worst possible property for a string
that classifies naught.

#### the asymmetry names the cure, and the cure is not a better tell

| the misread | what it costs |
|---|---|
| a PERM read as an ASK | **one message.** the supervisor reads the pane a tick later and judges it |
| an ASK read as a PERM | **a keystroke in the human's name**, on a decision only they hold. no undo |

so the two errors are not peers, and a chain that treats them as peers is wrong before its first
tell is written:

> **a chain of tells has a DEFAULT, and the default is whichever arm it ENDS at.** name that arm
> out loud before you write a single tell — it is the verdict every unclassified case receives,
> and it receives it silently.

the repair added a third arm — `unsure`, reached when a modal is plainly up and neither tell set
claimed it — and moved `Esc to cancel` there, where a presence check is exactly the right
instrument. the chain now ends on the side whose move (send no keys, read it, surface it) is safe
under either kind.

#### what caught it, and the refinement it forces on the countermeasure

not the countermeasure below. the verdict was caught by **step 0 of the procedure that consumes
it** — `howto.review-permission-requests`, which forbids a `--keys` off a poll's summary and
demands a `duct.read` of the full command first. the procedure's own distrust of its input is
what stopped a key from landing.

that read is worth a note, because on the countermeasure's stated test it looks worthless: the
poll and the read draw from **one source**, the pane. a derived pair, and this file grades those
as buying naught.

they are not derived here, and the reason sharpens the test:

> **a pair is derived when it shares a source AND a transform. where the defect lives in the
> TRANSFORM, a second instrument that reads the same source and applies NO transform adjudicates
> perfectly.**

the poll classifies; `duct.read` merely renders. the pane was never wrong — only the classifier
was. so the cheap check for any verdict is not *"is there a different source?"* but **"can i read
the raw subject the verdict was computed from?"** where you can, you have an adjudicator, and it
costs one command.

## .why the forbidden synonyms distort

| ⛔ synonym | why it distorts |
|-----------|-----------------|
| `false negative` | a term of art from detection/testing, about a missed detection. it fits the zero-match species and no other — `✔ submitted` on a stranded message is a false POSITIVE and still a false report |
| `false zero` | names one species (a count that should not be zero) as though it were the genus. `✔ submitted` and `box empty` carry no count at all |
| `silent failure` | asserts a failure. the defining mark here is that **none occurred** — the run succeeded |
| `flake` | implies nondeterminism. a broken glob false-reports every single time |
| `stale output` | names one cause (a cache or registry not refreshed) out of several; a broken glob is not stale, it is wrong |

## .the operator's countermeasure

a false report cannot be caught by care, because care reads the same bytes. it is caught only by
a **second, independent instrument** — a different tool, a different flag shape, or a
single-variable test that isolates the suspect input.

but **detection and adjudication are two different acts**, and a second instrument performs only
the first. when two instruments disagree you have learned that *one of them lies* — never which.

| what you hold | what it buys |
|---------------|--------------|
| one instrument | naught — a false report reads exactly like a true one |
| **two that share a source** | **naught — a derived pair is one instrument in two coats** |
| **one instrument, read AGAIN later** | **naught — a repeated read is one instrument, twice** |
| two independent, and they disagree | **detection** — one of them is wrong |
| a single-variable test, or a third independent source | **adjudication** — WHICH one is wrong |

### the trap beneath the countermeasure: a DERIVED pair is one instrument

"a second instrument" is easy to satisfy in appearance. two skills, two commands, two outputs —
and one source. `rhx duct.poll` prints `fleet: 21 duct(s), derived live from duct.list`, so to
check a `duct.poll` verdict against `rhx duct.list` is to ask one registry the same question twice.

that is worse than useless, because a derived pair **agrees while both are wrong**. a stale row
makes `duct.list` list a felled tree; `duct.poll` inherits the phantom and reports `💥` on it. the
two concur, and their concurrence buys naught.

so the test is not "is it a different command" but **"does it read a different source?"** on
2026-08-05 the question was settled by a third party that shares no source with either — the
filesystem, read through a foreman shell:

```
ls -d /home/vlad/git/*/_worktrees/rhachet.beav.fix-keyrack-daemon-leak  →  NO_SUCH_WORKTREE
```

one line adjudicated both: the `💥` was TRUE (the sessions really are gone) and the `duct.list`
row was the false report. neither of the first two instruments could have told me that, however
long i stared at them.

the `grepsafe` case is often read as "a second instrument caught it", and that is half the story.
what settled it was the **single-variable test** — same pattern, same repo, same minute, one glob
changed. to vary ONE input on the SAME instrument isolates the fault without a second tool's own
reliability in the loop.

### the TEMPORAL derivation — a repeated read is one instrument, twice

the section above parts a pair by SOURCE. a pair can also be parted by TIME, and the temporal case
is sneakier, because repetition feels like accumulation: N ticks that agree read as N pieces of
support rather than as one instrument consulted N times.

they are not support. **a proxy that is systematically wrong is also perfectly stable** — the same
broken glob returns `0` every run, the same positional parse lands on the same wrong line, the same
socket check reports the same absent server. so agreement across ticks distinguishes naught, and
the confidence it builds is not earned by the readings.

evidenced 2026-08-31, and it is the term's first instance where the suspicion turned out
**unfounded** — which is what makes it worth the section. `git.crew.poll` reported the same four
mechanics `🌊 changed` and the same two `🧊 still` on two consecutive ticks. i read the repetition
two ways in sequence, and both reads were unfounded:

| the tick | what i concluded from repetition | the flaw |
|---|---|---|
| 20 | *"four mechanics moved"* — stated as a fact | one proxy, read once. `🌊 changed` is on this file's own reader-inference list, cause = **proxy** |
| 21 | *"the same four every tick, always `empty` — that smells frozen"* | one proxy, read twice. a stable proxy is what a WORKING clone renders too |

the elapsed axis settled it in one command: `Running… (9m 10s · timeout 15m)`, a climbing timer on a
live `--as arrived`. the clones were at work throughout, so the tick-20 verdict was **right, and
right from an axis i had not checked** (`term=substituted-criterion`, fifth instance), while the
tick-21 doubt was **wrong, from the same axis read twice**.

> **stability is not corroboration.** to re-read a proxy tells you the proxy is stable; it tells you
> naught about whether the proxy tracks its subject. only a DIFFERENT axis does that — and the axis
> is usually named already, in whatever rule set the standard.

the tell, and it costs no read: **ask what a repeated read varied.** where the answer is *"only the
clock"*, you hold one measurement, however many times you took it.

#### ⚠️ the claim above is OVER-BROAD — a verdict's two arms are not equally informative

written r136, corrected r137 two ticks later by its own author. *"a repeated read is one instrument,
twice"* is true of `🌊 changed` and **false of its opposite** — and the two arms come out of ONE
comparison, so the correction cannot be had by a better instrument:

| the arm | how many states produce it | what a re-read buys |
|---|---|---|
| `🌊 changed` | **three** — a real turn · a live tool's timer · harness chrome | naught. ambiguous however often you take it |
| `🧊 still` | **one** — no turn. any turn moves the body, any live tool moves the timer | the same fact restated. it adds naught, and misleads naught |

so the honest form is narrower: **a repeated read of an AMBIGUOUS verdict buys naught.** where a
verdict has exactly one cause, a supervisor may lean on it directly — a `🧊 still, 29m` settles that a
modal did not change beneath it, with no second axis required.

the two arms therefore carry opposite duties: a `changed` may never be reported as motion without a
second axis; a `still` may be reported as *parked* on its own.

⇒ the shape is not new to this glossary. `term=at-work` draws it one layer up: `at work` is the only
crew verdict that must be **PROVEN**, and `down` is the default every crew starts at — so a grove
that is up-and-idle lands silently in `down`.

> **ask, per instrument: which arm absorbs the cases it could not classify?** that arm is the
> ambiguous one and is never safe to report as a fact. the other arm is.

⚠️ and the arms **swap** between instruments — `down` is the ambiguous arm on the crew axis, while
`still` is the SAFE arm on the motion axis. so this is a question to put to each instrument, never a
rule to carry between them.

this is `rule.require.trust-but-verify` aimed at the tools rather than at claims.

### the SECOND derivation — a pair can share an INPUT rather than a source

the test above asks *"does it read a different source?"* that is necessary and it is not
sufficient. a pair can read two genuinely separate sources and still be derived, because the
**argument** handed to the second instrument came out of the first one's output.

evidenced against my own record. r77 (`term=crew._.choice.reason.md`) reports a grove rename in
two steps:

```
line 293   duct.poll now shows  duct://grove-ahbode-v20260810/main/mechanic
line 340   $ for h in grove-1 grove-ahbode-v20260810 …; do ssh -G "$h" | grep -m1 hostname; done
line 342   grove-ahbode-v20260810     => hostname localhost
```

the sources are unrelated — a duct registry and an ssh config. the entry reads as a claim
corroborated by an independent witness. **it is not.** i took the NAME from line 293 and typed it
as line 340's argument, so `ssh -G` was asked *"does this string map to a host?"* and answered yes.
it was never asked *"is this string the right string,"* and could not have been.

so line 340 is a genuine second source on **one** question and no source at all on **the other** —
and the entry does not part them.

**the tell it missed:** the duct registry today reads `grove-ahbode-`**`v20260810.ground`**, with a
suffix r77 records nowhere. either the host was renamed again, or r77's line 293 is my own
truncation of the registry's name. i decline to say which — the `ssh -G` read that would part them
is gated behind a permission this session does not hold, and the alternative is a guess.

### the rule this yields

> **a second instrument fed the first one's output is one instrument with an extra step.**

the countermeasure is to name what the check's ARGUMENT came from, alongside what its SOURCE is:

| the check's source | the check's argument | what it buys |
|---|---|---|
| the same | the same | naught — one instrument in two coats |
| different | **taken from the claim under test** | **naught, on the claim's SUBJECT — only on its predicate** |
| different | independently obtained | detection |
| the same, one input varied | deliberately varied | **adjudication** — the single-variable test |

row 2 is the new one, and it is the sneakiest because rows 1 and 3 are told apart by a question a
reader thinks to ask. row 2 passes that question and fails anyway.

**the general form:** an instrument can only ever check the PREDICATE of a claim whose SUBJECT you
handed it. to check the subject, the subject must come from somewhere else.

### the cost of that check, measured

the countermeasure reads expensive — a second instrument, or a single-variable test, per report.
one tree measured it, and it is not.

a mechanic that hit three phantom blockers in one session adopted a four-second habit: **before
any fix, grep the quoted snippet.** that grep IS a single-variable test on the same instrument —
the reviewer claims the snippet sits at this path, so read the path. it caught **3 of 13 blockers
that session**.

so the discipline is affordable exactly where it is aimed. blanket suspicion of every report is
not practical and never was. a cheap check aimed at the ONE claim a given instrument can most
easily get wrong is:

| instrument kind | the claim to check | the cheap check |
|---|---|---|
| a measurement tool | the input you varied | re-run with that one input changed |
| a reviewer | the snippet it quoted | grep the snippet |

the habit was derived in the field by a party that had never read this file. that is the term's
strongest validation to date — and the rate is its first quantity.

## .not-this — the near misses, and which discriminator each fails

a case must fail NEITHER discriminator. these five were each reached for in the field and
refused. the refusals bound the term more tightly than the acceptances do.

**one failure is enough to refuse.** the table is easy to misread on that point, and it misled
the very mechanic who reported the fourth case:

> *"`rhx not found` fails BOTH, which quietly trains the eye that both-fail is what a refusal
> looks like. a case that fails only one — and exits 0 with ordinary output besides — reads as
> a fit."*

so the `refused on` column below names WHICH discriminator turned each case away. three of the
four fall on a single one. the third fails both, which makes it the LEAST instructive row here,
not the clearest — an easy refusal teaches an eye to expect easy refusals.

| the case | did the tool fail? | is the content untrue? | refused on | so it is |
|---|---|---|---|---|
| `--resnap` accepted and ignored | **yes** | — | **d1 alone** | an ordinary loud failure |
| a resnap-green run | no | **no — true, and proves naught** | **d2 alone** | circular verification (cited) |
| `rhx: not found`, read as a bad install | **yes** | **no — true of that path** | d1 + d2 | the reader's own inference |
| `git diff` empty on STAGED changes | no | **no — true of unstaged, tracked** | **d2 alone** | the reader's own inference, INVITED by a name that over-promises |
| `.tmux.conf` declares `@continuum-restore 'on'` | no — no tool ran at all | **no — a true statement of INTENT** | **d2 + subject** | the reader's own inference, INVITED by a DECLARATION that reads as a state |

the fourth is the subtlest, and the only one mis-filed twice: a mechanic recorded it as an
instance, and the supervisor relayed that claim and never ran this table against it. it clears
discriminator 1 outright, which is exactly what makes it feel like a fit. `git diff` truthfully
answers a narrower question than its name suggests — unstaged only, tracked only. for the
question "was there any change at all", the instrument whose scope matches is `git status --short`.

so the fourth adds a rule the other three do not: **when a true report misleads, ask whether the
instrument's NAME over-promised its scope.** where it did, the fix is not more care — it is a
different instrument.

**the fifth is the only row here with no instrument at all**, which is what makes it the hardest
to refuse. a `.tmux.conf` line — `set -g @plugin 'tmux-plugins/tmux-continuum'` — is not a
measurement. it is a wish, addressed to a plugin manager that may never have run. said out loud
in its own words it reads *"i want continuum, and i want restore on"*, and that sentence is true.
the false sentence — *"continuum is installed and saves every 15 minutes"* — is the reader's, and
**every declarative file in this repo's world invites it.**

it was mis-filed exactly as the fourth was: stated to the human as a classification, in prose,
with neither discriminator run. see the reason file's fifth-reach entry.

### how to answer discriminator 2, when it is hard

the fourth case was mis-filed twice because *"is the content untrue?"* is a question two careful
parties can both answer wrong. the mechanic whose case was refused then derived the procedure that
would have caught it, and it is the one to run:

> **say the report's content out loud in its own words, then ask whether THAT sentence is false.
> if the false part appears only once you paraphrase it as a conclusion, the instrument was honest
> and the inference was yours.**

worked on the case itself: `git diff` said *"no unstaged change to package.json."* is that
sentence false? no. the paraphrase — *"no config changes"* — is the false one, and it is the
reader's sentence, never the tool's.

#### why that step is needed at all — the two sentences MERGE

the mechanic that fell to this case later named the mechanism, and it explains why the out-loud
step is a step rather than a ceremony. as the misled reader, it found that what the tool said
and what it concluded had fused into one sentence in its head — so the discriminator carried no
weight there, and it never noticed:

> *"i read my own inference back as the report's content."*

that is the failure the procedure defeats. a reader who has already merged the two cannot part
them by a closer look, because either one returns the same sentence. to say the content **out
loud, in its own words** is the one move that pries them apart.

it also settles an oddity: the same mechanic applied discriminator 2 correctly to a different
case an hour earlier, and wrongly to this one. it was not careless in the second. it was
INSIDE it — and a discriminator you stand inside of is one you cannot run on yourself.

### the FIVE causes beneath the reader-inference rows

those rows name the reader's inference as the fault. they do not say why the reader was
tempted. thirteen field instances now sort into five causes, and the split earns its keep because
the remedy differs at each:

| the artifact | what it truly answers | the cause |
|---|---|---|
| `git diff <path>` | unstaged, tracked only | **scope** — narrower than the question asked |
| a `--scope`-filtered test run | only what the filter selected | **scope** — a bound the reader set himself |
| a SECOND `duct.poll`, run to check the first | what moved in the last few SECONDS | **scope** — the reader put a 15-MINUTE question to it |
| `duct.poll` `🌊 changed` | the pane bytes differ | **proxy** — a stand-in for "the mechanic moved" |
| a plan-mode preview | what the plan declares | **proxy** — a stand-in for what the run will do |
| `gh issue view` `state: OPEN` | nobody pressed close | **proxy** — a stand-in for "the work is unfinished" |
| a clone's OWN task list, `◻ unticked` | nobody ticked the box | **proxy** — a stand-in for "this work is undone", kept by the very party who reads it |
| `git.crew.poll`'s `🗿` stone line | the last **settled** transition on the route | **proxy** — a stand-in for "where the clone is NOW", written only when a gate closes |
| `git.crew.poll`'s `🙋 PLEA SEEN` | this pane's scrollback holds a grant command | **proxy** — a stand-in for "a grant is OWED", blind to one already granted |
| `.tmux.conf` `@plugin` | what the author WANTED | **declaration** — an instruction that may never have run |
| `git.crew.poll`'s `ehmpathy/rhachet#beav/fix-x` | this tree's ref is that BRANCH | **notation** — `owner/repo#N` is github's own pr syntax, borrowed for a branch |
| `git.grove.saturation`'s `ram available 5.3G` | a **stock**, at one instant | **quantity-kind** — read as a trend, so extrapolated |
| `git.grove.saturation`'s `full @60s 32.3%` | the **last 60 seconds**, then forgotten | **quantity-kind** — read as cumulative, so read as monotone |
| `git.grove.prune`'s `0.0% cpu` | a **lifetime mean** over 5h of uptime | **quantity-kind** — read as an instant, so a live 80% spike vanished |

### the fourth cause — NOTATION, and it is the only one the READER cannot help

added 2026-08-30. the first three fault an inference the reader supplied; this one faults a
**syntax the author borrowed**, and the reader's inference is not merely tempted but **correct**.

`git.crew.poll` rendered a tree's ref as `owner/repo#<x>`. where a pr existed, `<x>` was its
number and the string is github's own notation. where no pr existed, `<x>` was the **branch** —
and the string still read as a pr reference, because that is what `owner/repo#…` denotes
everywhere else, this repo's own tone rules among them.

run the discriminators and it lands in the reader-inference family, as the first three do:

| | |
|---|---|
| d1 — did the tool fail? | **no.** the row rendered clean |
| d2 — is the content untrue? | **no.** *"this tree's ref is branch beav/fix-x"* is true |
| so the false sentence | *"there is a pr here"* — the reader's, drawn from the syntax |

**but the remedy inverts.** for the other three the cure is on the reader: reach a different
instrument (scope), refuse the stand-in (proxy), ask whether it was applied (declaration). here
the reader did all of it right — they knew a published notation and applied it faithfully. no
discipline available to them would have helped, and *more care* returns the same read.

so the cure is on the **author**, and it is a rule about vocabulary rather than about evidence:

> **do not borrow a syntax that is already taken.** a notation carries its established sense into
> every context it appears in, and a reader who knows that sense makes no inference at all — they
> simply read. where two senses must share a column, they need two syntaxes: `#` for the pr, `@`
> for the branch.

**the tell that names it:** ask whether a reader who knew LESS would have got it right. for
scope/proxy/declaration, a more careful reader does better. for notation, the **better-informed**
reader does worse — their command of the syntax is precisely what misleads them. that inversion
is the signature, and it is why the cause earns its own row rather than a slot beneath the others.

it is also the cheapest to prevent, because it is visible at authorship: before you pick a
separator, a prefix, or a sigil, ask what it already denotes to the people who will read it.

### 🔴 the fifth cause — QUANTITY-KIND, and a SECOND INSTRUMENT makes it WORSE

added 2026-09-07, on three instances in one session across three instruments. the number is true,
its magnitude is honest, and the reader mis-infers because **the KIND of quantity is unstated** —
a stock, a window, a cumulative total, a mean, or a ratio whose denominator moves.

| what was read | what it is | the wrong inference |
|---|---|---|
| `available 5.3G`, down five ticks | a **stock** | *"exhaustion in 7–8 ticks"* — one clone exited and it rose a full gigabyte |
| `full @60s 32.3%`, flat three ticks | a **60s window** | *"it has not reversed once"* — it fell to 11.5% the next tick |
| `full 70.04%` beside `idle 98%` | a **ratio over non-idle tasks** | *"the worst pressure of the day"* — runq was 0, so the denominator had collapsed |
| 🔴 `ram full 1.18%` beside `available 5.1G / 17%` | a **flow** beside a **stock** | *"memory is fine"* — the grove was at its lowest headroom on record |

⇒ every one of those reads was ACCURATE. two of the first three were paved into a brief as a
conclusion before the next tick refuted them.

#### 🔴 the fourth row is the THIRD's mirror, and the pair is what it teaches

added 2026-09-08. row three is a **ratio whose denominator collapsed** — ram loud, cpu falsely
quiet. row four is a **flow mistaken for a stock** — cpu loud, ram falsely quiet. both measured on
`grove-ahbode-v20260901`, three ticks apart, and recorded in full at
`rule.require.bound-grove-concurrency-by-saturation` (columns five and seven of its 2026-09-08
table).

| the read | the axis that lied | what it claimed |
|---|---|---|
| ram `full 69.08%`, cpu `idle 90% · runq 0` | **cpu** | *"a grove with room to spare"* |
| cpu `some 85.31% · runq 28`, ram `full 1.18%` | **ram** | *"a grove with memory to spare"* |

⇒ **both reads were taken at 5–6G of 31G, and both single-axis verdicts were wrong.** so the
kind-question is owed of **each axis separately**, and the two must then be read together — either
one alone is answerable, confident, and false.

⚠️ **a stall row can read `0%` on a grove one allocation from an OOM**, because naught has been
denied yet. **a stall counts pressure already paid; `available` counts what is left to spend.** they
are different kinds of quantity about the same resource, which is why the fifth cause catches this
and a second instrument does not.

#### why a SECOND INSTRUMENT does not save you — it makes it worse

this file's countermeasure grades two independent instruments that disagree as **detection**. this
cause defeats that outright:

| instrument | its verdict on ONE pid |
|---|---|
| `git.grove.saturation` (a `top`-style sample) | `MainThread 80.0% cpu` |
| `git.grove.prune --where-cpu-over 5` (a `ps` read) | `under 5% cpu — spared` |

**both are correct.** `ps` reports a LIFETIME mean; `top` reports an instant. so the disagreement
detects a defect that does not exist, and a diligent reader concludes one tool is broken. every
other cause here is caught by a second instrument; this one is **manufactured** by it.

⚠️ and it silently disarms a rule: `--where-cpu-over` cannot find a current runaway on an old
process, which is the one case `rule.require.prune-runaways-before-you-blame-the-grove` exists for.

> **the cure is one question, asked before any compare, extrapolation, or grade: WHAT KIND OF
> QUANTITY IS THIS?** a stock may reverse with no change in the condition · a window forgets ·
> a cumulative never falls · a mean hides its spikes · a ratio is void when its denominator
> collapses.

**the tell, and it costs no read:** you are about to draw a line through two or more reads of the
same label. that act presumes a kind, and the render almost never states one.

#### 🔴 the author of row four broke row one, ONE TICK later — 2026-09-08

the strongest evidence this cause has, because it was committed by someone who had just written it
down and could recite it.

| tick | what i did |
|---|---|
| n | added **row four** to this table, and re-read the tell above to place it |
| n+1 | reported *"the trend on headroom is monotone across three reads: 6.2G → 5.1G → 3.9G"* and used it to escalate a provision decision |
| n+2 | 🔴 `available` read **6.0G** — up 2.1G. the line was drawn through a **stock**, which is row one, verbatim |

⚠️ **the statement was accurate and the USE presumed a kind.** each of the three figures was real; a
monotone run of three is a fact. what the line added was an implied continuation, and a stock owes
none. that is the whole trap: the defect does not live in the numbers, so a re-check of the numbers
never finds it.

✅ **and the mechanism was caught in the act this time** — row one says *"one clone exited and it
rose a full gigabyte"* and left it there. the foreman pane on
`svc-gateway.beav.feat-rec-marketplace-lead-capture` shows the cause:

```
➜ nvim
Nvim: Caught deadly signal 'SIGTERM'
Nvim: Finished.
```

a reaper TERM'd a 1.5%-mem editor within a minute of a `pnpm install` of 968 packages on a grove at
12% headroom. ⇒ **a stock on a reaped box is not merely volatile — it is actively regulated**, so a
descent is a report about the reaper's threshold rather than about exhaustion.

> **before a line through a stock: WHO ELSE MOVES THIS NUMBER?** if a reaper, a scheduler, or an
> operator can move it, the line describes their policy, not your trend.

### the `🌊 changed` proxy hides THREE states, not two — 2026-08-26

the withdrawn evidence row said *"the duct was frozen; only the timer line moved."* that names one
state. a babysit sweep meets three, and one verdict serves all of them:

| the pane | the clone | is `🌊 changed` honest? |
|---|---|---|
| body identical, timer moves, naught runs | stopped or dead | ✅ of the bytes — ⛔ of the work |
| body identical, timer moves, **a tool genuinely runs** | at work, and WAITS on its own tool | ✅ of the bytes — ✅ of the system — ⛔ of the clone |
| body differs | took a turn | ✅ throughout |

the middle row is the common one and the file never named it. observed 2026-08-26 on
`fix-machine-wide-reach-unlock`: a peer-review round `Running… (23m 44s)`, up from `(8m 47s)` a
tick earlier, with every other byte identical. the work was real, the clone had not moved, and
the duct was in no sense frozen.

so the cure is not *"suspect a frozen duct"* — it is the three-axis read the nudge rule already
carries: **body · elapsed · width.** where only elapsed moves, name WHAT is at work before you
call it progress or call it a stall. a supervisor that reads the middle row as row 1 nudges a
clone that is fine; one that reads it as row 3 reports progress no one made.

the **declaration** cause runs OPPOSITE to a proxy, which is why it earns its own name rather than
a slot beneath one:

- a **proxy** sits DOWNSTREAM of the fact and merely correlates with it — an issue's `state`, a
  pane's content hash. its cure: read the fact's own witnesses instead.
- a **declaration** sits UPSTREAM of the fact and is meant to CAUSE it — a `@plugin` line, a
  `package.json` entry, a `keyrack.yml` key, a wish's `.acceptance`. its cure is a different
  question entirely: **was it applied?**

that question is no novelty here — it is the whole declastruct / declapract loop (declare, apply,
verify convergence), and `drift` is the word the repo already uses for the gap when apply never
ran. what this row adds is that a human who reads a declarative file skips the apply step **by
default**, because a declaration and a state are byte-identical on the page.

### "was it applied?" is INSUFFICIENT — the question is "which FILE was applied?"

on 2026-08-09 the same `.tmux.conf` produced a second, harder instance, and it refutes the cure
above as stated. `~/.tmux.conf:17` declares `set -g mouse on`; the live server read `mouse off`.

"was it applied?" answers **yes** here, and answers wrong. the server DID source that file — its
`history-limit 50000`, three lines below the mouse line, was live; so were `prefix`, `extended-keys`,
and `set-clipboard`. four of five lines from that exact region applied. only the fifth did not.

the cause: tmux 3.2+ sources **two** user configs, and the SECOND wins:

```
$ tmux display-message -p '#{config_files}'
/home/vlad/.tmux.conf,/home/vlad/.config/tmux/tmux.conf
```

the second file was 16 days OLDER and carried the opposite decision — `set -g mouse off`, with its
own reasoned comment block. neither file is wrong. the config SYSTEM is.

so the declaration cause has a second layer, and the cheap question misses it entirely:

| the layer | the question | what it catches |
|---|---|---|
| was the apply run at all? | *was it applied?* | drift — the declaration never ran |
| **which of N candidate files ran?** | ***which file was applied?*** | **a shadowed declaration — the apply ran, on a different file** |

the general rule this yields: **a config file is a declaration, not a state — and when a tool has
more than one config path, the file you OPEN is not necessarily the file it READ.** ask the tool
to name its own inputs; never infer them from the filesystem:

| tool | ask it what it loaded |
|---|---|
| tmux | `tmux display-message -p '#{config_files}'` |
| git | `git config --list --show-origin` |
| ssh | `ssh -G <host>` |
| nvim | `:scriptnames` |

three hypotheses were spent before that question got asked — a stale server, a runtime override, a
shell-lib override. each read the territory in a place the answer was not. the tell that should
have routed there sooner: **a PARTIAL apply.** where every line of a config takes effect but one,
the fault is rarely in the line — it is that a later source re-set it.

a **scope** defect is cured by a different instrument whose reach matches the question —
`git status --short` for "did the file change at all". that is the r40 rule, and it holds.

a **proxy** defect cannot be cured that way, because the proxy is often the only cheap read on
offer. its cure is a refusal: do not grade a subject from its stand-in.

the fifth row is the cheapest demonstration of that refusal to date. a behavior gated its whole
critical path on `declastruct-github#66`, which read `state: OPEN` — while the work had shipped
the prior day as `v1.8.0`. the issue stayed open because nobody closed it, and **an unclosed
issue and unfinished work are byte-identical from outside**. the mechanic that caught it read
the merged PR and the released package rather than the issue's state, then wrote the general
form:

> "the blocker stopped being external on 2026-08-06 — it merely READ that way, because an OPEN
> issue reads as unfinished work."

an issue's state is a claim ABOUT work, maintained by hand, and hands forget. the work itself has
its own witnesses — a merge, a release, a version on the registry — and every one of them is
cheaper to check than the cost of a gate held shut for a day.

#### ⚠️ the proxy a party keeps about ITSELF — and reads back as fact

evidenced 2026-08-31, one round after the row above. a mechanic on
`feat-frontier-claude-models` reported its blockers to me and closed with *"two things still
block forward motion, both yours."* four lines beneath that sentence, its own task list read:

```
✔ Verify current published Claude model list
◻ Write 1.vision.yield.md
```

so one pane asserted a full stop and displayed drivable work in the same frame. i nudged it at
the open box; it answered *"let me verify that task item against reality rather than trust a
stale entry"* — and found the yield already written, revised across four review passes. the box
was simply never ticked.

that is the gh-issue row exactly, with one axis moved: **the party who keeps the proxy is the
party who reads it.** an issue's state is a claim maintained by a stranger, so a reader has at
least some cause to doubt it. a clone's own checklist is a claim it wrote itself, which is the
strongest available reason to trust it and no reason at all that it is true.

> **a self-kept record does not verify itself.** the hand that ticks the box is the same hand
> that forgets to, and the record carries no trace of which.

the cure is the gh-issue cure, unchanged — read the work's own witnesses (the file on disk, the
merge, the release), never the record that claims to summarize them. what this instance adds is
that the rule binds hardest exactly where it feels least needed.

⚠️ and note where the correction came from. **i did not catch it; the clone did, once asked.** my
nudge was aimed at *"go write the yield"* and was wrong on its face — the yield existed. the clone
took the wrong instruction and returned the right verdict, because it could read an artifact i
could not. so a nudge that rests on a stale proxy still pays, provided it asks rather than
commands: *"drive what remains"* survives a wrong premise where *"do X"* would have manufactured
duplicate work.

the second cause was named by the party who fell to it, in one line kept verbatim:

> "a plan-mode preview is a **claim about** a run, not the run. to grade an execution defect from
> it is the same category error as to bank a test result from a summary — one layer removed from
> the run itself."

that sentence reaches past this repo. a summary of a test run, a registry row about a worktree, a
content hash of a pane — each sits one layer off what it stands for, and each reads exactly like
the real article until it does not.

full accounts of all four live in `term=false-report._.choice.reason.md`.

## .see also

- `term=false-report._.choice.reason.md` — etymology, the discovery, and the boundary against `fail*`
- `term=factory-upgrade._.choice._.md` — a false report is a defect a factory upgrade records
- `rule.require.trust-but-verify` (mechanic) — verify a claim; this extends it to the instrument
- `rule.forbid.failhide` (mechanic) — the nearest `fail*` neighbor, and why it does not cover this

---

written by human + beaver 🦫
