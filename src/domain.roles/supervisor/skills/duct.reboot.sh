#!/usr/bin/env bash
######################################################################
# .what = reboot a duct's pane — kill the wedged program, fresh shell
#
# .why  = when a duct's foreground program is truly HUNG (e.g. an
#         nvim that won't exit, a TUI stuck mid-redraw), a repaint
#         (duct.refresh) is not enough — the process itself is wedged.
#         duct.reboot respawns the pane in place: it kills whatever
#         runs there and starts a fresh shell in the SAME session,
#         window, and worktree.
#
#         this is the "reboot the duct" lever:
#           - session name, window, and cwd are preserved
#           - the wedged program (nvim, hung build) is killed
#           - a clean shell prompt takes its place
#           - the mechanic / peer ducts are NOT touched
#
#         it does NOT kill the session (that's duct.stop) and does
#         NOT close the kitty window — the same window now shows a
#         fresh shell.
#
# usage:
#   rhx duct.reboot --on $treename/foreman
#   rhx duct.reboot --on sdk-config.beav.fix-cache/mechanic
#
# args:
#   --on    duct session name (required); dotted form ok, converted
#
# .caution
#   respawn KILLS the pane's current program. only reboot a duct
#   that is wedged or idle — never one mid-command you care about
#   (an active build, a git operation), or that work dies.
#
# guarantee:
#   - fail-fast (exit 2) if the session is not found
#   - preserves session, window, and cwd (respawn-pane, not kill)
#   - starts a fresh shell in the pane
#   - never touches peer ducts
######################################################################

set -euo pipefail

# source ductwork functions (parity with peer skills)
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
    # .note = this verb is DESTRUCTIVE (respawn kills the pane's program),
    #         so a swallowed flag here is a swallowed guard. a caller that
    #         reached for a scope or a mode it thought existed gets the
    #         unscoped act instead, and a success report over it.
    *)
      echo "✋ duct.reboot: unknown arg '$1'" >&2
      echo "   known: --on" >&2
      exit 2 ;;
  esac
done

# validate required args
if [[ -z "$on_session" ]]; then
  echo "error: --on required" >&2
  exit 2
fi

# 🔴 .why DELEGATE and not reimplement
#   this wrapper sources ductwork.sh above, which defines a grove-capable
#   `duct.reboot()` — it parses the uri's HOST, probes the remote session,
#   and respawns over ssh (ductwork.sh:1586-1620). the wrapper then used to
#   ignore that function and re-do the job with BARE `tmux` calls, which
#   reach localhost and no other box.
#
#   ⚠️ the failure was silent and inverted: a grove duct got its whole uri
#      `.`→`_` mangled, handed to a local `has-session`, and reported
#      "session not found — the tmux session is already gone" for a session
#      that was alive and readable on its grove. so the verb named the one
#      cure a supervisor must NOT reach for (term.open a fresh duct) over a
#      live pane that held real work (term=false-report).
#
#   measured 2026-09-05 on a wedged nvim in
#   rhachet-roles-ehmpathy.beav.fix-grepsafe-slashed-glob/foreman — the
#   duct read live through crew.read in the same minute the reboot called
#   it absent.
#
#   ⇒ one implementation, in the lib. the wrapper is an entrypoint, never a
#     second copy (rule.forbid.domain-term-synonyms' code twin: two
#     implementations of one verb drift, and the drifted one is the one a
#     caller reaches by name).
duct.reboot --on "$on_session"
