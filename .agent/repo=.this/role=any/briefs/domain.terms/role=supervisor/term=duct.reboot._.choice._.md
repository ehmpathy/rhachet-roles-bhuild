# domain.term: duct.reboot

term.chosen   = reboot
term.kind     = verb
term.boundary = duct
term.synonyms.forbidden:
- restart
- respawn
- reset
- recycle
- bounce
- kill

## .what

**replace the program a duct's pane holds, and keep the duct.** the tmux session, the window,
the duct's name, and the cwd all survive; only the wedged program dies and a fresh shell takes
its place.

it is the lever for a duct that is BUSY with a program that will never finish — a hung nvim, a
TUI stuck mid-redraw, a build that cannot be interrupted.

## .the three duct verbs, and what each replaces

| verb | replaces | survives |
|---|---|---|
| `duct.refresh` | the **view** — a repaint | the program, the duct |
| **`duct.reboot`** | the **program** | the duct, its name, its cwd |
| `duct.stop` | the **duct** | the worktree only |

⇒ the axis is *what dies*, and the three are strictly ordered by it. a reader who wants the
middle rung and reaches for `stop` ends a conversation for good.

## 🔴 .a reboot does NOT produce a husk — it produces a CLEAN pane

this is the question `progress.2026-09-05` deferred, and 2026-09-05 settled it by measurement.

| | a `duct.pane.husk` | after a `duct.reboot` |
|---|---|---|
| what killed the program | a signal from elsewhere | this verb, deliberately |
| the pane's scrollback | claude's chrome, still drawn | ⚠️ **cleared — CONTESTED, see below** |
| the pane's LAST line | a live shell prompt | a live shell prompt |

the last line matches, and **that is why the two look alike from a status line.** the scrollback
was read as what parts them: `respawn-pane -k` replaces the pane, so its chrome dies with the
program. a husk's chrome persists **because no verb respawned it** — the program died and left
its rendered frame behind.

⇒ so `reboot` and `husk` are **two concepts, never one seen twice.** the husk is what an
UNREBOOTED death leaves; a reboot is the cure that removes it.

### ⚠️ the SCROLLBACK row is CONTESTED — a second measurement disagrees

on 2026-09-05, hours after the measurement above, a wedged nvim in
`rhachet-roles-bhrain.beav.feat-telepath-role/foreman` was rebooted through the new crew verb.
the cwd held and the last line was a fresh prompt — **and the codediff frame was still drawn
above it.** two reboots, both of an nvim, both on a foreman, the same day, opposite outcomes on
the one row that parts this term from `husk`.

🔴 **so the CONCLUSION stands and its DISCRIMINATOR does not.** `reboot` and `husk` are still
two concepts — they are parted by WHAT KILLED the program, which is measured directly and was
never in doubt. what fails is the scrollback row as a *test*: a reader who reaches for it to
tell the two apart will read a rebooted pane as a husk.

⇒ until it is settled, part them by the top row, never the middle one. the counter-measurement
and what would settle it are in `.reason`.

## .refs

- `.agent/repo=.this/role=any/skills/duct.reboot.sh` — the duct-layer entrypoint
- `.agent/repo=.this/role=any/skills/git.crew.reboot.sh` — the CREW-layer entrypoint, by
  tree + role. the arrear this term recorded, now paid
- `.agent/repo=.this/role=any/skills/work/ductwork.sh:1533-1620` — the implementation
- `.agent/repo=.this/role=any/skills/work/crewwork.sh` — `crew.reboot`, which derives the
  grove from the ledger and delegates here
- `respawn-pane -k -c <cwd> -t <session>` — the substrate

## .reason

- `term=duct.reboot._.choice.reason.md`

---

written by human + beaver 🦫
