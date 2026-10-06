# domain.term: duct.pane.husk

term.chosen   = husk
term.kind     = noun
term.boundary = duct.pane
term.synonyms.forbidden:
- zombie pane
- dead pane
- ghost box
- stale box
- corpse

## .what

a **pane whose claude has exited, with claude's chrome still drawn in its scrollback** — the
input-box rule, the `❯`, the status line — and a live shell prompt beneath it all.

```
╭─── Claude Code v2.1.87 ───╮   the session STARTED
…
Resume this session with:
claude --resume 7fd77cae-…     and then it ENDED
➜                              the pane sits at a SHELL prompt
```

it has a box's shape and a box's chrome, and it is not a box.

## .it is the extant `husk`, over a second subject

this word is **reused, never coined**. the parent (`term=husk`) names a `_worktrees/` dir that
git does not own: *"it has a tree's shape and a tree's name, and it is not a tree."* run the two
side by side:

| the subject | what `husk` says of it |
|---|---|
| a **worktree** | files remain, and what made them a tree is gone |
| a **duct.pane** | chrome remains, and what made it a box is gone |

⇒ **ONE concept, two subjects**: *inert bytes that retain the shape of a live artifact, after the
process behind it is gone.* per `rule.forbid.domain-term-ambiguity`, two senses that differ by
CONTEXT rather than by concept take a **boundary**, never a second word — so the parent is owed
the qualifier `tree.husk`, and this is its peer.

## .the discriminator — a suffix test

> **does the pane's LAST line belong to claude, or to the shell?**

a live claude's final rows are its input box and its status line. a husk's final row is a shell
prompt — `➜`, `$`, `%` — **below** the leftover chrome. position settles it: the newest line
wins, and the chrome is older than the prompt.

two weaker corroborators: `Resume this session with:` sits in the scrollback, and the pane's
stone line is a transition the exited session settled rather than one a live clone holds.

### 🔴 then ask a SECOND question — what killed it? the two answers take opposite cures

the shell prints its own exit indicator on the very line the test above tells you to read:

| the last rows | who ended it | what you owe |
|---|---|---|
| `^C%` | 🟢 the **human**, at that keyboard | 🔴 **read what they ran next.** they may have granted the gate by hand, and no poll can see it |
| `💥143` | SIGTERM — earlyoom is this box's only guard | the gate is **live and hidden**. surface it |

⇒ a `143` husk makes the `🙋` tally too **short**; a `^C%` husk can make it too **long**, because
the stone it preserves may already be discharged. measured 2026-09-07 — see `.reason`.

### 🔴 .the suffix test has a SHARPER form — scope the ❯ search to AFTER the banner

the discriminator above says *"the newest line wins"* and reads that off the pane's LAST line.
`__crew_heal_one` (crewwork.sh) implemented the ❯ half of that test as a grep over the WHOLE read
window instead — and a husk's window still holds the LIVE claude box it drew before it died, so
that stale ❯ matched and the pane read as live.

measured 2026-09-13, `rhachet-roles-bhrain.beav.feat-telepath-role/mechanic`: dead at exit 143,
`Resume this session with:` printed, and the fleet poll (`git.crew.poll.sh`, same discriminator
at its box classifier) reported `✋ blocked:on-defect` — driving normally — for two ticks running.

> **a pane's resume banner is the shell's own marker that the program above it ended. a ❯ found
> BEFORE that banner is archaeology, never a status.**

⇒ the fix: find the banner's own line number first, then grep for ❯ only in the text AFTER it. a
❯ that appears there means claude restarted post-crash and is genuinely live; a ❯ that appears
only before it is the dead session's last frame.

🔴 **`__crew_heal_one` carries this fix now, clamped by a regression test**
(`crewwork.husk.integration.test.ts` `[case11]` — fails red on the whole-window grep, green on the
banner-scoped one). `git.crew.poll.sh`'s own box classifier (~line 1653) shares the identical
defect and has NOT yet been repaired — tracked as a pending supervisor task. any future reader
who touches either classifier owes the other the same fix.

## .why it is NOT a phantom, and not `shell`

| | the registry row | the tmux session | the claude | the chrome |
|---|---|---|---|---|
| **phantom** | ✅ | ⛔ | ⛔ | ⛔ |
| **shell** | ✅ | ✅ | ⛔ | ⛔ |
| **duct.pane.husk** | ✅ | ✅ | ⛔ | ✅ |
| 🔴 **wedge** | ✅ | ✅ | 🔴 **✅ ALIVE** | ✅ |

