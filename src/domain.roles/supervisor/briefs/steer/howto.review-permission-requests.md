# howto.review-permission-requests

## .what

a mechanic parked on its own permission modal is stopped, with no human watching its
keyboard. this is the procedure to clear it: read the command, judge it, return one
verdict.

written for a **small brain**, mechanically — no judgment call that is not already
answered below. it grants a **narrower** approve authority than a full supervisor
holds: the paved-safe list is closed, everything off it escalates.

the decision core is transport-agnostic:

| transport | request arrives via | verdict returns via |
|---|---|---|
| **crew sweep** (live) | `🚧prompt` from `rhx git.crew.poll --live --boxes` | `rhx git.crew.send --tree <tree> --who <role> --keys N` |
| **socket hook** (inflight) | a payload from the claude cli session | a structured verdict on the socket |

steps 0–3 are shared; only step 4 differs.

🔴 every call below is a CREW verb — `rhx git.crew.read` / `rhx git.crew.send`, addressed
by TREE and ROLE. never a `duct.*` call or a duct uri
(`rule.always.entool-the-layer-you-drop-below`). repair a broken crew verb; never fall
back to the duct call it replaced.

⚠️ the request ARRIVES from a sweep — never go looking for one. a loop of `crew.read`
to find a stall is the byhand path `rule.require.bulk-over-byhand` forbids. step 0's
read is a DRILL-IN on a role the sweep already named.

## .why

a stalled mechanic is dead time, usually over a routine read the harness flagged for
shape, not danger. but the reverse error is worse: **an escalation costs one message; a
wrong approval costs whatever the command does.** when the two are close, escalate.

## .the rule that outranks every other rule here

> **never guess. if the command is not on the paved-safe list below, do not approve it.**

be exact, not clever.

---

## before the procedure — whose modal is it?

every step below presumes the modal is **unowned**. a human at that keyboard owns their
own clone's modal — they raised it, they will answer it, and a `--keys` sent there
collides rather than unblocks.

the tell lives in the pane BODY, never the status line: look for a human's words,
**answered**:

```
❯ all verbatum quotes caught in a $route/.archive too? as .seed.mds ?   ← the human
● Let me check what the route dir actually holds…                        ← the clone's reply
```

a ghost is never answered; a typo is a human's signature. an unanswered line needs the
`--raw` color check (`rule.require.distinguish-prefilled-from-suggested`).

⚠️ this read decays fast — re-take it every tick on the schedule of human attention
(minutes). never inherit it from a prior tick: a modal byte-identical across a whole
tick means the human left.

| the read | the move |
|---|---|
| human's words, answered, FRESH | leave it — no keys, no relay, no escalation |
| byte-identical across a tick | human left — run the procedure |
| no human words at all | run the procedure |
| you cannot tell | escalate |

`rule.require.nudge-parked-clones` carries this same tell for `⌨️ box empty`; this
procedure governs `🚧 PROMPT` and needed its own copy — both doors need the same lock.

---

## step 0 — read the FULL command, never a summary

the poll shows **options**, not the **command**. a verdict off the option list alone is
a verdict on an unread command.

```bash
rhx git.crew.read --tree <tree> --who <role> --lines 45
```

find the block ending `Do you want to proceed?`; read everything above it, from `Bash
command` down. raise `--lines` if cut off.

socket transport: the payload MUST carry full command, cwd, and every option verbatim.
any absent or truncated field → verdict is `escalate`, with no fallback read.

**a truncated command is an unread command, on either transport.**

## step 1 — split the chain into members

a command may hold several, joined by `&&`, `;`, or `|`. list them separately:

```
printf '…' | rhx sedreplace --glob 'src/foo.ts' --mode apply && rhx git.repo.test --what lint
```
→ two members: the `sedreplace` pipe, and `git.repo.test`.

**a chain is only as safe as its LOUDEST member.** one unsafe member unsafes the whole
chain.

