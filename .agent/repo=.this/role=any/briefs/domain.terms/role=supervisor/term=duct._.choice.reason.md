# domain.term.choice.reason: duct

## .etymology

a duct carries what enters it from one place to another, and stays open while it does. the
metaphor fits the beaver's world (`im_a.bhuild_supervisor.md` — dams, lodges, flow) and it fits
the mechanism: a supervisor pushes keystrokes down it and pulls a pane back up.

it was already the repo's word before this file existed — 9 skills and a uri scheme, all coined
by the human. this cluster records a term in live use, never one invented at the keyboard.

## .the r44 claim this file CORRECTS

round 44 deferred this term and stated the reason for the deferral like this:

> *"`duct` is overloaded in live use between two referents: a **registry row** and a **tmux
> session**."*

**that claim is wrong, and the source read is what refuted it.** the skills are consistent. every
one of them uses `duct` for the addressable whole, and each reaches for the part it means when it
means a part — `duct.reboot` says *pane*, `duct.refresh` says *clients*, `duct.list` reads the
registry. the word never does double duty in a contract.

what actually slid between the two referents was **the supervisor's own prose**, in reports
written to a human. so the defect was mine, not the vocabulary's — and the deferral was reasoned
from a claim i had not yet checked.

that is worth more than the term. the r44 deferral read as caution and was partly a guess dressed
as caution: **i could name an ambiguity from outside, and the ambiguity was not there.** the fix is
the one `rule.require.trust-but-verify` names, aimed at my own claims rather than at an
instrument's.

## .why the forbidden synonyms distort

| ⛔ synonym | why it distorts |
|-----------|-----------------|
| `session` | names the **substrate**, one part of a duct. a duct can outlive its session — that is precisely what a phantom is, and the word for it must not be the word for the part that died |
| `tmux session` | same defect, plus it binds the term to today's implementation. tmux is a choice, the duct is the contract |
| `pane` | narrower still — `duct.reboot` respawns a pane and the duct survives. to call the duct a pane makes that operation impossible to describe |
| `terminal` / `tab` | the kitty window **attached** to a duct, owned by the `term.*` family. a duct with no tab is live and normal (`term.audit --absent` exists to list exactly those) |
| `channel` | already taken — radio uses it for a dispatch medium (`radio.task.push --via gh.issues`). one word, two concepts, is the overload `rule.require.ubiqlang` forbids |

## .evidence — the gap between the parts, seen twice, in both directions

the row/session split is not a design note. it is where every observed failure lives:

| the mismatch | how it surfaced | date |
|---|---|---|
| **one session, TWO rows** | `term.open --for <role>` registers under the tmux-normalized (underscore) form while `duct.open` registers under the DOTTED form. the fleet read 24 for 23 sessions | 2026-08-06 |
| **one session, TWO rows — again** | reproduced deliberately: the supervisor passed the DOTTED form to dodge the first instance, and `term.open` minted the underscore row anyway | 2026-08-06 |
| **two rows, ZERO sessions** | the `fix-keyrack-daemon-leak` rows outlived their sessions and read `💥 malfunction` on every poll | 2026-08-05 |
| **two more rows, zero sessions** | a felled tree's rows survived a `duct.stop` that reported success | 2026-08-06 |

the first two are caused by **tmux name normalization**: tmux forbids `.` in a session name and
writes `_` instead, so one duct has two written forms. `duct.open` registers under the DOTTED
form; `term.open --for <role>` normalizes first and registers under the UNDERSCORE one. one
session, two rows, and the tmux session is shared — so neither row can be cleared with
`duct.stop` without a kill of the live duct.

**the normalization happens INSIDE the skill, downstream of the caller's argument.** an earlier
revision of this file blamed the operator for a paste of the underscore form, and named the
dotted form as the remedy. that attribution was refuted by a deliberate test: the dotted form was
passed, and the underscore row appeared anyway. the defect belongs to `term.open`, and no choice
of argument avoids it.

the correction matters because it moves the fix. to blame the operator yields "paste more
carefully" — advice that cannot work. the true cause yields a repair: the two skills must agree
on one canonical form, and the row is the place to settle it.

### a THIRD surface, and it fails in the opposite direction — 2026-08-12

the two above are the normalization that **mints a row that should not exist**. this one **denies
a crew that does** — and then names a fix that would mint the duplicate.

```
$ rhx git.crew.show --tree sdk-aws-lambda.beav.feat-for-sqs-visibility-heartbeat
   └─ 💥 no ducts for '…' — a view needs work to look at
      fix: rhx git.crew.boot --tree sdk-aws-lambda.beav.feat-for-sqs-visibility-heartbeat
```