⇒ a husk and a `shell` differ on **one column**, and it is the column the classifier reads. that
is why the poll prints `shell` correctly for a pane where claude never ran, and prints `empty`
for this one.

🔴 **the fourth row is the pair a supervisor confuses with this one**, and it differs on the same
column — a `wedge` is a program **alive and unreachable**, where a husk's is dead
(`term=duct.program.wedge`). the two take **opposite cures**: a husk's pane is free, so a
`crew.boot --resume` lands in it; a wedge's program still holds the pane, so a resume has nowhere
to go and only `crew.reboot` clears it. ⇒ **to reach for the wrong one is a wasted call in one
direction and a lost conversation in the other.**

## .what it costs

`git.crew.poll` classifies a husk as `empty` — the token for *a live box, unfilled* — so the
crew renders `😶 at work`, a stone renders for a role that can advance none, and its `💀 down`
signal never fires. a grant relayed to a husk lands nowhere.

### ⚠️ that cost is CONTESTED — measured 2026-09-05, and the poll behaved otherwise

`rhachet-roles-bhrain.beav.feat-thinker-notes-overflow/mechanic` became a husk: exit **143**
(SIGTERM), `Resume this session with: claude --resume "mechanic"` drawn above a live shell
prompt, tmux session alive. a textbook instance by every row of the discriminator table above.

| what the paragraph predicts | what the poll printed |
|---|---|
| `😶 at work` | 🔴 **`🧊 frozen`** |
| a stone renders for the dead role | 🔴 **no stone line at all** |
| `💀 down` never fires | it was counted among the frozen |

⇒ **so the `empty` misclassification was repaired at some point, and this paragraph was not.**
it now overstates the harm, which is its own hazard: a reader who trusts it hunts for a husk
among the `😶 at work` crews, where none will be.

🔴 **and the REAL cost is one this paragraph never named.** the husk's last claude status line
read `1.vision, judge, approved? 👋` — the tree waits on a **human gate**, and the poll's
`🙋 N await approval` tally did not count it, because the tally reads live status lines and this
one belongs to a dead session.

> **a husk conceals a human gate.** the crew drops out of `blocked:on-human` and into `frozen`,
> so a supervisor who works the 🙋 list will never surface it, and the tree waits on an approval
> nobody was asked for.

### ⚠️ .the concealment is NOT husk-specific — measured again, 2026-09-05

a SECOND tree hid the same gate by a different cause. `declastruct-aws.beav.feat-ssm-document`
rendered `😴 unread` and contributed no stone line, while its status line plainly read
`🗿 1.vision, judge, approved? 👋` and its route was fully converged (i010, 0 blockers and
0 nitpicks on both lanes, budget 9/9, all takens written). the cause was a **compact**, never a
death — the pane simply went quiet.

⇒ so a husk is ONE instance of a wider gate, and the poll prints that gate itself:

> `❔unread × 13 — state is not 'empty', so no stone renders for these roles`

**any clone whose box classifies as other than `empty` drops out of the 🙋 tally**, whatever put
it there — a husk, a compact, a quiet pane, a modal. the husk is merely the instance where the
clone is also DEAD, so nobody remains to re-print the line.

🔴 **the count that follows:** the poll read `🙋 6 await approval` on a fleet where **7** trees sat
parked at a human gate. a supervisor who works the 🙋 list works a list short by however many
parked clones happen to be quiet — and the quiet ones are, by construction, the ones that have
waited longest.

⇒ `rule.require.enumerate-before-you-name`, applied to a COST rather than a word: the husk
paragraph above was written off one instance and named the cause too narrowly. two instances
part the cause (death · compact) from the mechanism (the box→stone gate), and only the mechanism
is worth a repair.

⚠️ do NOT repair this by a parse of the husk's status line — the `Resume this session with:`
overlay MANGLES it (measured: `oved? 👋`), so the one place the gate survives is the one place
it cannot be read reliably. what is owed is a measurement of where the gate is recorded on
disk, which is a `route` question rather than a `duct` one.

### 🔴 .a SECOND mechanism, and it is not the box→stone gate at all

⚠️ **the paragraph above says *"only the mechanism is worth a repair"*, and that was measured
off two instances that shared one mechanism.** a third instance, 2026-09-05, does not share it.

`rhachet.beav.fix-keyrack-all-skips-manifest` rendered **`✋ blocked:on-defect`**, and both its
stones rendered cleanly — `5.3.verification, review.peer, l3@i011, blocked ✋`. no box was
misclassified. no stone was withheld. the box→stone gate worked exactly as designed.

