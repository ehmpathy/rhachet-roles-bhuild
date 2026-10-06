# domain.term: send

term.chosen   = send
term.kind     = verb
term.synonyms.forbidden:
- push
- write
- post
- deliver
- transmit
- submit
- dispatch
- type

## .what

to **put a payload into a destination that is not ours** — a keyboard, a filesystem, a pane
— across a boundary we do not control.

```
rhx git.crew.send   --tree <slug> --who mechanic --what '<msg>'   ← the SUPERVISOR's
rhx duct.send       --on <duct> --what '<command>'   into a clone's keyboard  ← the substrate
rhx duct.send       --on <duct> --keys 1             one keystroke, no Enter
rhx git.grove.send  --file <src> --into <dst>        a document onto a grove's disk
rhx term.send       --on <term> --what '<text>'      into a human's window
```

four dops, one verb. what they share is the boundary: the payload leaves our process and
lands somewhere a different party owns.

⚠️ **the first two are ONE dop at two layers, not two dops.** `git.crew.send` wraps
`duct.send` and derives the box from the ledger, so a supervisor addresses a TREE and a ROLE
and never types a duct uri (`rule.always.entool-the-layer-you-drop-below`). the order above is
the mandate, not a preference.

⚠️ **`git.crew.send --who all` exits 2 on purpose.** a keystroke sent to a whole crew answers
whatever modal each clone happens to hold, and the two are never at the same prompt. the crew
grain is the right place to encode that refusal; a duct was never the right grain for it.

⇒ the symmetric twin is **`term=read`** — the same boundary, the opposite direction. a send
puts a payload IN; a read takes an observation OUT. read them together: the pair is why
`rule.require.verify-after-send` exists at all, since a send is only ever verified by a read.

## .the payload KINDS take opposite handling

this is the distinction the word most needs, because the two most-used kinds look alike at
the call site and are handled by opposite rules:

| kind | flag | what it is | what the destination does |
|---|---|---|---|
| **command** | `--what` | text a shell will run | typed, then **Enter** appended |
| **keystroke** | `--keys` | a raw key name (`1`, `Enter`, `BSpace`) | delivered alone, **no Enter** |
| **document** | `--file … --into` | bytes onto a disk | written, never executed |

⚠️ **`--what` and `--keys` are not two spellings of one act.** a `--keys 1` on a modal renders
a verdict; a `--what '1'` types the character `1` into a box and submits it. the first
answers a question, the second manufactures a stray keystroke
(`rule.require.distinguish-prefilled-from-suggested`).

## .the guarantee: CONTENT is data, a DESTINATION is a command

every defect this verb has produced sits on one line:

> **the payload is DATA and must arrive byte-identical. the destination is a COMMAND and
> must be checked before the payload moves.**

both halves have been broken, and each broke in its own direction:

| the half | how it broke | the cure |
|---|---|---|
| content is data | a remote `--what` was pasted raw into a single-quoted ssh string, so a `'` in the payload closed the quote and the remote shell word-split it — tmux then joined the pieces with **no separator**: `'hi, please drive'` → `hi,pleasedrive` | escape `'` → `'\''` on the remote arm ONLY. the local arm hands tmux one argv entry, and argv takes no quotes |
| a destination is a command | `--keys` asked **local** tmux about a **remote** duct, and reported the live session absent | route by host, from the `is_remote` the parser already computed |

⚠️ note that the second is not a `false report` of `duct.send`'s content — the tool sent
exactly what it was handed. **the eater is the shell WE construct**, one layer beneath the
tool's own report, which is why no read of its output could have caught it
(`term=false-report`, the reader-inference family).

## .a send is NEVER complete on its own report

`rule.require.verify-after-send` is named for this verb, and it is the one rule every send is
bound by:

```
rhx duct.send --on 'duct:///<tree>/<role>' --keys 1
rhx duct.read --on 'duct:///<tree>/<role>' --lines 20   ← not optional
```

the reason is mechanical: a send is **asynchronous by construction**. between the read that
justified it and the moment it lands, the destination may have moved — a modal can clear, a
turn can end, a box can fill. so a keystroke aimed at a modal becomes literal text in an
empty box, and the next poll reports `✍️ PREFILLED "1"` — a human-typed signal the
supervisor manufactured itself.

> **before you send a key, name what it lands on.** every send defect on record is one
> error: a payload aimed at a target that was not there when it arrived.

## .send is NOT

- **`push`** — TAKEN twice: `git push`, and `radio.task.push` (the seed). a push publishes to
  a shared channel; a send addresses ONE destination
- **`dispatch`** — TAKEN, and it names the whole act of putting work into the world
  (`term=sprout` / `term=seed`). a send is one message, never a unit of work
- **`submit`** — a submit is what the DESTINATION does with a payload already in its box. the
  Enter that follows a `--what` is a submit; the text itself was the send. `--anyway` sends
  the two separately for exactly this reason: a multi-line paste absorbs the Enter that
  follows it, so the message sits unsent and the send reports success
- **`type`** — narrows to a keyboard, and two of the three dops write to a disk
- **`write`** — a write is ours to a file we own; a send crosses to a party we do not

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `git.crew.send.sh` — the crew-layer verb, added 2026-09-03. the one a supervisor calls
- `duct.send.sh` — `--what` and `--keys`, and how it routes by host
- `work/ductwork.sh` — `__duct_send`, and the sh-safe escape on the remote arm
- `git.grove.send.sh` — the document kind: a file onto a grove
- `work/termwork.sh` — `term.send`, into a human's window
- `work/work.surface.remote.integration.test.ts` — `[case23]` (no local tmux call before a host
  guard), `[case24]` (the remote/local escape asymmetry)

## .reason

see `term=send._.choice.reason.md` — etymology, the rejected `push` and `submit`, and the
evidence.

---

written by human + beaver 🦫
