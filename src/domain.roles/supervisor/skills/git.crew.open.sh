#!/usr/bin/env bash
######################################################################
# .what = ensure a crew is at WORK and in VIEW — the front door
#
# .why  = a crew has two halves, and to pick between the two on-verbs
#         you must first KNOW which half is already up:
#
#           axis   | turn on          | turn off
#           -------|------------------|-----------------
#           work   | git.crew.boot    | git.crew.stop
#           view   | git.crew.show    | git.crew.hide
#           BOTH   | git.crew.open    | (none — on purpose)
#
#         that read is a cost the caller should not owe. it was paid
#         once for real: a crew was asked for whose ducts were live and
#         whose tabs were closed, and the verb choice took a
#         `term.audit` first — a lookup purely to answer "which of these
#         two words applies?". a findsert on both makes the question
#         moot, which is what a findsert is for.
#
# usage:
#   rhx git.crew.open --tree <treeslug>
#   rhx git.crew.open --tree <treeslug> --roles reflector   # ONE seat, both axes
#   rhx git.crew.open --tree <treeslug> --resume mechanic
#   rhx git.crew.open --help
#
# args:
#   --tree    the tree slug, as git.crew.list prints it   (required)
#   --grove   local (default) | cloud://<groveslug>
#   --roles   comma list, in order
#             (default: every role in CREWWORK_ROLES_DEFAULT, crewwork.sh)
#             the FIRST role takes the window's base tab
#   --resume  restore this role's PRIOR conversation, by name — it sends
#             `claude --resume <role> --permission-mode acceptEdits`, then
#             answers the session picker if one draws. it is passed through
#             to boot, and STRIPPED before show, which never owned it
#
# 🔴 .why NOT `claude --continue`, which this line once named
#         `--continue` resolves by cwd-RECENCY, and a tree's mechanic and
#         foreman share ONE worktree — so a foreman's `--continue` can hand
#         back the MECHANIC's conversation, and neither pane says so
#         (term=false-report). see crewwork.sh:1185-1194.
#
# .why there is NO git.crew.close
#         the off-verbs cost wildly unequal amounts — hide is free and
#         reversible, stop ends a claude conversation for good. a
#         composite off would bundle the cheap act with the
#         irreversible one, which is the `--keep-ducts` defect the 2x2
#         was built to fix. the convenience is offered only in the
#         direction where it is free.
#
#         to take a crew down, name which half you mean:
#           rhx git.crew.hide --tree <treeslug>   # free, reversible
#           rhx git.crew.stop --tree <treeslug>   # ends the work
#
# guarantee:
#   - boots BEFORE it shows, always — a tab opened against an absent
#     session findserts that session in the CALLER's directory
#   - idempotent on both axes: live ducts are left alone, an open tab
#     is focused rather than duplicated
#   - a tree with no worktree fail-fasts, and no tab is opened
#   - exit 0 = at work and in view, 1 = malfunction, 2 = constraint
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

crew.open "${args[@]}"
