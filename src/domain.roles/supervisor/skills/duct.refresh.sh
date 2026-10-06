#!/usr/bin/env bash
######################################################################
# .what = force a redraw of every terminal attached to a duct
#
# .why  = fixes the common "frozen tab" desync: the tmux (duct)
#         session is HEALTHY and has moved on, but an attached
#         kitty/terminal client is still painting a STALE frame
#         (classic after a TUI like nvim exits mid-redraw).
#
#         this is NON-DESTRUCTIVE by design:
#           - does NOT kill the session (that's duct.stop)
#           - does NOT close the kitty window
#           - does NOT touch any other duct (e.g. the mechanic)
#         it only tells each attached client to repaint.
#
# usage:
#   rhx duct.refresh --on $treename/foreman
#   rhx duct.refresh --on sdk-config.beav.fix-cache/mechanic
#
# args:
#   --on    duct session name (required); dotted form ok, converted
#
# guarantee:
#   - works on LOCAL and REMOTE ducts alike (delegates to ductwork)
#   - restores a window stranded in `window-size manual` back to `latest`,
#     so the duct tracks its terminal again, and SAYS SO when it did
#   - fail-fast (exit 2) if the session is not found
#   - redraws ALL clients attached to the session
#   - zero clients attached is a SUCCESS (a headless grove duct is normal)
#   - never destructive: no program dies, no byte of state is lost.
#     `window-size latest` is tmux's own default — it hands geometry back
#     to the terminal rather than takes it
######################################################################

set -euo pipefail

# source ductwork functions (for name conventions / parity with peers)
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/ductwork.sh"

# parse args (filter out rhachet internal flags)
on_session=""
sweep_all=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --on) on_session="$2"; shift 2 ;;
    --all) sweep_all=1; shift ;;
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
      echo "✋ duct.refresh: unknown arg '$1'" >&2
      echo "   known: --on, --all" >&2
      exit 2 ;;
  esac
done

# validate required args
if [[ -z "$on_session" && -z "$sweep_all" ]]; then
  echo "✋ duct.refresh: --on required (or --all for the fleet)" >&2
  echo "   └─ e.g. rhx duct.refresh --on \$tree/mechanic" >&2
  echo "   └─ e.g. rhx duct.refresh --all" >&2
  exit 2
fi

######################################################################
# delegate to ductwork's duct.refresh — never reimplement it here
#
# .why = this file used to source ductwork.sh and then SHADOW the very
#        function it sourced, with an inline body that spoke bare `tmux`
#        against the local server only. so every remote duct — which is
#        most of the fleet — was answered:
#
#          ✋ session not found — no frame to redraw
#          re-open a fresh one with: rhx term.open …
#
#        for a session that was alive, healthy, and mid-turn. that is a
#        `false-report`, not a failure: the skill did not error, it
#        rendered a confident verdict about a subject it never reached,
#        and its named fix would have spawned a duplicate terminal onto
#        a duct that needed no repair at all.
#
#        the local-only read mangled the address too — `${on_session//./_}`
#        flattens a whole `duct://host/tree/role` uri into one session
#        name, so the lookup could not have matched even by accident.
#
# .why delegation rather than a port: ductwork's `duct.refresh` already
#        carries the remote branch, the headless-is-success case, and the
#        geometry restore. a second copy is a second surface to keep in
#        step, and this file is the proof of what that costs.
######################################################################
if [[ -n "$sweep_all" ]]; then
  duct.refresh --all
else
  duct.refresh --on "$on_session"
fi