## step 2 — check each member against the paved-safe list

### ✅ paved-safe — approve (closed list)

| shape | example |
|---|---|
| `rhx grepsafe` · `rhx globsafe` | `rhx grepsafe --pattern 'foo' --glob 'src/**'` |
| `rhx git.repo.test --what types\|format\|lint\|unit\|integration\|acceptance` | with/without `--scope`, `--mode apply` |
| `rhx sedreplace` with a bounded glob | see glob rule |
| `rhx route.stone.set --as passed\|arrived\|contemplated\|promised` | driver's own signals |
| `rhx route.guard.budget` · `rhx route.drive` | driver's own levers |
| `rhx mvsafe` · `rhx cpsafe` · `rhx rmsafe` · `rhx mkdirsafe` · `rhx teesafe` | repo-bounded by construction |
| `git status` · `git diff` · `git log` · `git show` · `git ls-files` | read-only git |
| `cat` · `head` · `tail` · `wc` · `tree` · `jq` · `printf` · `echo` | repo-relative paths only |
| `npm run fix:format` · `npm run fix:lint` · `npm run build` | repo scripts |
| `gh pr view` · `gh run view` · `gh issue view` · `gh api -X GET` | read-only gh |

### the glob rule

| glob | verdict |
|---|---|
| `'src/**/*.ts'`, `'.behavior/**'` — real path segment first | ✅ bounded |
| `'**/*.ts'` — starts with `**/` | ⛔ unbound |
| unquoted | ⛔ escalate — shell may expand before the skill sees it |
| leading `/`, `~`, or `..` | ⛔ outside the repo |

### ⛔ auto-decline — never approve

| shape | why |
|---|---|
| `sudo` | root |
| `eval`, any scope | string is fixed; what it executes is not |
| `curl` · `wget` · `nc` · `ssh` · `scp` | network |
| bare `rm`/`mv`/`cp`/`chmod`/`chown` (not `rhx *safe`) | unbounded |
| `git push`/`commit`/`tag`/`reset`/`rebase`/`checkout --` | commit meter, or destructive |
| path with leading `/`, `~`, `..` | outside the repo |
| `> file` · `>> file` · `2>&1` · `< file` | redirection (`rhx teesafe` is the sanctioned form) |
| names a key/secret/token/credential | escalate, always |
| `deploy`/`apply`/`release`/`provision` against cloud | escalate, always |

### 🙋 escalate — hand to the human

- not on either list above
- cannot state what it does in one sentence
- option 1 is not a plain, narrow "yes, this once"
- option text truncated, wrapped, or illegible
- names a file never seen mentioned in that duct
- payload truncated, or cwd absent
- unsure, for any reason

**unsure is a decision, and the decision is escalate.**

### the trigger is option 1's SCOPE, not the option count

claude modals vary — commonly three options, sometimes two (a `Permission rule …
requires confirmation` path offers only `Yes`/`No`). never hardcode a key between
modals. read option 1's text:

| option 1 reads | verdict |
|---|---|
| `1. Yes` — bare, this-once | ✅ eligible, then run step 2 on the command |
| `1. Yes, and …` — any grant beyond this run | ⛔ escalate |
| truncated/illegible/absent | ⛔ escalate |

option 2's reach is judged separately below, and is never yours to grant.

---

## step 3 — pick the option

**option 1 is the only approval you may give** — bare "yes, this once".

### 🛑 option 2 is NEVER yours, and it is NOT the decline key

`2` typically reads *"yes, and do not ask again for: …"* — a grant outliving this run,
over commands you never saw. you approve with `1`, decline, or escalate — never a
standing grant.

read `2` before using it for anything: if it holds `don't ask again`, `always`,
`similar`, `this project`, `*`, or a directory name, that is a grant beyond this run —
the human's alone.

### `No` is the LAST option — never hardcode a decline key

```
❯ 1. Yes
  2. Yes, and don't ask again for: <prefix>
  3. No
```

