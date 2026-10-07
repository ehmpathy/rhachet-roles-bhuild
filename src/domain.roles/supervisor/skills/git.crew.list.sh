#!/usr/bin/env bash
######################################################################
# .what = list every CREW — one line per tree, with the roles that are up
#
# .why  = `duct.list` prints one duct per line, so a 26-duct fleet reads
#         as 26 rows a human must pair up by eye. but a crew is the unit
#         we actually act on: we open a crew, we close a crew, we send a
#         crew a message. so it should be the unit we can read.
#
#         it also surfaces a HALF crew at a glance — a tree with only a
#         mechanic and no foreman is a supervisor with no way to observe
#         without an interrupt of the worker (howto.supervise-routes).
#
# usage:
#   rhx git.crew.list
#
# guarantee:
#   - read-only: never opens, closes, or sends to any duct
#   - derived LIVE from tmux sessions, never from a cached list
#   - a one-segment duct (duct:///65 — a human's own shell) is never
#     counted as a crew (see term=duct._.choice._.md)
#   - exit 0 = listed, 1 = malfunction
######################################################################

set -uo pipefail

# source crewwork from the REPO's own lib (it loads ductwork + termwork)
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --help|-h)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;

    # ⚠️ FAIL LOUD — never `shift` an unknown flag away (rule.forbid.failhide).
    -*) echo "✋ git.crew.list: unknown flag '$1'" >&2
        echo "   known: --help" >&2
        exit 2 ;;
    *) shift ;;
  esac
done

crew.list