it is still a human gate, and the clone said so precisely:

> *"what remains is genuinely gated on (d): l1 lanes sit at malfunction, which blocks passage,
> and **only the commit shrinks the guard's own scope enough for them to run honestly**."*

⇒ the cure is `git.commit.uses set --quant 1 --push allow` — human-only
(`rule.forbid.self-grant-human-gates`). so the gate is real, and it landed in the **✋ column,
which the poll labels *the driver's***.

| | where the gate goes | why the relay misses it |
|---|---|---|
| **husk · compact** | nowhere — no stone renders | the box→stone gate withheld it |
| 🔴 **defect-with-a-human-cure** | the **✋** column | it renders perfectly, in the tally that says *"work this yourself"* |

🔴 **the two mechanisms are independent, and a repair to the first does not touch the second.**
one withholds the row; the other files it under the wrong owner. a supervisor who works the ✋
list will try to fix this one, discover no lever exists, and move on — which is worse than an
absent row, because it consumes the attention an absent row never asks for.

⇒ so the generalization the two-instance version reached for is available now, and it is one
layer up from where that version put it:

> **the `🙋` tally undercounts human gates by EVERY mechanism that files one elsewhere** —
> whether a box that renders no stone, or a stone that renders under the wrong owner.

⚠️ **the count that follows, measured the same day:** the poll read `🙋 8 await approval`.
`feat-subconscious-term-distill` rendered `😴 unread` while its status line read
`1.vision, judge, approved? 👋` and its pane stated *"blocked ONLY on: `route.stone.set --stone
1.vision --as approved`"* — mechanism one, live. `fix-keyrack` sat in the ✋ column — mechanism
two. **the honest count was at least ten, in two directions, and no single repair reaches both.**

### 🔴 .the undercount DECAYS — four consecutive polls, 2026-09-05

the section above says a `🙋` row *"carries a decay clock"*, and it says so off **one** anecdote —
a single tree at 255m. a fleet-wide measurement now stands behind it, and it is stronger than the
anecdote was.

four consecutive polls, roughly fifteen minutes apart, **with zero gates granted between any two**
and no route advanced past `1.vision`:

| poll | `🙋 await approval` | `❔unread` |
|---|---|---|
| 1 | **8** | 10 |
| 2 | 7 | 10 |
| 3 | 6 | 11 |
| 4 | **5** | **12** |

🔴 **nought was granted, and the visible count fell by three anyway.** the rows did not close —
they migrated, one column to the other, in the one direction the mechanism allows.

⚠️ **n=4, and the step of exactly one per poll is very likely coincidence** — do not read a rate
off it. what the measurement supports is the **direction**, which each mechanism predicts on its
own: a clone that finishes a turn goes quiet, its box leaves `empty`, and its row renders no more.
there is no event that returns it — **except a message from the supervisor**, which is how three
of these trees reappeared in later polls after a steer.

⇒ so the visibility of a gate tracks **recent supervisor contact**, never the age or the urgency
of the gate. that inverts the one property a queue must have.

🔴 **what this obliges a supervisor to do, until the gate is repaired:**

> **keep the `🙋` list YOURSELF, across polls, and never let a poll SHRINK it.**
> a poll may ADD a row. only a **granted gate** may remove one.

⚠️ a relay list built from a single poll is a **sample**, not an inventory — and the trees it
omits are, by construction, the ones that have waited longest and are nearest to a husk.

## 🔴 .what MAKES one — measured 2026-09-05, and it closes a loop

every section above describes the husk STATE. none of them said what produces it. one pane
answered that, and the answer inverts how a parked gate should be read.

`feat-thinker-notes-overflow/mechanic` husked a **second** time — same tree, same exit 143 —
and its scrollback held the count, quoted verbatim:

```
● One thousand two hundred twenty-fifth run. Unchanged.
  🦉 parked on 1.vision. 🍵