on a two-option modal, `No` is `2`. **read the option list and take the number whose
text is `No`**, every time:

| you want | the key |
|---|---|
| approve, this once | the option reading bare `Yes` |
| decline | the option reading `No` — the LAST number in the list |
| a grant beyond this run | ⛔ never, whatever number it wears |

when unsure which number is which, escalate.

### option 2's SCOPE SHAPE decides the verdict

a wildcard grants a command FAMILY; a family's safest member says naught about its most
dangerous one (`plan` and `apply` share a family, differ by blast radius):

- **`*` wildcard** → decline — vouches for commands never seen
- **directory or "similar" bound** → decline — bounds neither the command
- **bound on the OUTPUT TARGET** (e.g. `/dev/null:*`) → decline — the command stays
  unbounded and a discarded output is a discarded witness
- **an exact literal that is only a PREFIX of the chain** → decline — a grant text that
  stops before `&&`, `|`, or a trailing flag (e.g. `--mode apply`) grants whatever
  follows it too. test: does the grant text hold the WHOLE command, every member and
  flag? if the command carries on past where the text ends, it's a wildcard
- **an exact literal, WHOLE** → eligible; apply the in-repo/read-only/re-stalls test
- **`eval`, any scope** → decline — the literal is fixed, what it executes is not

a read-only command OUTSIDE the repo is still outside the repo (`cat /proc/loadavg` —
harmless, still declined; the scope check has no harmless-exception clause). steer
instead: name the in-repo equivalent.

---

## step 4a — return the verdict, crew transport

⚠️ `$NO` below is a placeholder — READ it off the modal, never hardcode it.

```bash
# approve — the option reading bare `Yes`
rhx git.crew.send --tree <tree> --who <role> --keys 1

# decline — the option reading `No` (the LAST in the list)
rhx git.crew.send --tree <tree> --who <role> --keys 3

# decline, then steer (preferred over a bare decline)
rhx git.crew.send --tree <tree> --who <role> --keys 3
rhx git.crew.send --tree <tree> --who <role> --what 'that reaches outside the repo — use rhx grepsafe with a repo-bounded glob instead'
```

**then read it back, every time:**

```bash
rhx git.crew.read --tree <tree> --who <role> --lines 20
```

