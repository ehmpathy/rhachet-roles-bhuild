#!/usr/bin/env bash
######################################################################
# .what = close a crew's kitty tabs and leave every clone at work
#
# .why  = a crew has two halves, and only one of them is precious:
#
#           axis   | turn on          | turn off
#           -------|------------------|-----------------
#           work   | git.crew.boot    | git.crew.stop
#           view   | git.crew.show    | git.crew.hide
#
#         a tab is a VIEW; a duct is the WORK. to hide a crew is to stop
#         the watch — each clone keeps its tmux session, its shell, and
#         its claude conversation, and git.crew.show brings the windows
#         back onto exactly that.
#
#         this began as `crew.stop --keep-ducts`, which had the safety
#         backwards: the destructive act was the bare verb and the safe
#         act cost a flag, so the cheap move was harder to ask for than
#         the expensive one (rule.require.safe-by-default).
#
# usage:
#   rhx git.crew.hide --tree <treeslug>
#   rhx git.crew.hide --help
#
# args:
#   --tree   the tree slug, as git.crew.list prints it   (required)
#   --grove  local (default) | cloud://<groveslug>
#
# .what it does NOT do
#   - it does not stop a clone (that is git.crew.stop)
#   - it does not fell the tree (that is git.tree.del)
#   - it does not pause the work — a hidden clone keeps at it, so a
#     hidden crew still needs a babysit sweep
#
# guarantee:
#   - NEVER touches a duct — every clone stays live
#   - idempotent: a crew already hidden reports so and exits 0
#   - fully reversible: rhx git.crew.show --tree <treeslug>
#   - exit 0 = hidden, 1 = malfunction, 2 = constraint
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

crew.hide "${args[@]}"
