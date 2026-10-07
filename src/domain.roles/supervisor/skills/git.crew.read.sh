#!/usr/bin/env bash
######################################################################
# .what = read one clone's pane, addressed by TREE and ROLE
#
# .why  = the drill-in at the SUPERVISOR's layer.
#
#         a supervisor thinks in crews and trees; a duct is substrate
#         (rule.require.speak-at-the-supervisor-layer). that rule
#         governed speech and had no verb behind it, so every drill-in
#         dropped a layer and hand-built a uri:
#
#           rhx duct.read --on 'duct://grove-sandpine-v20260901/rhachet-roles-bhrain_beav_feat-x/mechanic'
#
#         that call makes you carry three facts the crew layer already
#         holds — the host, the tmux name form, and the uri shape. each
#         is a place to be wrong about WHICH BOX the answer describes.
#
#         this verb carries them for you:
#
#           rhx git.crew.read --tree rhachet-roles-bhrain.beav.feat-x
#
# usage:
#   rhx git.crew.read --tree <treeslug>
#   rhx git.crew.read --tree <treeslug> --who foreman
#   rhx git.crew.read --tree <treeslug> --who all
#   rhx git.crew.read --tree <treeslug> --lines 12
#   rhx git.crew.read --tree <treeslug> --raw
#   rhx git.crew.read --help
#
# args:
#   --tree   the tree slug, as git.crew.list prints it   (required)
#   --who    mechanic (default) | all | any ONE role in CREWWORK_ROLES_DEFAULT
#            (mechanic · foreman · reflector · reviewer.take · reviewer.give)
#   --lines  pane lines, counted from the BOTTOM         (default: 50)
#   --grove  local | cloud://<groveslug>
#            default: the box the LEDGER says this crew was booted on
#   --raw    keep the ANSI escapes — prefilled (white) vs ghost (gray)
#
# .note = a SWEEP is git.crew.poll, never a loop of this verb
#         (rule.require.bulk-over-byhand). reach for this only once a
#         sweep has NAMED the crew you must look at.
#
# .note = --lines counts from the bottom, so a small value yields the
#         NEWEST content — which is where a modal's options live.
#
# guarantee:
#   - NEVER touches the work — a read is a read
#   - the grove is derived; you address a tree, never a host
#   - exit 0 = read, 1 = malfunction, 2 = constraint
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

crew.read "${args[@]}"