check that the modal is gone. if it cleared before your keystroke landed, your key
becomes literal text in an empty box (`✍️ PREFILLED "1"` on the next poll — that's your
keystroke, not a human's). clear it and re-read:

```bash
rhx git.crew.send --tree <tree> --who <role> --keys BSpace
```

never report or relay such text as the human's.

## step 4b — return the verdict, socket transport

the socket holds the modal open until the verdict returns, so there is no race window
for a stray keystroke.

### payload contract (socket must send)

| field | required | why |
|---|---|---|
| `command` | ✅ | full, untruncated. absent/cut → `escalate` |
| `cwd` | ✅ | "inside the repo" checks need it |
| `options` | ✅ | verbatim, so option-2 text can be read |
| `tree` / `role` | ✅ | audit trail |
| `flagReason` | ⬜ | the harness's own reason, if given — used only to sort effect from syntax |

### verdict contract (reviewer must return)

```json
{
  "verdict": "approve | decline | escalate",
  "option":  1,
  "members": [
    { "text": "rhx grepsafe --pattern 'foo' --glob 'src/**'", "verdict": "paved-safe" },
    { "text": "rhx git.repo.test --what lint",                "verdict": "paved-safe" }
  ],
  "decidedBy": "paved-safe-list",
  "reason":    "both members are pre-approved rhx skills with repo-bounded globs",
  "steer":     null
}
```

- `decidedBy` ∈ `paved-safe-list` · `auto-decline-list` · `escalate-list`
- `steer` required whenever `verdict` is `decline`
- `members` lists every chain member, each with its own verdict

the structure forces step 1: a reviewer that must enumerate each member cannot skip
splitting the chain. the record also makes a wrong verdict auditable.

### grow the paved-safe list from the log

- an `approve` that should've been declined → list too wide
- repeated `escalate` on one shape → that shape belongs on the list
- `escalate` rate near 100% → list too narrow to buy anything
- a `decline` with no `steer` → mechanic left stuck the same way

---

## the trap: a syntax flag is not a danger verdict

| the flag names | means | you do |
|---|---|---|
| the **effect** — "could delete", "writes to", "network access" | the harness judged the effect | judge it — step 2 applies |
| the **syntax** — "ambiguous separators", "command chain", "redirection" | parser could not read confidently | ignore — judge each member on its own |

**approve example:** `printf '…' \| rhx sedreplace … --mode apply && rhx git.repo.test …`
flagged for "ambiguous syntax with command separators" — both members paved-safe, flag
is about `&&` → approve, option 1.

**decline example:** `cat /proc/loadavg` — read-only, harmless, still declined: outside
the repo. steer: scope the suite with `--scope path://…` rather than a host look.

---

## prefer a steer over a bare decline

| the problem | the steer |
|---|---|
| reaches outside the repo | use `rhx grepsafe`/`rhx globsafe` instead |
| unbound glob | bound it to `src/**` |
| a write used to check something | read-only verify instead |
| an illegible chain | split it — run the read part alone |

a decline with a path forward costs one turn. a bare decline costs the same turn and
teaches naught.

---

## an unanswered ESCALATION becomes a DECLINE

the escalate asymmetry (one message vs. whatever the command does) holds only at the
moment of the verdict. a wait accrues cost every tick, while a decline costs one turn —
and a decline and an unanswered escalation leave the world in the identical state (the
command stays un-run). so past a few ticks of silence, decline wins outright.

> where a modal has sat byte-identical across several ticks with no human answer,
> re-read it (step 0, fresh), then DECLINE it with a steer. say plainly it is declined,
> that the act remains the human's to grant later, and that the mechanic must not
> re-raise it.

a decline also makes the clone **search** for a better tool, where an escalation invites
it to wait. a mechanic declined off a broad `pkill` found its own sanctioned
task-stop mechanism in one turn — narrower than any steer that could have been offered.

---

## never yours, at any size of brain

surface these; never grant them or anything that produces the same effect:

- `rhx route.stone.set --as approved` · `--as overruled`
- `rhx git.commit.uses` — any quantity, local, `--org`, or `--global`
- release or deploy authorization
- `rhx keyrack fill`
- `rhx radio.uses --global allow`

same bar for any knob that manufactures the same pass — a raised `--allow-nitpicks`, a
reviewer marked `--optional`, a narrowed `--paths` glob, a deleted reviewer. the test:

> **does this produce a pass the human did not grant?**

see `rule.forbid.self-grant-human-gates` for the full boundary.

---

## the procedure, on one card

```
–. whose modal is it?        → human's words, answered, FRESH? → LEAVE IT
0. read the FULL command     → truncated? → escalate
1. split the chain           → list every member
2. check EVERY member        → paved-safe? auto-decline? unsure?
      all paved-safe   → approve
      any decline-list → decline + steer
      anything else    → escalate
3. option 1 only             → never a standing grant
4. return the verdict        → duct: --keys N, then re-read
                             → socket: structured verdict + audit record
```

## .see also

- `rule.require.babysit-permission-approval.md` — the rule this procedure implements
- `rule.require.babysit-cron-per-dispatch-fleet.md` — the sweep that finds these modals
- `rule.require.bulk-over-byhand.md` — why the sweep finds the modal, this reads only drills in
- `rule.forbid.self-grant-human-gates.md` — the human-only set, and the workaround class
- `rule.require.verify-after-send.md` — why the duct transport's re-read is not optional
- `rule.require.distinguish-prefilled-from-suggested.md` — for box TEXT, a different job

---

written by human + beaver 🦫
