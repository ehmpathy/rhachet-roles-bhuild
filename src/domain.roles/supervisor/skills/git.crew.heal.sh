#!/usr/bin/env bash
######################################################################
# .what = make a crew WHOLE on each of its axes — addressed by TREE and
#         ROLE, ONE tree at a time (--all was ripped out 2026-09-13; find
#         the fleet's defect set with `rhx git.crew.poll --live`):
#
#           💀 work — a HUSK: claude exited, its chrome still drawn.
#                     revive the safe cases
#           🫥 view — a PARTIAL crew: the window is open and a LIVE seat
#                     has no tab. open the absent tab
#           🪑 seat — a LOCAL seat's shell is short the one verb it exists
#                     to use. define `git.tree.sync` in it
#
# 🔴 .the view axis is ALL OR NAUGHT — read this before you reach for it
#      a crew with NO window is CORRECT, and it is the state most of the
#      fleet sits in. a human opens a window when they want to watch a
#      crew; to open one unasked decides for them, and would put a window
#      on every crew in the fleet.
#
#      the defect is the PARTIAL one: a window that is open, holds some
#      live seats, and omits others. the human asked to see the crew and
#      was shown part of it.
#
#      ⇒ the full statement, its counter-argument, and what would overturn
#        it: `define.invariant.crew.view.all-or-naught.md`
#
# .why  = `term=duct.pane.husk._.choice._.md` names the exact shape and
#         the exact cure, and names them as OWED, never as built:
#
#           a pane whose claude has exited, with claude's chrome still
#           drawn in its scrollback, and a live shell prompt beneath it.
#           it has a box's shape and a box's chrome, and it is not a box.
#
#         absent this verb, a husk is invisible to the sweep — it renders
#         as `😴 unread` or `🧊 frozen`, never as a dedicated verdict —
#         and its cure (crew.reboot, THEN a hand-typed `claude --resume`)
#         is a two-call byhand sequence a supervisor finds only from a
#         raw pane read, once the shape is already known.
#
#         this is that discriminator and that cure, made callable.
#
# usage:
#   rhx git.crew.heal --tree <treeslug>                 # every role, plan
#   rhx git.crew.heal --tree <treeslug> --who foreman   # narrow to ONE role
#   rhx git.crew.heal --tree <treeslug> --mode apply    # actually heal
#
#   # the VIEW axis alone — free and reversible, reboots NAUGHT
#   rhx git.crew.heal --tree <treeslug> --what view --mode apply
#
#   # the SEAT axis alone — give a live reviewer seat `git.tree.sync`
#   rhx git.crew.heal --tree <treeslug> --what seat --mode apply
#
#   # the WEDGE axis — SURFACE a suspected wedge, then PROBE the one you name
#   rhx git.crew.heal --tree <treeslug> --what wedge --mode apply
#   rhx git.crew.heal --tree <treeslug> --who mechanic --what wedge --mode apply --confirm
#
#   rhx git.crew.heal --help
#
# 🔴 .what killed it decides whether this verb may act at all
#      `💥<code> ➜`  a signal killed the process (143 = SIGTERM, this
#                    fleet's own earlyoom guard) — SAFE to heal
#      `^C%` / `^C$` a HUMAN typed the interrupt — REFUSED, surfaced
#                    instead: they may have already acted on the gate
#                    that parked it, and no poll can see what they ran
#
# args:
#   --tree   the tree slug, as git.crew.list prints it   (required)
#   --who    ONE role from CREWWORK_ROLES_DEFAULT, never `all`
#            (mechanic · foreman · reflector · reviewer.take · reviewer.give)
#            (default: every role in CREWWORK_ROLES_DEFAULT)
#            🔴 it defaulted to `mechanic` until 2026-09-13, and that made the
#               bare `--what seat` call structurally unable to do its job:
#               mechanic is never a local seat, so the seat axis refused it and
#               printed `not a local seat` — true about the wrong subject, and
#               a reader takes it for a clean bill. a human then typed
#               `git.tree.sync` in a seat and got `command not found`
#            ⚠️ the wider default is safe on the costly axis: the work axis acts
#               on a HUSK only, so a roster sweep reboots the dead, never the
#               alive. narrow with --who when you mean one role
#   --what   all (default) | work | view | seat | wedge | mode
#            🔴 the axes carry VERY different costs, so scope the apply:
#              work  — reboots a husk and restarts claude. ENDS a conversation
#              view  — opens a kitty tab. free and reversible (term=crew)
#              seat  — defines a shell function. free and idempotent
#              wedge — reads twice with a repaint between. SURFACES only
#              mode  — restores acceptEdits on a clone that lost it
#            ⚠️ `wedge` and `mode` are opt-in ONLY and are NOT part of `all`:
#               each one sends keys or stalls on a `sleep`, so neither may
#               ride a roster sweep
#   --mode   plan (default) | apply
#   --confirm  probe ONE suspected wedge with an Escape, then re-read and
#            render the verdict — REFUTED (the frame moved: a slow await) or
#            CONFIRMED (it held through a key too)
#            🔴 requires `--what wedge`, `--mode apply`, and `--who <role>`,
#               and refuses without all three. it SENDS a key into a live
#               pane, so it may never ride a plan read or a roster sweep
#            ⚠️ it folds the PROBE and stops. the reboot stays the caller's
#               act, because it ENDS A CONVERSATION and cannot be undone
#               (rule.forbid.bind-a-costly-act-to-a-cheap-one) — the same
#               seam `crew.modal` draws when it sends the key and leaves
#               approve-vs-decline to you
#   --lines  scrollback depth for the husk discriminator (default 60)
#
# 🪑 .the seat axis, and why it is neither work nor view
#      a reviewer seat — `reviewer.take` or `reviewer.give`, and both are local
#      — cwd's into `_mirrors/<tree>`, a checkout of the CREW's
#      repo — so the `rhx` on its PATH is that repo's rhachet, which has no
#      `repo=.this` role linked. `rhx git.tree.sync` there answers `no unique
#      skill executable`, and the seat cannot call the one verb it exists for.
#
#      `crew.boot` defines `git.tree.sync` in the seat's shell to close that. but a
#      boot is not re-run to pick up a new provision, so every seat booted
#      before it exists is short the verb — and NEITHER other axis can see it:
#      the seat's work is healthy and its tab is open.
#
#      ⚠️ this axis RE-DEFINES rather than probes. to ask a pane whether a
#         function exists costs a send, a read, and a parse of lossy pane text;
#         to define it costs one send and is idempotent. so its count reports
#         seats PROVISIONED, never defects found.
#
#      🔴 the verb is named for the SKILL — `git.tree.sync`, verbatim. the seat
#         learns no seat-only word; only the `rhx` prefix is absent, because the
#         function IS the resolution `rhx` would have performed (ubiqlang: one
#         name per capability, on every surface).
#
#         ⚠️ and never `sync`: that is coreutils, so on a seat where the
#            provision did not land the human gets a silent filesystem flush and
#            exit 0 — a success about a tree never touched (term=false-report).
#            measured 2026-09-13: `type sync` → `sync is /usr/bin/sync`.
#
# guarantee:
#   - never touches a duct whose tail still shows a live claude `❯` box
#   - never acts on a `^C`-closed husk, or a close it cannot read
#   - never opens a window on a crew that has none — only the absent TAB on
#     a crew whose window is already open (all-or-naught, above)
#   - the view repair is `crew.show --roles <role>`, per-role by construction,
#     so it adds one seat and rebuilds no window a human arranged
#   - the seat repair is a bare `duct.send`, never `--anyway`: where a program
#     holds the keyboard the definition would land as literal text in IT, so a
#     busy pane is refused and counted, never typed into
#   - heal is targeted: ONE tree per call, so every cure is observable and
#     reversible-by-choice — the fleet's defect set comes from git.crew.poll
#   - the per-row verdicts report ONLY the axis that ran — a `0 husks` line
#     under `--what view` would be a count about a check that never happened
#   - exit 0 = ran (read the per-row verdicts), 2 = bad args
######################################################################

set -uo pipefail

# source crewwork from the REPO's own lib (it loads ductwork + termwork)
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --help|-h)
      # .why the end is FOUND, never a pinned line number: a literal
      #   bound goes stale on the next edit and stays SILENT when it
      #   does — a false report about the file it lives in.
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    *) args+=("$1"); shift ;;
  esac
done

crew.heal "${args[@]}"