both ducts were live. `git.crew.list` printed them in the same minute, under the **underscore**
form, and the underscore argument worked at once. same command, one input varied, opposite result
— a single-variable test, run by accident.

the cause is verified at source. `__crew_has_ducts` matches live **tmux sessions**:

```bash
[[ "$session" == "$tree"/* ]] && return 0
```

tmux normalizes, so every session name carries underscores. a dotted `--tree` cannot ever match
one, and the prefix test returns false for a crew that is fully up.

**the dotted string is not an operator's slip.** `git.tree.behavior` prints it, in its own summary,
as the tree's name:

```
🐢 cowabunga! worktree ready — 1 window, 2 tabs
   ├─ tab 1 (base): mechanic — sdk-aws-lambda.beav.feat-for-sqs-visibility-heartbeat/mechanic
```

so the fleet publishes one form and the crew verbs accept only the other. to copy the name from
the output that produced it is the failure path.

#### the fix it names would manufacture the defect one section up

this is the part that raises it past an ordinary error. `rule.require.errors-name-the-fix` demands
an error name the concrete next move, and this one does — which is what makes a reader run it.

`crew.boot --tree <dotted>` calls `duct.open --on duct:///<dotted>/<role>`, and this file's own
record says `duct.open` registers under the form it is handed. the session already exists under the
underscore form with a row of its own. so the named fix yields **one session, two rows** — the
exact duplicate documented twice above, which `duct.stop` cannot clear without a kill of the live
duct.

> ⚠️ **stated as an inference, not a run.** the mechanism is read from source and from this file's
> own two prior instances; the command was NOT executed, because to prove it would be to create the
> defect on a live tree. recorded at the confidence it was obtained.

#### what the three surfaces together say

one root cause, three faces, and the third is the one no reader would predict from the first two:

| surface | the normalization | what it produces |
|---|---|---|
| `term.open` mints a row | writes the underscore form | a duplicate row |
| `duct.open` writes dots | keeps the caller's form | the duplicate's other half |
| **`crew.*` reads sessions** | **reads only underscores** | **an extant crew denied, plus a harmful fix** |

so the repair this file has asked for twice — *"the two skills must agree on one canonical form"* —
is now owed by a third party, and the canonical form has to be one a caller can **copy from
output**. any settlement that leaves the fleet's own printed name unusable at the crew verbs has
not settled it.

**recorded, not repaired.** a one-line normalization at each `--tree` parse would close the read
side today and would leave the write side's duplicate untouched, which is the half that costs a
live duct. the canonical form belongs to the layer that owns ductwork.

#### the SCALE, measured — 2026-08-12, one third of the live fleet

the section above is an anecdote: one crew denied, once. the same day it was priced, by two
instruments that share no source:

| instrument | what it reads | what it says |
|---|---|---|
| `duct.list` | the ROWS, from `~/.ductwork/ducts/` | 4 trees dotted, 8 underscore |
| `git.crew.list` | the live tmux SESSIONS | **12 of 12 underscore, no exception** |

the two agree on the total, so there are **no duplicate rows today** — 12 crews, 12 tree names,
one form each. that matters, because it parts this case from the one two sections up:

| the case | the row | the session | what fails |
|---|---|---|---|
| the duplicate | TWO, one per form | one | `duct.stop` cannot clear either without a kill |
| **this one** | **one, dotted** | **one, underscore** | **every `crew.*` verb, on the name the registry prints** |

so the four dotted rows are neither phantoms nor duplicates. each has a live session, and each is
written in a form its session can never bear. the consequence, stated as a quantity:

> **a third of the live fleet is unreachable by the crew verbs, under the name its own registry
> prints for it.**

that number is what makes the repair urgent rather than tidy. an anecdote reads as a paper cut a
careful operator routes around; 4 of 12 reads as a coin flip on every crew call.

**and no operator behavior avoids it.** the form a row carries is settled at `duct.open`, by
whatever string the boot skill handed it — so which third of the fleet is reachable was decided
days ago, by callers with no way to know the choice mattered.

#### a FOURTH cost — a registry row cannot derive its own worktree path — 2026-08-15

the three surfaces above all sit inside the `duct.*` / `crew.*` family. this one leaves it, and it is
the cost an ordinary reader pays first.

a supervisor read `duct:///sdk-aws-lambda_beav_feat-input-only-validation-and-hydration/mechanic`
from the poll and reached for that tree's yield on disk. the read failed:

```
Path does not exist: …/_worktrees/sdk-aws-lambda_beav_feat-input-only-validation-and-hydration/.behavior
```

the worktree is **`sdk-aws-lambda.beav.feat-input-only-validation-and-hydration`** — dotted. so three
name spaces disagree, and no two of them are ever printed side by side:

