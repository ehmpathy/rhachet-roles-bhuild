# domain.term.choice.reason: send

## .etymology

old english *sendan* — to cause to go, to dispatch a messenger. the sense has been stable for
a thousand years and it is exactly the sense we want: **the sender parts with the payload,
and a second party receives it.**

that departure is the whole reason the word earns a cluster here. every other verb in the
`duct.*` family acts on a subject we own — `open` makes a session, `read` captures a pane,
`stop` removes a row. `send` is the only one whose subject leaves our control, and the whole
defect record follows from that.

## .why not `push`

`push` was the first reach and it is **taken twice**:

| the taken sense | where |
|---|---|
| `git push` | universal, and this repo runs it constantly |
| `radio.task.push` | the seed — a task onto a shared gh-issues channel (`term=seed`) |

both share a shape `send` does not have: a push publishes to a **channel** many parties may
read. a send addresses **one** destination, by uri, and nobody else sees it.

`rule.forbid.ambiguous-labels` grades an overload a blocker, and this one would be a
three-way. refused without argument.

## .why not `submit`

the closest rival, and the one that took a round to refuse — because the two acts are
genuinely adjacent and the boundary is thin.

what settled it: **they are two acts, and `--anyway` exists because they are.**

```
--what '<text>'   the SEND   — the payload lands in the box
Enter             the SUBMIT — the destination acts on it
```

for a single-line payload tmux appends the Enter itself, so the two collapse and the
distinction is invisible. for a **multi-line** payload they do not collapse: an Ink TUI reads
it as a bracketed paste, and a paste absorbs the Enter that follows it as a literal newline.
the message then sits in the box unsent, rendered `[Pasted text #N +M lines]`, while the send
reports success.

that is the whole reason `--anyway` sends a **separate** Enter — and it guards that Enter
twice (never while a modal is up, never into an empty box), because a submit is a decision
and a send is not.

⇒ one word for both would make the guard unstatable. a submit can be wrong where the send
that preceded it was right.

## .why not `dispatch`

TAKEN, and by the concept one layer up. `define.sprout-vs-seed` gives dispatch its two
mechanisms, and both are units of **work** — a tree that boots, or a task that queues. a send
is one message. to call a `--keys 1` a dispatch would collapse a keystroke and a worktree
into one word.

## .why not `write` / `deliver` / `transmit`

- **`write`** — a write is ours, to a file we own. `git.grove.send` writes to a **grove's**
  disk, across ssh, and the file is the grove's once it arrives. the handoff is the point
- **`deliver`** — asserts arrival. a send is not complete on its own report
  (`rule.require.verify-after-send`), so a word that claims the arrival is exactly wrong
- **`transmit`** — machine register, and it names the wire rather than the act. we do not
  care about the wire; we care that a party we do not control now holds a payload

## .the evidence

### the content-is-data half — a payload eaten by a shell we built

evidenced 2026-09-02, on a live grove. the remote `--what` arm read:

```bash
ssh -n "$DUCT_HOST" "$(__duct_tmux_cmd)send-keys -t '$DUCT_SESSION' '$what' Enter"
```

`$what` is pasted **raw** inside single quotes. so a payload that carries a `'` closes the
quote, the remote shell word-splits what follows, and tmux receives several argv entries —
which it joins with **no separator at all**:

```
sent:     'hi, please drive'
received: hi,pleasedrive
```

three bugs stacked, and each one alone would have been survivable. the fix is one
substitution, and it is the only escape a single-quoted sh region honors:

```bash
local what_q="${what//\'/\'\\\'\'}"      #  '  ->  '\''
```

⚠️ **the LOCAL arm must stay raw**, and this is the part a careless repair breaks. a local
send hands tmux one argv entry directly — argv takes no quotes, so an escape there would
deliver the backslashes as literal text. the two arms are asymmetric by construction, which
is why `[case24]` asserts BOTH directions rather than one.

### a correction i owe, on record

i first reported that local behavior boots were affected too. **they were not.**
`git.tree.behavior` sends over `duct:///` — the local arm, correctly quoted the whole time.
the mangle is remote-only, and the two grove boots on 2026-09-02 are its only instances.

that claim was a `partial audit`: i read the defect's mechanism, correctly, and rendered a
verdict over a subject set (`all sends`) wider than the one i had examined (`the remote
arm`). the wide direction, which the term names as the harder one to catch — every question
came back clean, because i had read *more* than the defect covered.

### the destination-is-a-command half — a check aimed at the wrong box

`duct.send --keys 1`, addressed to `duct://grove-…/main/mechanic`, reported:

```
✋ duct.send: session 'main-mechanic' is absent
```

the session was live. the guard called **local** tmux about a **remote** duct, and local tmux
answered truthfully about a machine the question was not about.

the sharpest fact: `is_remote` and `duct_host` were computed **one line above** the `--keys`
arm, correctly, and never read.

> **a value derived and discarded is the cheapest defect there is, and the hardest to see.**
> the parse is right, the variables are right, and the reader's eye slides past a branch that
> simply does not mention them.

it is the fifth member of a family this repo has now caught five times — a local check
rendered on a remote subject. the others: `crew.poll`'s `localhost` pin, `duct.open`'s `-d`
cwd test, `crew.boot`'s skipped cloud tree lookup, and a grove-lookup error that named
`CREWWORK_GIT_ROOT` (this box's `/home/vlad`) for a search that ran under the grove's own `~`
(`/home/camper`).

### the display half — a uri that named the wrong machine

smaller, and worth the line because it is the same error in the ECHO rather than in the act.
the success line prefixed `duct://` unconditionally, so:

| input | echoed | what it asserts |
|---|---|---|
| `duct://<host>/<tree>/<role>` | `duct://duct://<host>/…` | naught — malformed |
| `<tree>/<role>` (bare, local) | `duct://<tree>/…` | **authority = `<tree>`** — i.e. a REMOTE box |

the second is the costly one: a local duct rendered as a remote address, in the tool's own
voice. `term=duct` sets the local form as `duct:///` with an **empty** authority, and the
three slashes carry the whole distinction.

## .disputes

### dispute: `push`  —  raised 2026-09-02  —  status: RESOLVED (keep `send`)

- raised.by  = beaver
- claim      = `push` is the shorter word and reads naturally for a payload that leaves us
- counter    = taken twice (`git push`, `radio.task.push`), and its taken sense is a
               publish-to-channel that a send is not. a three-way overload is a blocker under
               `rule.forbid.ambiguous-labels`
- resolution = keep `send`; record `push` forbidden

### dispute: `submit`  —  raised 2026-09-02  —  status: RESOLVED (keep `send`; `submit` names a DIFFERENT act)

- raised.by  = beaver
- claim      = for a `--what`, the Enter is part of the send, so `submit` names the whole act
- counter    = they separate under a multi-line payload: the paste lands, the Enter is
               swallowed, and the message sits unsent under a success report. `--anyway`
               exists to send the Enter separately, and it guards that Enter twice — a guard
               that cannot be stated if one word covers both
- resolution = keep `send` for the payload. `submit` stands as the destination's act, and is
               forbidden AS A SUBSTITUTE for send

## .the caveat

`send` is declared here from three shipped dops and one rule. it has **one party** — this
repo — so it carries no `replication` (`term=replication`, the gate). the distinction against
`submit` is drawn by a shipped mechanism (`--anyway`'s two-step) rather than by an argument,
which is what makes the itemization sound; but the word's boundaries have not been tested by
a party who could not read this file.

---

written by human + beaver 🦫
