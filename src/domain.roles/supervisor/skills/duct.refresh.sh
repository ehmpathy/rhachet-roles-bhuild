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
#   rhx duct.refresh --on sdk-config.beav.fix-cache/mechanic --home ~/git/sandpine/_worktrees/sdk-config.beav.fix-cache
#   rhx duct.refresh --all
#
# args:
#   --on    duct session name (required, unless --all); dotted form ok, converted
#   --all   every registered duct, in place of --on
#   --home  the duct's own tree dir; sets or corrects its home anchor, said aloud (with --on only)
#
# also:
#   - stamps and pins the duct's status bar to its own tree (repo · branch),
#     so a shell that `cd`s away no longer relabels it
#   - the bar is static: it is painted at boot and here, never live. a seat that
#     ran before this stamp keeps its old label until a repaint. for a crew
#     seat, prefer `rhx git.crew.refresh --tree <tree>`: it hands the seat its
#     tree as --home, so a seat born in the wrong dir is corrected too
#
# guarantee:
#   - works on local and remote ducts alike (delegates to ductwork)
#   - restores a window stranded in `window-size manual` back to `latest`,
#     so the duct tracks its terminal again, and says so when it did
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
home_dir=""
while [[ $# -gt 0 ]]; do
  # a value flag with no value, or the next flag as its value, is refused by name — never an `unbound variable`
  case "$1" in
    --on|--home)
      if [[ $# -lt 2 || "$2" == --* ]]; then
        got="none"; [[ $# -ge 2 ]] && got="the next flag '$2'"
        echo "✋ ConstraintError: duct.refresh $1 takes a value, got $got" >&2
        echo "   └─ fix: rhx duct.refresh --on <tree>/<role> [--home <tree dir>]" >&2
        exit 2
      fi ;;
  esac
  case "$1" in
    --on) on_session="$2"; shift 2 ;;
    --all) sweep_all=1; shift ;;
    --home) home_dir="$2"; shift 2 ;;
    --skill|--repo|--role) shift; [[ $# -gt 0 ]] && shift ;;  # skip rhachet internal flags; a trailer with no value never spins the loop

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
      echo "✋ ConstraintError: unknown arg '$1'" >&2
      echo "   ├─ valid args: --on <tree>/<role> · --home <tree dir> · --all · --help" >&2
      echo "   └─ fix: rhx duct.refresh --on <tree>/<role>   # see --help for each" >&2
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

# --home names ONE duct's tree, so it rides --on alone; refused here, at the layer the caller invoked
if [[ -n "$sweep_all" && -n "$home_dir" ]]; then
  echo "✋ ConstraintError: duct.refresh --home names one duct's own tree, so it cannot ride --all" >&2
  echo "   └─ fix: rhx duct.refresh --on <tree>/<role> --home <tree dir>   # one duct, its home said aloud" >&2
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
elif [[ -n "$home_dir" ]]; then
  duct.refresh --on "$on_session" --home "$home_dir"
else
  duct.refresh --on "$on_session"
fi