| where | the form | who sets it |
|---|---|---|
| the **filesystem** | dots, always | `git.tree.behavior` |
| the **tmux session** | underscores, always | tmux's own normalization |
| the **registry row** | whatever the caller passed | `duct.open` |

so a worktree path cannot be built from a duct address, and the substitution that would build it
(`_` → `.`) is unsound in general — a repo or branch name may hold a real underscore, and the row
itself may already be dotted (8 of 12 are).

**the cost is a wasted read plus a hunt**, and the hunt is worse than it sounds: a glob wide enough
to catch either form (`sdk-aws-lambda*input-only*`) timed out against `_worktrees/`, so the fallback
was a shell `grep -rn` sent through a duct. three commands to answer *"where does this tree live?"* —
a question the address appears to answer and does not.

**recorded, not repaired.** it sharpens the repair already owed: the canonical form has to be one a
caller can copy from output AND use as a path. any settlement that fixes the crew verbs and leaves
the filesystem in disagreement has moved the defect rather than closed it.

the second HAD a proven cause in `duct.stop`: when the session was already absent it printed
`already absent; skipped` and `return 0` — **before** `__duct_unregister_duct`. so the row was
never removed in the one case where the row was all that was left to remove, and a re-run could not
clean it either, since the phantom was exactly the state that early return refused to touch.

its comment cited `rule.require.get-set-gen-verbs` ("remove if extant, no-op if absent") and
`rule.require.idempotent-procedures` as the reason for that early return. it misread **no-op** as
*do naught* rather than *converge to absent*. the row is part of the state that must converge. an
idempotency repair that broke idempotency.

### ✅ FIXED — adjudicated at source, 2026-08-10

both branches of `duct.stop` (local and remote) now call `__duct_unregister_duct` BEFORE they
return 0, and the message changed from `already absent; skipped` to **`was already absent; row
cleared`**. two phantoms were cleared with it this session — `camp-grove/foreman-5` and
`/foreman-4` — each in one call, each exit 0.

the repair carries the diagnosis above almost verbatim, in its own comment:

> *"the misread was of `no-op` itself: it means CONVERGE TO ABSENT, not 'do naught'. a duct is a
> row AND a session, so both are state that must converge (term=duct._.choice._.md)."*

it cites this very file. so the entry earned its keep in the way a glossary row is supposed to:
it named a defect precisely enough that the repair could be written straight from it.

#### corroborated in the field, two days on — 2026-08-12

the ✅ above rests on two clears made the hour the repair landed, which is the weakest proof a fix
can have: the same author, the same session, the same two rows.

it held. **four more phantoms were cleared on 2026-08-12**, all on `camp-grove`, each in ONE call,
each with the repaired message. an independent `duct.list` read after shows the tree at 3 rows and
0 `💥` — down from 7 and 4.

that earns its lines because a fix corroborated only by its own author, in its own hour, is a fix
nobody has yet re-run in anger. four clears, two days later, on rows that arose after it, is the
re-run.

**and the names recur.** r70 cleared `camp-grove/foreman-4` and `/foreman-5`; the four cleared on
2026-08-12 are `foreman-3` through `foreman-6` — so two of those addresses produced a phantom, got
cleared, and produced another. that is not a regression in the repair (each cleared in one call
either time). it is the plainest evidence available that the SECOND origin is live and untouched.

**and the second origin is untouched.** the table above splits the row/session gap into a defect
(`duct.stop` returned before it unregistered — fixed) and a non-defect (the session died with no
stop invoked — no reconciler exists). all four of today's clears are the SECOND kind: no party was
ever asked to converge, so no convergence failed.

so the repair does not prevent a phantom. it makes one **clearable in a single call**, which is a
different promise, and the distinction is the whole reason a reconciler is still owed. a reader who
takes the ✅ to mean phantoms stopped will be surprised by the next four.

**this correction was owed for two rounds before it was made.** the evidence — a phantom cleared in
one call — was in hand at r70. that is the same drift toward permanent deferral this journal
criticized in another tree's mechanic the same day, and it is worth the record: a stale claim in a
`.reason` file is worse than an absent one, because a reader trusts a documented provenance more
than an undocumented one.

### the paragraph above went stale on THREE clocks, not one

the path `~/.bash_aliases.ductwork.sh` is also wrong now. ductwork lives at
`.agent/repo=.this/role=any/skills/work/ductwork.sh`, moved there because a global dotfile is one
reinstall from erased and one shared name from a collision (`define.work-primitive-hierarchy.md`).
the line numbers went with it.

so one sentence carried three independently-decaying claims — a **path**, a **line number**, and a
**behavior**. each can rot without the others, and a reader who checks one and finds it sound will
extend that trust to the rest. the general form:

