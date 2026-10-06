#!/usr/bin/env bash
######################################################################
# .what = stop a duct (kill tmux session)
#
# .why  = enables cleanup of headless sessions
#         - release resources
#         - clear stale sessions
#
# usage:
#   rhx duct.stop --on work
#   rhx duct.stop --on user@host:work
#
# args:
#   --on    session name (required)
#
# guarantee:
#   - kills session if extant
#   - no-op if session not found
#   - fail-fast on errors
######################################################################

set -euo pipefail

# source ductwork functions
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/ductwork.sh"

# parse args (filter out rhachet internal flags)
on_session=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --on) on_session="$2"; shift 2 ;;
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
    #
    # .note = this verb is TERMINAL — it ends a claude conversation for
    #         good. a swallowed guard flag here is the most expensive drop
    #         in the family, because there is no re-run that undoes it.
    *)
      echo "✋ duct.stop: unknown arg '$1'" >&2
      echo "   known: --on" >&2
      exit 2 ;;
  esac
done

# validate required args
if [[ -z "$on_session" ]]; then
  echo "error: --on required" >&2
  exit 2
fi

# .why the URI is passed THROUGH, untouched
#   this used to convert dots to underscores here, before the lib saw it. that
#   put the tmux form into `DUCT_NAME`, which is the REGISTRY key — so a stop
#   deleted `ducts/tree_with_dots/mechanic.json` while duct.open had written
#   `ducts/tree.with.dots/mechanic.json`. two different paths, so the row was
#   never removed, and the verb reported `stopped` regardless.
#
#   that is a PHANTOM factory: the session dies, the row lives, and every
#   later `duct.poll` reports `💥 malfunction` against a duct nobody can heal
#   — a re-run repeats the same mismatched delete (term=duct, term=false-report).
#
#   measured 2026-08-25, single-variable, one flag apart:
#     duct:///zzprobe.dot/mechanic     stop -> "stopped", row SURVIVES
#     duct:///zzprobe-nodot/mechanic   stop -> "stopped", row gone
#
#   the conversion belongs at the tmux boundary, and `__duct_parse_uri` now
#   does it there — see the two-name-form note in work/ductwork.sh.
duct.stop --on "$on_session"