✢ Puzzling… (running stop hooks… 0/2 · 1h 12m 38s · ↓ 673 tokens)
```

**1,225 stop-hook runs on a clone that had no move to make**, then 72 minutes wedged at the
`0/2` hook stage, then SIGTERM.

⇒ the mechanism, and every step of it is forced:

| the step | why it follows |
|---|---|
| a clone parks at a human gate | the gate is not its to open (`rule.forbid.self-grant-human-gates`) |
| it tries to rest | there is no work it may legitimately do |
| a stop hook fires | that is what a stop hook is for |
| it rests again | the hook cannot grant the gate either |
| **× 1,225** | no step in the loop can settle it |
| a hook run wedges, then 143 | the pane becomes a husk |

## 🔴 .the loop this closes — a husk CONCEALS the gate that produced it

hold that mechanism against `.the concealment` above, and the two halves meet:

```
an ungranted gate  ->  a parked clone  ->  a stop-hook loop  ->  a husk
       ^                                                           |
       |                                                           v
   less likely to be granted  <-  invisible to the 🙋 list  <-  no stone renders
```

⚠️ **the longer a gate waits, the likelier its clone dies — and its death is what hides the gate
from the supervisor who would have relayed it.** that is a second spiral in the fleet, distinct
from the zero-commit one (`rule.always.break-the-zero-commit-review-spiral`), and it shares that
one's core shape: **the system's own effort deepens the trap.**

⇒ so a `🙋` row is not a passive queue entry to relay at leisure. **it carries a decay clock**,
and the trees that have waited longest are simultaneously the ones nearest death and the ones
least visible. `behavior-route-upgrades` sat at 255m on the same fleet, quiet.

### 🔴 .a husk that RENDERS its gate — 2026-09-08, and it inverts the concealment

every section above turns on *"a husk conceals a human gate"* — the row drops out of `🙋`.
a second `143` husk did the opposite.

`rhachet-roles-bhrain.beav.feat-peer-review-parallelism/mechanic`, dead at `143` after
`4d11h48m55s`, its final message *"`rhx route.stone.set --stone 1.vision --as approved` is the
only move left"*. across two consecutive polls it rendered:

```
🙋 blocked:on-human — rhachet-roles-bhrain.beav.feat-peer-review-parallelism
     🗿 mechanic: 1.vision, judge, approved? 👋
🙋 PLEA SEEN — …/mechanic printed a HUMAN-only grant command
```

| | the 2026-09-05 husk | this one |
|---|---|---|
| poll status | `🧊 frozen` | 🔴 **`🙋 blocked:on-human`** |
| stone line | none | 🔴 **renders, from the dead session's status line** |
| the `🙋` tally | undercounted | **counts it** |

⚠️ **do NOT read this as a repair.** two instances, opposite outcomes, and this run did not
measure the classifier — a pane difference explains it as readily as a code change. what is
settled is only that **both behaviors exist**, so neither may be assumed.

#### 🔴 the visible-gate case is BETTER, and it carries a NEW trap

✅ the gate is on the list, so it gets relayed — the whole harm of the concealment case.

🔴 **but a grant alone will not move the tree.** the clone that would act on it is dead, and a
`🙋` row says no word about whether anyone is alive to receive the grant. **the row looks
identical to a live parked clone's**, and only a pane read parts them.

⇒ so the order matters, and it is the inverse of the stopgap advice below:

| when the clone is… | the sequence |
|---|---|
| **alive**, parked | grant. it proceeds on its own |
| 🔴 **dead** (a husk) | **grant FIRST, then `crew.boot --resume`** |

⚠️ **to resume BEFORE the grant buys naught** — the resumed clone parks on the same ungranted
gate and re-enters the 1,225-run loop that killed it. the resume is what converts a granted gate
into motion; it is not what makes the gate grantable.

### what this does and does NOT license

- ✅ **a resume recovers the tree** — `rhx git.crew.boot --tree <tree> --resume mechanic` restored
  this one with its conversation intact and its status line un-mangled
- ⚠️ **but a resume is a STOPGAP, not a cure.** the resumed clone parks again, loops again, and
  dies again on the same clock. it buys **visibility**, which is what gets the gate granted
- 🔴 **untested, and do NOT assume it:** whether the 1,225 count is the cause or a symptom — a
  hook that leaks a handle per run would wedge on its own schedule. one measurement settles it
  (watch a parked clone's hook count against its memory), and it has not been run

⇒ the arrear is a stop hook that **recognizes a parked-on-human clone and stands down**, rather
than a supervisor who resumes husks forever.

## .refs

- `git.crew.poll` / `work/ductwork.sh` — the box classifier that reads the chrome
- `term=husk._.choice._.md` — the parent, over the worktree subject
- `term=duct.program.wedge._.choice._.md` — the pair on the alive/dead axis, and the opposite cure

## .reason

- `term=duct.pane.husk._.choice.reason.md`

---

written by human + beaver 🦫
