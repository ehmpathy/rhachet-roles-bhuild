#!/usr/bin/env bash
######################################################################
# .what = replace the program one clone's pane holds, and keep the duct,
#         addressed by TREE and ROLE
#
# .why  = the MIDDLE RUNG at the supervisor's layer.
#
#         the three duct verbs are strictly ordered by what dies:
#
#           crew.refresh  -> the VIEW    (a repaint; cannot signal)
#           crew.reboot   -> the PROGRAM (this verb)
#           crew.stop     -> the DUCT    (and every conversation in it)
#
#         only the middle rung existed as substrate. a supervisor with a
#         wedged program had a repaint that cannot help and a stop that
#         costs the conversation — so the pull was toward a hand-typed
#         `duct.reboot`, which rule.always.entool-the-layer-you-drop-below
#         forbids, or toward raw ssh, which is worse.
#
#         `term=duct.reboot._.choice.reason.md` recorded this verb as
#         OWED under `.the open arrears`, and named its exact shape:
#
#           > a `git.crew.reboot --tree <tree> --who <role>` is owed
#
#         this is that verb.
#
# usage:
#   rhx git.crew.reboot --tree <treeslug> --who foreman
#   rhx git.crew.reboot --tree <treeslug> --who mechanic
#   rhx git.crew.reboot --help
#
# args:
#   --tree   the tree slug, as git.crew.list prints it   (required)
#   --who    ONE role from CREWWORK_ROLES_DEFAULT, never `all`   (required)
#            (mechanic · foreman · reflector · reviewer.take · reviewer.give)
#   --grove  local | cloud://<groveslug>
#            default: the box the LEDGER says this crew was booted on
#
# 🔴 .when a supervisor reaches for this — a WEDGED PROGRAM
#    a pane held by a program that will never finish, and that no
#    keystroke clears:
#
#      - an nvim that loops its own more-prompt, so every Enter
#        regenerates the prompt it was meant to dismiss
#      - a TUI stuck mid-redraw
#      - a build with no timeout, which `crew.send` rightly refuses
#
#    ⚠️ the tell that a reboot is owed rather than an Enter: you sent the
#    keystroke the pane ASKED FOR, read it back, and the pane is in the
#    same state. one repeat is a measurement; a third is a habit.
#
# 🔴 .why --who is REQUIRED, and `all` is REFUSED
#    the two roles are never wedged at the same moment, so a broadcast
#    reboot kills a healthy clone to cure a stuck one — and a claude
#    killed mid-turn loses the turn. that is `crew.send --who all`'s
#    refusal, one notch more expensive: a send lands a keystroke on the
#    wrong modal, a reboot ends the program outright.
#
#    ⇒ and there is no safe DEFAULT either. `crew.send` may default to
#      mechanic because a misaimed message is recoverable; a misaimed
#      reboot is not. rule.require.safe-by-default — a destructive act
#      takes a deliberate step, so the role is named or no reboot runs.
#
# ⚠️ .what SURVIVES, and what does NOT
#    survives: the tmux session, the window, the duct's name, the CWD.
#    dies:     the program, AND the conversation it held.
#
#    a rebooted claude does not resume itself. so this is not a bigger
#    `crew.refresh` — it is a smaller `crew.stop`, and it is reached for
#    only when the rung below cannot help.
#
# ⚠️ .a reboot CLEARS a husk — but the SCROLLBACK TEST is contested
#    🟢 settled: `respawn-pane -k` does clear a husk's leftover
#       `Resume this session with:` overlay. measured 2026-09-05 on a real
#       husk (exit 143), which is the subject this verb actually serves.
#
#    🔴 NOT settled: whether a rebooted pane is TELLABLE from a husk by its
#       scrollback. three reboots the same day went 2 clean, 1 dirty — the
#       dirty one left the dead program's frame still drawn. so a reader who
#       parts the two by the frame will read a rebooted pane as a husk, and
#       reach for a cure already applied.
#
#    ⇒ what parts them is never inferred from a pane. it is WHAT KILLED the
#      program — a signal from elsewhere, versus this verb deliberately —
#      and you read that off what you did (`term=duct.pane.husk`).
#
# guarantee:
#   - the grove is derived from the ledger; you address a tree, never a
#     host. where the ledger holds no row it falls back to local AND SAYS
#     SO on stderr
#   - NOT idempotent, deliberately: a reboot of an ABSENT duct has no goal
#     to reach, so it fails and names `git.crew.boot` as the fix rather
#     than silently raising a fresh one
#   - the pane's CWD is captured BEFORE the kill and handed back after,
#     so a duct cd'd into its worktree does not jump to $HOME
#   - exit 0 = rebooted, 1 = malfunction, 2 = constraint
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

crew.reboot "${args[@]}"