> **a citation that pins a path AND a line AND a behavior is three claims wearing one coat, and it
> is only as fresh as its stalest thread.**

the cheap countermeasure is to cite the **symbol** (`__duct_unregister_duct`) rather than the line,
and the **repo-relative path** rather than an absolute one. a symbol survives a move; a line number
survives no move at all.

### the third instance had NO mechanism at all — and that is the answer

the third was recorded here as "a second mechanism is live and **unidentified**". this session
supplies the answer, and it is that there is no mechanism to find:

`foreman-4` and `foreman-5` both died **on their own**, with no `duct.stop` ever invoked. no party
was responsible for their rows, because the only party that unregisters a row is the stop verb, and
the stop verb never ran.

so the row/session gap has two distinct origins, and only one of them is a defect:

| origin | is it a defect? | the cure |
|---|---|---|
| `duct.stop` returned before it unregistered | yes — and now fixed | the repair above |
| the session died with no stop invoked | **no** — naught was ever asked to converge | a reconciler, which does not exist |

`duct.list` reads rows and `duct.poll` derives its fleet from them, so neither can notice. the gap
is closed today only by a supervisor who reads a `💥`, diagnoses it, and stops the duct by hand —
which is the loop this session ran twice.

recorded, not repaired. a reconciler is a real design question (does it sweep on every `duct.list`?
on a timer? can it tell a hibernated remote from a dead local?) and it belongs to the layer that
owns ductwork, not to a glossary round.

## .the OPPOSITE direction — 1 session : 2 rows, measured 2026-09-03

every instance above runs one way: a session dies and its row outlives it (`1 : 0`, the phantom).
this one runs the other way, and it is not a decay at all — it is present at the moment of
registration.

measured, both instruments, one tick:

```
rhx duct.list          → 23 local ducts. every local tree listed TWICE:
                            duct:///rhachet.beav.fix-node-pty-install/mechanic
                            duct:///rhachet_beav_fix-node-pty-install/mechanic
tmux display-message   → 12 local sessions. the underscored form ONLY
```

⚠️ **grove ducts are listed once each.** the duplication is local-only, and it is exactly 2× on
every local tree — never 3×, never partial. tmux converts a dot to an underscore in a session name,
so the local path registers a row under **both** forms while the remote path registers one.

⇒ so the pair the term declares is broken in a direction no prior row anticipated:

| direction | cause | already recorded? |
|---|---|---|
| 1 session : 0 rows | a session died, no stop ran | ✅ above, twice |
| **1 session : 2 rows** | **the local register path writes both name forms** | 🔴 this entry |

### .why it is not cosmetic

`duct.list` reads rows and `duct.poll` derives its fleet from them, so **every consumer inherits the
double**:

- `duct.refresh --all` reported *"33 duct(s) swept"* and swept each local session twice
- every sweep pays double on the local half of the fleet
- 🔴 the `🌊 ducts moved — N changed, M unchanged` tally counts **rows**, so one local duct's motion
  weighs **2×** one grove duct's. that aggregate is what
  `rule.require.pause-babysit-cron-after-idle-streak` counts its streak from, and the weight is
  silent — no render names it

it is a `false-report` by both discriminators: `duct.list` does not fail, and its claim — *"these
are the ducts"* — is untrue of the machine.

### .why a reader cannot see it

the two rows sort **adjacent** in `duct.list`'s alphabetical render, and a dotted name beside an
underscored one reads as the same duct written twice for legibility rather than as two rows. so the
tell is not in the list at all — it is in the **count**, and only against a second witness.

> **a duplicate that renders adjacent is invisible; a duplicate that renders apart is obvious.** the
> sort order decides whether a reader can see the defect, and no author chose that order for this.

### .what settles which form is canonical

not settled here, and not mine to settle: the register path is ductwork's, and the choice between
the dotted uri form and the tmux-converted form is a contract call for the surface owner. what this
entry supplies is the measurement and the direction.

## .the operator's rule this yields

**say which part you mean.** a report that says "the duct is gone" is ambiguous in the one situation
where precision is cheapest and matters most. say **row** or say **session**:

- "the session died; the row is a phantom" — actionable
- "the duct malfunctioned" — indistinguishable from a felled tree, a hibernated box, or a wedge

## .see also

- `term=duct._.choice._.md` — the choice itself
- `term=false-report._.choice._.md` — four of its evidenced rows are `duct.*` instruments; a stale
  row is what makes `duct.list` and `duct.poll` a **derived pair** rather than two witnesses
- `rule.require.ubiqlang` (mechanic) — one canonical word per concept
- `rule.require.get-set-gen-verbs` (mechanic) — the del semantics `duct.stop` misreads

---

written by human + beaver 🦫
