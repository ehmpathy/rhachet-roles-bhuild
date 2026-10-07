#!/usr/bin/env bash
######################################################################
# .what = send text or keystrokes to one clone, by TREE and ROLE
#
# .why  = the reach at the SUPERVISOR's layer — the twin of
#         git.crew.read.
#
#         a supervisor thinks in crews and trees; a duct is substrate
#         (rule.require.speak-at-the-supervisor-layer). every steer,
#         every carry-on order, and every modal answer used to drop a
#         layer and hand-build a duct uri, which makes the caller carry
#         the host, the tmux name form, and the uri shape.
#
#         here you address the TREE and say which role:
#
#           rhx git.crew.send --tree <slug> --keys 1
#
# usage:
#   rhx git.crew.send --tree <treeslug> --what 'carry on'
#   rhx git.crew.send --tree <treeslug> --who foreman --what 'git tree del'
#   rhx git.crew.send --tree <treeslug> --keys 1
#   rhx git.crew.send --tree <treeslug> --what '<long msg>' --submit
#   printf '%s' '<multi-line msg>' | rhx git.crew.send --tree <treeslug> --what @stdin
#   rhx git.crew.send --help
#
# args:
#   --tree    the tree slug, as git.crew.list prints it  (required)
#   --who     mechanic (default) — ONE role from CREWWORK_ROLES_DEFAULT, never
#             `all` (mechanic · foreman · reflector · reviewer.take ·
#             reviewer.give)
#   --what    text to send, then Enter. `@stdin` reads the payload from
#             stdin instead of the literal token — otherwise `--what
#             @stdin` sends the eight-byte string "@stdin" verbatim,
#             reports `sent`, and the caller never sees the miss
#   --keys    raw key(s), NO Enter appended — for a modal
#   --anyway  send into a BUSY pane on purpose — bypass the busy-guard.
#             ⚠️ it does NOT submit. see --submit
#   --submit  send --what, then press Enter. for a MULTI-LINE --what,
#             which arrives as a paste and swallows the Enter that would
#             have followed it. implies --anyway (a live claude holds
#             the pane)
#   --grove   local | cloud://<groveslug>
#             default: the box the LEDGER says this crew was booted on
#
# 🔴 .why --submit exists, and why --anyway is NOT it
#    this header once said `--anyway  also SUBMIT the text`. it never did.
#    downstream in ductwork, --anyway carries one sense only: send into a
#    pane that a program holds. the two got fused here because they are
#    always passed together, and the fusion read as cause and effect.
#
#    ⚠️ the cost was silent and repeated: a multi-line steer landed in the
#    box UNSENT, the send reported `sent`, and only a read-back showed
#    `❯ [Pasted text #4 +9 lines]` still parked there. measured twice on
#    2026-09-04, both times finished by hand with a follow-up --keys Enter
#    (rule.always.entool-the-skills-you-touch: a step you keep repeating
#    by hand after the call is a defect in the TOOL).
#
#    ⇒ so they are two words for two acts (rule.forbid.domain-term-
#      ambiguity), and the one that submits is named for what it does.
#
# ⚠️ .a broadcast is REFUSED. `--who all` exits 2 on purpose: a
#    keystroke sent to a whole crew answers whatever modal each clone
#    happens to hold, and the two are never at the same prompt. read
#    each role, then send to each by name.
#
# 🪝 .a --what command send NUDGES toward a cure-tool. a direct command
#    to a crew is a BYHAND steer, and a byhand cure is unauditable and
#    recurs (rule.forbid.byhand-heal). so each `--what` send prints a
#    reminder: is there an extant tool for this cure? use it — or upsert
#    one. it NUDGES, never blocks; the send proceeds. `--keys` (a modal
#    answer) is exempt, and internal cures (heal, boot) never trip it
#    because they call duct.send, the substrate beneath this verb.
#
# ⚠️ .verify after every send (rule.require.verify-after-send). a
#    prompt can clear between the read and the send, and the keystroke
#    then lands in an EMPTY BOX as literal text — which the next poll
#    reports as human-typed.
#
# guarantee:
#   - the grove is derived; you address a tree, never a host
#   - --what and --keys are exclusive; one is required
#   - exit 0 = sent, 1 = malfunction, 2 = constraint
######################################################################

set -uo pipefail

# source crewwork from the REPO's own lib (it loads ductwork + termwork)
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --help|-h)
      # .why the end is FOUND, never a pinned line number
      #   this read `2,49p` and the header grew past it in the same edit
      #   that added --submit — so --help would have clipped its own args
      #   list and hidden the very flag the edit paved. a literal bound
      #   goes stale on the next edit and stays SILENT when it does: a
      #   false report about the file it lives in. stop at the header's
      #   own terminator instead (the cure duct.poll already carries).
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    *) args+=("$1"); shift ;;
  esac
done

crew.send "${args[@]}"
