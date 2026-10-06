#!/usr/bin/env bash
######################################################################
# .what = end a crew for good — its tree AND its record
#
# .why  = crew.stop turns the WORK off and leaves the crew on the
#         books, because a stopped crew can be re-booted onto the same
#         tree. fell is what has no re-boot: the tree goes, the branch
#         goes, the ducts and tabs go, and the ledger row goes with
#         them. three off-verbs, three lifetimes, three costs:
#
#           hide   the VIEW    free, reversible with crew.show
#           stop   the WORK    ends a conversation for good
#           fell   the CREW    ends the tree, the branch, the record
#
# .why `fell` and not `del`
#         the domain already speaks forestry: a tree is SPROUTED
#         (term=sprout) and a tree is FELLED. every poll verdict in
#         this repo reads "fell it", never "del it". fell is the
#         symmetric inverse of the paved creation verb
#         (rule.prefer.symmetric-term-pairs); `del` stays the
#         mechanical row-removal one layer down.
#
# .the LAYERING — git.tree is USED here, and stays independent
#         the tree layer owns the safety gate and every rule around
#         it. this adds exactly one act on top: removal of the crew
#         record. so a tree can be felled with no crew (call
#         git.tree.del directly), and a crew is felled THROUGH the
#         tree — never the reverse.
#
# usage:
#   rhx git.crew.fell --tree $tree
#   rhx git.crew.fell --tree $tree --stash --why 'merged + shipped; yields are memo only'
#
# args:
#   --tree   treename slug (the same slug used as the duct prefix)
#   --stash  set live work aside before the fell (passed to git.tree.del)
#   --why    REQUIRED with --stash — why the stash is safe for THIS tree
#
# .the ORDER carries the whole safety property
#         tree FIRST, record LAST. if the gate refuses — unmerged,
#         unstaged, untracked work — the ledger row STAYS, because a
#         crew whose tree still stands is still a crew, and a row
#         dropped early makes it invisible to every sweep. that is
#         precisely the blindness the ledger exists to close.
#
# guarantee:
#   - delegates the tree to git.tree.del; never re-implements its gate
#   - the ledger row is dropped ONLY on a confirmed tree removal
#   - a refused gate leaves the row intact and exits 2
#   - exit 0 = felled, 1 = malfunction, 2 = constraint
######################################################################

set -uo pipefail

# source crewwork from the REPO's own lib (it loads ductwork + termwork)
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --help|-h)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    *) ARGS+=("$1"); shift ;;
  esac
done

crew.fell "${ARGS[@]}"
