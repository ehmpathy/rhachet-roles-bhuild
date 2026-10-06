#!/usr/bin/env bash
######################################################################
# .what = open a kitty tab per role, onto a crew that is already at work
#
# .why  = a crew has two halves, and only one of them is precious:
#
#           axis   | turn on          | turn off
#           -------|------------------|-----------------
#           work   | git.crew.boot    | git.crew.stop
#           view   | git.crew.show    | git.crew.hide
#
#         this is the VIEW turned back on. the ducts already exist and
#         are untouched — every clone keeps its shell and its claude
#         conversation. show and hide are free and reversible; open and
#         stop are not.
#
# usage:
#   rhx git.crew.show --tree <treeslug>
#   rhx git.crew.show --tree <treeslug> --roles reflector   # ONE tab, alone
#   rhx git.crew.show --help
#
# args:
#   --tree   the tree slug, as git.crew.list prints it   (required)
#   --grove  local | cloud://<groveslug>
#            default: the box the LEDGER says this crew was booted on, and
#            `local` only when no ledger row names the tree. an omitted flag
#            derives the box rather than assumes this one, and prints which.
#   --roles  comma list, in order
#            (default: every role in CREWWORK_ROLES_DEFAULT, crewwork.sh)
#            the FIRST role takes the window's base tab
#
#            🟢 each role is a SEPARATE term.open, so a one-role show adds that
#            one tab and touches no other. it does not rebuild the window — so
#            it is the way to add a seat to a crew a human already watches, and
#            it reopens no tab they closed on purpose.
#
# .note = a crew with no ducts fail-fasts and points at git.crew.boot. a
#         tab attached to an absent tmux session dies within ~0.3s and
#         leaves a registry row behind, so we refuse rather than produce
#         a window that vanishes and a row that lingers.
#
# guarantee:
#   - NEVER touches a duct — the work is untouched, always
#   - idempotent: a tab already up is focused, never duplicated
#   - exit 0 = in view, 1 = malfunction, 2 = constraint
######################################################################

set -uo pipefail

# source crewwork from the REPO's own lib (it loads ductwork + termwork)
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --help|-h)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    *) args+=("$1"); shift ;;
  esac
done

crew.show "${args[@]}"
