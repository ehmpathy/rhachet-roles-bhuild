# domain.term: crew.resume

term.chosen   = resume
term.kind     = verb
term.boundary = crew
term.synonyms.forbidden:
- restart
- reboot
- revive
- restore
- wake
- reattach

## .what

**return a clone to work with its prior context intact.** the clone is not at work — killed,
capped, or exited — and a resume puts the same session back at the keyboard, rather than a fresh
one.

```
claude --resume "mechanic"     → the picker, then Enter → 25.5MB of context, back
```

## .the discriminator — against its three neighbours

all four are supervisor acts on one role of one crew, and they part cleanly on **is the clone
alive**, and **does it keep what it knew**:

| act | the clone is | after |
|---|---|---|
| `boot` | absent | at work, **with no prior context** |
| **`resume`** | **not at work** | **at work, with its context** |
| `nudge` | at work, idle | moved, by a message |
| `steer` | at work, mid-drive | redirected, by a message |

⇒ `boot` and `resume` both end with a clone at work and differ on **what it remembers**. `nudge`
and `steer` both act on a clone already at work and differ on **whether it had momentum**.

⚠️ **`boot` is the destructive one of the pair.** where a resume is available, a boot discards
every turn the clone had taken. so the order is: **resume first; boot only where no session
remains to resume.**

## .the two causes it covers

| the clone stopped because | the trigger |
|---|---|
| its process was killed — a `duct.pane.husk` | `💥143` beneath leftover chrome |
| it hit a usage cap, and the reset has passed | `rule.require.resume-quota-capped-clones` |

one concept, two causes. in both, the work is intact and only the clone is absent.

## ✅ .the verb EXISTS — it is a FLAG, not a noun

```sh
rhx git.crew.boot --tree <tree> --resume <role>      # and crew.open takes it too
```

implemented at `crewwork.sh:1057` + `:1250`, integration-tested at
`crewwork.verbs.integration.test.ts` `[case1]` `[t2]`/`[t4]`/`[t5]`/`[t6]`.

🔴 **do NOT hand-compose it from `crew.send`.** the flag does two things a hand-composed
resume does not, and both were paid for on 2026-09-05 by a supervisor who improvised it:

| the flag does | the hand-composition | what it cost |
|---|---|---|
| drives the picker to completion (`crewwork.sh:1256`) | needs a separate `--keys Enter` | 6 extra calls, 6 for 6 |
| sends `--permission-mode acceptEdits` | omits it | every fresh clone stalled at a 🚧prompt on a **read-only** `git status` |

⚠️ the second is the sharp one: the omission is **silent at send time** and surfaces later, as
a modal on a different command, which reads as the clone's caution rather than the caller's
error.

#### 🔴 .the picker-drive is bounded by a precondition the report does not check — 2026-09-06

*"6 for 6"* is measured and it is not a guarantee. **the seventh call did not complete**, and it
reported success identically:

```
🧠 resume: foreman (by name, not by recency)
   ├─ 🔧 duct://…/declastruct-aws.beav.feat-ssm-document/foreman sent
   └─ 🗝️  picker drew — Enter sent to select 'foreman'
```

a read-back found the pane **still in the picker**, filter `⌕ foreman`, and — the whole of it —
**no rows at all under `current worktree`.** the tree had no resumable foreman session, later
confirmed independently when a fresh clone printed `Recent activity: No recent activity`.

⇒ so the Enter had **naught to select**, and the drive cannot complete where the filter matches
zero rows. the precondition is *"a session by that name exists"*, and the skill neither checks it
nor reads the picker back.

⚠️ **and every line of that report is TRUE** — the picker did draw, the Enter was sent. what is
false is the reader's inference that a selection followed (`term=false-report`, the
reader-inference family). the failure mode is therefore invisible to the caller who trusts the
report, which is exactly the caller this term tells to prefer the flag.

🔴 **so the mandate stands and gains a clause**: use `--resume`, never a hand-composition — **and
read the pane back before you treat the resume as done.** a supervisor who moved on here would
have left a foreman parked in a picker: alive, useless, and `❔unread` to every poll.

⇒ the arrear is a skill-side check: where the picker draws with no row to select, say so and exit
non-zero rather than report a send (`rule.forbid.failhide`, `rule.require.errors-name-the-fix`).

### ⚠️ why it was hard to find — the verb is not named for the concept

the fleet's crew verbs are all `git.crew.<verb>`, so a reader who wants to resume greps for
`git.crew.resume`, finds none, and concludes correctly that it is absent — while the capacity
sits inside `boot`, a verb whose own help calls it **"the EXPENSIVE verb"** that "ends every
conversation in the crew for good."

