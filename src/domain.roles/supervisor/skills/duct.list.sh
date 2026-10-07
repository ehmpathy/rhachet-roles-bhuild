#!/usr/bin/env bash
######################################################################
# .what = list open ducts (tmux sessions)
#
# .why  = enables discovery of extant sessions
#         - see what's active
#         - find session names
#
# usage:
#   rhx duct.list                    # local sessions
#   rhx duct.list --on user@host     # remote sessions
#
# args:
#   --on    remote host (optional, for remote list)
#
# guarantee:
#   - lists all sessions
#   - fail-fast on errors
######################################################################

set -euo pipefail

# source ductwork functions
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/ductwork.sh"

# parse args (filter out rhachet internal flags)
on_host=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --on) on_host="$2"; shift 2 ;;
    --skill|--repo|--role) shift 2 ;;  # skip rhachet internal flags

    # .why the header's OWN terminator, never a pinned line number: a literal
    #   bound goes stale the moment the header grows, and stays silent when it
    #   does — a false report about the file it lives in (git.crew.poll:477)
    --help|-h)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;

    # ⚠️ FAIL LOUD — never `shift` an unknown flag away.
    # .why = a silent drop tells the caller the run succeeded on terms it
    #        never asked for (rule.forbid.failhide). it cost duct.send the
    #        same defect twice — `--anyway`, then `--await`, the second of
    #        which left a tree SPROUTED WITH NO BEHAVIOR. full account in
    #        duct.send.sh; clamped by work.surface [case12].
    *)
      echo "✋ duct.list: unknown arg '$1'" >&2
      echo "   known: --on" >&2
      exit 2 ;;
  esac
done

# call duct.list with parsed args
if [[ -n "$on_host" ]]; then
  duct.list --on "$on_host"
else
  duct.list
fi
