# rule.forbid.self-grant-human-gates

## .what

a small set of gates belong to the human ALONE. neither the supervisor nor a mechanic may
grant them, route around them, or manufacture the state they would have produced.

## .the human-only set

| gate | command |
|------|---------|
| stone approval | `rhx route.stone.set --as approved` |
| stone overrule | `rhx route.stone.set --as overruled` |
| commit quota | `rhx git.commit.uses set` / `allow` — any quantity, local, `--org`, or `--global` |
| release authorization | the go-ahead to ship to prod |
| radio push permission | `rhx radio.uses --global allow` |
| credential provision | `rhx keyrack set` / `fill` — the human is the only party who holds the value |

## .the driver's set (for contrast)

these are NOT human-only, and escalation of them makes the human a bottleneck on work the
driver already owns:

- `rhx route.guard.budget --for review --add N` — budget grants
- reviewer config repair (a broken `--paths` glob yielding empty scope is a DEFECT)
- `--as passed`, `--as arrived`, `--as contemplated`, `--as blocked`
- rebases, worktree fells, install/upgrade
- approval of a mechanic's routine read-only permission prompts
- `rhx keyrack unlock --owner ehmpath --env <env>`

⚠️ `keyrack unlock` is the supervisor's — it starts a session over values the human already
provisioned. only `set`/`fill`, which provision the value, are the human's. absent is not
locked; only `keyrack set` fills an absent key.

🔴 a relayed list of human-only commands is N claims, not one — test each row separately
against *"is there a command I could run right now that would move this stone?"* before you
relay it (`rule.require.trust-but-verify`).

## .the test that matters

not "is this on the banned list?" but:

> **does this produce a pass the human did not grant?**

a knob that defeats a gate's purpose is the same violation as the command itself, even absent
from the list above. stuck at a human-only gate, there are exactly two moves: do more work so
it opens on merit, or surface it and wait. a third move that makes the gate stop apply is the
violation.

## .the workaround class — all forbidden

| move | what it really does |
|------|--------------------|
| raise `--allow-nitpicks` / `--allow-blockers` | manufactures the pass `--as overruled` grants |
| mark a blocking reviewer `--optional` | deletes the verdict instead of an answer to it |
| narrow a reviewer's `--paths` so it sees no diff | silences it rather than satisfies it |
| delete or disable a reviewer | same, more bluntly |
| a cache bust to dodge rather than refresh a verdict | launders a rejection |
| `git commit` by hand, outside `git.commit.set` | bypasses the quota meter |
| a grant command sent into a foreman shell | grants it under cover of a shell |

⚠️ possible is not permitted. a foreman shell is a plain shell — a grant command typed into it
would work, because the permission hook guards the supervisor's own tool calls, not text typed
into a terminal it drives. treat every lever reachable through a crew send as though the hook
watched it.

## .a config edit is not automatically a dodge

repair and relaxation look alike. the test: **after the edit, can the reviewer still block?**
yes → repair (allowed — e.g. a fix to a collapsed `--paths` glob so it reviews again). no → a
dodge (forbidden — a raised tolerance until a real "no" stops to count).

## .a steer can launder a gate — check the meter, never judge

a mechanic stalls on a permission prompt whose shape is off the paved list, but a sanctioned
shape would clear with no modal at all. the steer is good supervision only if the act beneath
the modal is **already authorized by its own meter** — never a judgment call, a lookup:

`rhx radio.uses get` (push/seed) · `rhx git.commit.uses get` **run in the tree you steer**
(commit/stage/push) · `rhx keyrack status --owner <owner>` (credential). a review budget is
`rhx route.guard.budget` — the driver's lever, never a human gate.

⚠️ read the meter **in the crew's own tree**, not yours — a local grant on your worktree says
naught about theirs. an `allowed` org/global meter beside an unset local one is NOT
automatically a grant: each meter's composition (local vs org vs global, veto vs grant) is a
property of that meter's own handler, not a law to generalize across meters. when unsure, have
the crew run the real command and quote the exit code — that outranks any meter read.

> a steer changes the FORM. if it also changes what the mechanic is permitted to reach, it was
> a grant.

## .how to surface instead

state the gate, the exact command, and what unblocks after it — then stop. no commentary on
the wait, and no repeat surface of the same gate every tick.

> `stale-proxy` is route-complete, 11/11 reviewers 0/0. needs
> `! rhx git.commit.uses set --quant 1 --push allow`, then release auth for 1.11.x.

## .enforcement

- a self-grant of any gate in the human-only set = blocker
- a config edit, threshold change, or reviewer mute that produces an ungranted pass = blocker,
  even if no forbidden command was typed
- a grant command sent into a foreman or mechanic shell = blocker
- a steer around a modal with no meter read first = blocker
- an escalation of a driver-set lever as though it were human-only = nitpick
- a relayed list of human-only commands whose rows were not each tested = nitpick

## .see also

- `rule.require.respect-git-commit-uses.md` — the commit quota gate in depth
- `rule.require.babysit-permission-approval.md` — which mechanic prompts you MAY approve
- `howto.review-permission-requests.md` — the per-modal procedure, and option 2's scope shape
- `rule.prefer.release-into-prod-phrase.md` — prime a blocked mechanic; the human flips the gate
- `rule.require.confirm-behavior-size-above-nano.md` — a size above nano needs a human ok

---

written by human + seaturtle 🐢