⇒ **a resume filed under `boot` is filed under its own opposite**, and this term's prior draft
asserted the absence for that reason. the absence was of a NAME, never of the capacity.

### 🔴 and its arg-doc names the anti-pattern the code exists to avoid

`git.crew.boot.sh:53` and `git.crew.open.sh:32` both describe the flag as:

> `--resume  send `claude --continue` into this role's duct after open`

the implementation sends **`claude --resume $resume`**, and `crewwork.sh:1185-1194` spends ten
lines on why `--continue` is wrong: it resolves by **cwd-recency**, and a tree's mechanic and
foreman share ONE worktree — so a foreman's `--continue` can hand back the MECHANIC's
conversation, and neither pane says so (`term=false-report`).

⇒ so the doc advertises, as the flag's behavior, the exact defect the flag was written to
prevent. a reader who trusts the arg-doc over the code learns the anti-pattern **as the rule**.

## 🔴 .a resume restores the CONTEXT and leaves the WORLD stale

this is the half the `.what` above does not carry, and it is the half that bites.

> **the clone wakes with exact knowledge of what IT was at, and none of what happened while it
> was dead.**

and the gap is not small — a husk can go unnoticed for hours (7h51m, measured). in that window
the fleet moves: a peer clone drives on, stones advance, reviewers run, files change under it.
the resumed clone's first act is to **continue its last intent against a world that no longer
matches it.**

⇒ so a resume is **two acts, never one**: restore the session, then **brief it on the delta**.
a resume without the brief is only half done.

### ⚠️ the generic carry-on order is NOT enough here

`rule.require.brief-a-crew-you-hide` supplies the order for a hidden crew, and its phrasing —
*"carry on … autonomously"* — is exactly wrong for a resumed one. a hidden clone should carry on;
**a resumed clone must first be told what to stop.**

| the brief must name | because |
|---|---|
| **you were dead, and for how long** | it has no way to know; from inside, no time passed |
| **what changed while you were gone** | its plan rests on a world that has moved |
| 🔴 **what you must NOT resume** | the default read of *"carry on"* is *"finish what I started"* |

### the measured failure — a DOUBLE DRIVER

**2026-09-04**, babysit tick 30–31. a husked foreman was resumed and briefed with an order that
named an observer role and opened with *"carry on."* it read that as license and re-opened its
own drive: a 4-task list, a source edit, `.taken` files unresolved.

meanwhile the **mechanic on that same tree** was 3h40m into a live turn, with tests active and
`npm run fix:format` set to rewrite files repo-wide.

⇒ **two clones, one worktree, one route bind, both about to write.** they would have clobbered
each other's files and fought over the same stones. caught at the permission modal, declined, and
stood down — but the hazard was created by the resume itself, not by the clone.

🔴 **the supervisor owns this, never the clone.** the clone behaved correctly on the information
it had. the information was the supervisor's to supply.

## 🔴 .a resume restores a FULL context — so it schedules a compact

the session you restore is the session that died, at the size it died at. a clone killed at
26.1MB comes back at 26.1MB, with no headroom — and **the very brief the resume owes it is the
load that tips it over.**

measured **2026-09-04**, babysit tick 42. `fix-contemplation-gate-on-entrance/mechanic` restored
clean at 26.1MB, took a 7-line delta brief, and entered the auto-compact on that same turn.

⇒ so the two acts a resume owes — restore, then brief — sit **in tension**: the brief is
mandatory, and the brief is the load. and an auto-compact is what killed the clone on
`feat-telepath-role` (7h51m lost), so **the resume sequence can re-kill the clone it just
revived.**

| the consequence | what it means for the supervisor |
|---|---|
| the brief must be **terse** | every line is headroom you spend on the clone's behalf |
| a resumed clone earns a **next-tick check** | it is the likeliest clone in the fleet to compact |
| a resumed clone that dies again is **not a new defect** | it is the same one, one turn later |

⚠️ this licenses no resume without a brief — an unbriefed clone drives on a stale world, which is
the hazard above. it licenses a **short** one: the delta, what must not resume, and no more.

## .refs

- `rule.require.resume-quota-capped-clones.md` — the quota cause
- `term=duct.pane.husk._.choice._.md` — the kill cause, and the state a resume cures
- `git.crew.boot.sh` — the peer that starts fresh

## .reason

- `term=crew.resume._.choice.reason.md`

---

written by human + beaver 🦫
