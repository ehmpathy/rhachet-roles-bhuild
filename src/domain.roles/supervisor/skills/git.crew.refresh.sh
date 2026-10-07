#!/usr/bin/env bash
######################################################################
# .what = repaint a crew's terminals, and un-strand its geometry,
#         addressed by TREE
#
# .why  = the REPAIR at the supervisor's layer.
#
#         a supervisor thinks in crews and trees; a duct is substrate
#         (rule.require.speak-at-the-supervisor-layer), and
#         rule.always.entool-the-layer-you-drop-below forbids a
#         `duct.refresh` typed by hand. that rule also says what to do
#         when its table names no crew verb for what you need:
#
#           add the crew-layer verb. then use it.
#
#         this is that verb. it was owed from the day the table was
#         written, and the gap stayed invisible because the workaround
#         (a hand-built duct uri) worked.
#
# usage:
#   rhx git.crew.refresh --tree <treeslug>
#   rhx git.crew.refresh --tree <treeslug> --who mechanic
#   rhx git.crew.refresh --help
#
# args:
#   --tree   the tree slug, as git.crew.list prints it   (required)
#   --who    all (default) | any ONE role in CREWWORK_ROLES_DEFAULT
#            (mechanic · foreman · reflector · reviewer.take · reviewer.give)
#   --grove  local | cloud://<groveslug>
#            default: the box the LEDGER says this crew was booted on
#
# 🔴 .when a supervisor reaches for this — the CLIPPED STONE
#    tmux sizes a window to its client, so a window stranded in
#    `window-size manual` no longer tracks its terminal and stays
#    narrow. a narrow pane wraps claude's chrome, and two things break:
#
#      1. a stone clips before its verdict — the poll renders
#         `blocked ✋…` and cannot say what the gate was
#      2. 🔴 a modal option loses its shape — `2. Yes, and…` renders as
#         `2Yes, and…`, and the box detector reads a LIVE MODAL as an
#         empty box
#
#    ⚠️ the second is the dangerous one. the duct goes unbabysat, and
#    the sweep reports it HEALTHY — an honest instrument, a false
#    inference (term=false-report). a clipped stone is the cheap,
#    visible symptom of the same cause, so treat it as the cue.
#
# 🔴 .a narrow pane has TWO causes, and this skill cures only ONE
#    the cue above is honest about the symptom and was WRONG about its
#    reach — it read as though every clipped stone were a strand. it is
#    not:
#
#      1. a STRAND — the tmux window sits in `window-size manual` and no
#         longer tracks its terminal.  🟢 this skill cures it
#      2. a NARROW CLIENT — the terminal itself is small, so tmux sizes
#         the window correctly and the result is still narrow.
#         ⛔ this skill CANNOT cure it; there is no strand to undo
#
#    ⚠️ .the tell, and it is the same shape either way
#    a refresh reports `refreshed (N client(s))` in BOTH cases, because
#    it genuinely did repaint N clients. so a SUCCESS report is not
#    evidence the pane widened — you must read the pane back and compare
#    (rule.require.verify-after-send: the read is a COMPARE, never a
#    confirmation).
#
#    .measured 2026-09-04, `rhachet.beav.fix-node-pty-install` — twice,
#    hours apart. both refreshes found and repainted both clients, and
#    the pane stayed 56 columns each time. ⇒ cause 2, and the cure is
#    to widen the TERMINAL, which is the human's window, never a tmux
#    option this skill can set.
#
#    🔴 do not run this a third time on the same tree in hope of a
#    different result. a repeat with no read-back between is how a
#    non-cure gets mistaken for a flaky one.
#
# .why the strand happens at all
#    `git.grove.auth` sets `window-size manual` on purpose, for the few
#    seconds it needs a wide pane to read, and restores `latest` from a
#    `trap … EXIT`. a trap does not fire on SIGKILL, and the restore is
#    written `|| true`, so a restore that FAILS reports naught either.
#    ⇒ the value outlives the run that wrote it, on a session no one
#      knows is stranded.
#
# .why --who defaults to ALL, where crew.send refuses `all`
#    a repaint carries no payload and answers no prompt, so there is no
#    keystroke to land on the wrong modal — the hazard that makes a
#    broadcast send unsafe has no cause here. and geometry is a property
#    of the tmux SESSION, so a strand hits every role at once.
#
# guarantee:
#   - NEVER destructive: no program dies, no byte of state is lost.
#     `window-size latest` is tmux's OWN default — this hands geometry
#     back to the terminal rather than takes it
#   - the grove is derived; you address a tree, never a host
#   - zero clients attached is a SUCCESS (a headless grove duct is normal)
#   - exit 0 = refreshed, 1 = malfunction, 2 = constraint
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

crew.refresh "${args[@]}"
