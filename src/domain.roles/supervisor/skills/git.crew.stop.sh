#!/usr/bin/env bash
######################################################################
# .what = kill every clone in a crew, and close its tabs
#
# ⚠️  THIS ENDS THE WORK. a stopped clone loses its shell and its claude
#     conversation, and no flag brings one back. when you only want the
#     window closed, use `rhx git.crew.hide` — the crew keeps at it.
#
# .why  = a crew has two halves, and only one of them is precious:
#
#           axis   | turn on          | turn off
#           -------|------------------|-----------------
#           work   | git.crew.boot    | git.crew.stop     ← this
#           view   | git.crew.show    | git.crew.hide
#
#         teardown also has an order, run backwards from open: a tab
#         attached to a session you just killed dies on its own and
#         leaves a registry row behind. so tabs close FIRST, ducts after.
#
# usage:
#   rhx git.crew.stop --tree <treeslug>
#   rhx git.crew.stop --tree <treeslug> --grove cloud://grove-1
#   rhx git.crew.stop --help
#
# args:
#   --tree   the tree slug                       (required)
#   --grove  local | cloud://<groveslug>
#            default: the box the LEDGER says this crew was booted on,
#            and `local` only where the ledger holds no row (it says so
#            when it falls back). a `local` default would read localhost,
#            find no ducts of that name, and report a stop it never
#            performed — see the .why at crewwork.sh:5927
#   --roles  comma list
#            (default: every role in CREWWORK_ROLES_DEFAULT, crewwork.sh)
#
# .note = this is NOT a tree teardown. it ends the crew and leaves the
#         worktree and the branch untouched. to fell the tree itself use
#         `rhx git.tree.del --name <tree>`, which runs the safety gate
#         that refuses unmerged or unstaged work.
#
# guarantee:
#   - tabs close before ducts, so no registry row is orphaned
#   - idempotent: a crew already stopped reports so and exits 0
#   - never touches the worktree or the branch
#   - exit 0 = stopped, 1 = malfunction, 2 = constraint
######################################################################

set -uo pipefail

# source crewwork from the REPO's own lib (it loads ductwork + termwork)
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --help|-h)
      # derive the header block rather than pin a line range — the peer
      # git.crew.heal.sh already takes this form, and the literal `2,39p`
      # it replaces had ALREADY rotted: the header ran to line 40, so the
      # `exit 0 = stopped, 1 = malfunction, 2 = constraint` contract was
      # cut from --help and no reader ever saw it
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    *) args+=("$1"); shift ;;
  esac
done

crew.stop "${args[@]}"
