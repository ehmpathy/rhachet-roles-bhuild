# rule.require.babysit-permission-approval

## .what

when a dispatched mechanic (or foreman) pauses on its OWN permission prompt with no
human at its keyboard, the supervisor acts as a **secondary approver** — review the
queued command and decide, so the human is not a blocker on safe work.

## .why

a mechanic's permission prompts fire against its own keyboard, which no human
watches. absent a decision it stalls forever on safe, routine reads. the supervisor
already watches these ducts, so it approves the safe ones and escalates only the
genuinely risky ones — it frees the human for real gates (vision approval, commit
quota, release) instead of routine prompts.

## .the mandate

review every queued mechanic permission prompt against the safety test below.

- **safe → approve** (`rhx git.crew.send --tree <tree> --who mechanic --keys 1`)
- **unsafe → do NOT approve.** deny with the option whose text reads `No` (read it —
  never hardcode a number; on the standard three-option modal `2` is "yes, and don't
  ask again", a persistent grant, not a decline), or steer to a safer in-repo
  read-only approach and let it re-prompt. full procedure in
  `howto.review-permission-requests`
- **unsure → treat as unsafe.** escalate with the exact command and why it gave pause.
  never approve what you cannot verify safe.

## there is no blanket approval — every modal is judged alone

a run of approvals on one crew grants the next one naught. a human's grant of one
modal is a grant of **that** modal. "approve as needed" names a CADENCE (don't wait
for me on each one), never a scope (skip the check) — the two differ by one word and
are opposite in consequence. a supervisor that generalizes a human's approval into a
permanent grant has manufactured a permission nobody gave, and put words in the
human's mouth (the `rule.require.co-author-signature` fabrication class).

## the entool check runs first — before the safety test

a modal for a **raw** command that a paved skill already covers is not a plain
approve/decline — it is the tell the clone went offroad, and an approval paves the
braid. ask first: **"is there a skill that already does this?"**

| the answer | the act |
|---|---|
| yes | DECLINE, and let the decline carry the steer that names the skill |
| no | judge the raw command on the safety test below |

the steer rides ON the reject only — `rule.forbid.steer-a-clone-beyond-a-permission-key`
forbids a standalone message, and permits a reason attached to a decline. one act,
one channel.

a SAFE raw command is still declinable: the safety test asks "will this harm?", the
entool check asks "is this the paved path?" — a bounded, read-only `grep` passes the
first and fails the second.

a REPEAT is a defect in the TOOLS, never in the clone. approve the same raw shape
twice and the skill is absent — record it (`rule.always.enskill-the-tactics-you-discover`).

## the safety test

approve only when ALL hold:

| check | safe | unsafe |
|-------|------|--------|
| effect | reads only (status, log, grep, cat, test run) | writes, deletes, moves, installs |
| scope | stays within the worktree / repo | any path outside the repo, `~`, `/tmp`, `/etc` |
| glob | bounded (`src/**/*.ts`) | unbounded (`/**`, `**/*` from root) |
| network | none | curl/wget/push/exfil to outside hosts |
| destructive | none | `rm -rf`, `git reset --hard`, force-push, drop table |
| legibility | you can state what it does in one breath | opaque or obfuscated |

`git status`/`diff`/`log`, `grep`/`grepsafe`, `cat`/`head`/`tail`, `rhx
git.repo.test`, `ls`/`tree` inside the repo are the paved safe set — approve them.

### a SYNTAX flag is not a safety verdict

| the trigger | tells you |
|---|---|
| the command's EFFECT (write, delete, fetch) | judge it — the safety test's business |
| the command's SYNTAX (`;`, pipe, redirect) | naught about blast radius — a parser note |

a chain of safe commands is safe; one opaque command is not. the count of separators
bears on neither. caveat: a chain is only as safe as its LOUDEST member — a `;` that
joins a grep to an install IS an install.

## how to drive the prompt

the sweep (`rhx git.crew.poll --live --boxes`) names which crew holds a `🚧prompt`;
read that one role — never loop `crew.read` across roles to find one
(`rule.require.bulk-over-byhand`). mechanic prompts are Ink TUI selects; send a bare
keystroke, no Enter (`--keys`):

```bash
# read the prompt first — never approve blind
rhx git.crew.read --tree <tree> --who mechanic

# safe → approve option 1 (Yes)
rhx git.crew.send --tree <tree> --who mechanic --keys 1

# unsafe → deny the option reading `No` (read it — usually the last, e.g. 3), then steer
rhx git.crew.send --tree <tree> --who mechanic --keys 3
rhx git.crew.send --tree <tree> --who mechanic --what 'that reaches outside the repo — use a repo-scoped read instead, e.g. rhx grepsafe'
```

always `rhx git.crew.read` after, to confirm the choice registered (`rule.require.verify-after-send`).

## what this does not cover

the supervisor approves routine PERMISSION prompts only, never human-only ROUTE
gates: `route.stone.set --as approved`, `git.commit.uses set`, release/push auth.
surface them; never self-grant. full boundary in `rule.forbid.self-grant-human-gates.md`.

## when unsafe — prefer steer over deny

a flat deny leaves the mechanic stuck the same way:

- outside repo → use a repo-scoped read (`rhx grepsafe`, `rhx globsafe`)
- unbounded glob → bound it to `src/**`
- mutation for a check → read-only verify instead
- opaque chain → split it, run the read part alone

## .enforcement

- approve of a mechanic prompt without a read first = blocker
- approve of a command that escapes the repo or mutates outside scope = blocker
- self-grant of a human-only route gate (vision / quota / release) = blocker

## .see also

- `rule.require.verify-after-send.md` — always `crew.read` after a send
- `rule.always.entool-the-layer-you-drop-below.md` — crew verbs only, never a `duct.*` call
- `rule.require.bulk-over-byhand.md` — the sweep names the subject, this read drills into it
- `rule.forbid.direct-tmux-duct-term.md` — drive via rhx skills, not raw tmux
- `howto.supervise-routes.md` — foreman ducts and route stone approval
- `howto.review-permission-requests.md` — the full step-by-step procedure

---

written by human + seaturtle 🐢
