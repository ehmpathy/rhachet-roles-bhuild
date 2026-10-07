#!/usr/bin/env bash
######################################################################
# .what = create or attach to a duct (tmux session) in a directory
#
# .why  = enables headless terminal sessions that persist
#         - start work, detach, reattach later
#         - send commands to background sessions
#         - compose with term.open for visible windows
#
# usage:
#   rhx duct.open --on work/mechanic --cwd /path/to/worktree
#   rhx duct.open --on work/foreman --cwd /path/to/worktree
#   rhx duct.open --on work/mechanic --cwd /path/to/worktree --mode headfull
#
# args:
#   --on    session name (required)
#   --cwd   directory to start in (required)
#   --mode  headless (default) or headfull
#
# guarantee:
#   - findserts session (creates if not found, finds if extant)
#   - starts session in --cwd directory
#   - fail-fast on errors
######################################################################

set -euo pipefail

# source ductwork functions
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/ductwork.sh"

# parse args (filter out rhachet internal flags)
on_session=""
cwd=""
mode=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --on) on_session="$2"; shift 2 ;;
    --cwd) cwd="$2"; shift 2 ;;
    --mode) mode="$2"; shift 2 ;;
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
      echo "✋ duct.open: unknown arg '$1'" >&2
      echo "   known: --on --cwd --mode" >&2
      exit 2 ;;
  esac
done

# validate required args
if [[ -z "$on_session" ]]; then
  echo "error: --on required" >&2
  exit 2
fi

if [[ -z "$cwd" ]]; then
  echo "error: --cwd required" >&2
  echo "" >&2
  echo "ducts must start in a directory. usage:" >&2
  echo "  rhx duct.open --on slug/mechanic --cwd /path/to/worktree" >&2
  exit 2
fi

# ⚠️ the EXISTENCE of --cwd is checked here; whether it IS a directory is NOT.
#
# .why = that second question is host-scoped — a `duct://<grove>/…` cwd lives on
#        the grove, and this box cannot stat it. only the layer that has parsed
#        the uri knows which machine to ask, so the test belongs there and only
#        there. this wrapper carried a second copy until 2026-09-02, and a rule
#        with two readers is a rule whose readers drift.
#
#        ductwork's `duct.open` owns it, below its parse. see the note there.

# .note = this once computed a `session_name="${on_session//./_}"` here and
#         then never used it — the calls below always passed the raw uri. that
#         dead line read like a guarantee the wrapper did not make, and it sat
#         directly above a comment that claims a findsert, while the findsert
#         was in fact broken for every dotted name. removed rather than wired
#         up: the conversion belongs at the tmux boundary inside ductwork, and
#         a wrapper that pre-converts corrupts the registry key (see the note
#         in duct.stop.sh, and the two-name-form note in work/ductwork.sh).

# defer entirely to raw duct.open for the findsert: it creates the session if
# absent AND registers it either way (found OR created) — self-heals a live but
# unregistered session back into the registry. capture its output to learn which
# path it took (it prints "created" vs "found").
if [[ -n "$mode" ]]; then
  out=$(duct.open --on "$on_session" --cwd "$cwd" --mode "$mode")
else
  out=$(duct.open --on "$on_session" --cwd "$cwd")
fi
echo "$out"

# .note = the cwd is now set AT CREATION, via `tmux new-session -c`.
#
# this used to be a follow-up `duct.send --await 30 --what "cd '$cwd'"`, because
# the raw duct.open dropped --cwd on the floor. that workaround carried two costs
# the -c does not:
#   1. a race — a freshly spawned pane runs its rc + prompt (starship shells out
#      to git), so a send that lands while the pane is BUSY was rejected, and
#      under `set -e` that aborted the skill AFTER the session existed
#   2. a wrong-directory window — between spawn and cd, the pane sat in the
#      CALLER's cwd, so a reader in that gap read the wrong repo
#
# a session created with -c is never in the wrong directory, not even briefly.
# solve at cause (rule.require.solve-at-cause).
#
# a FOUND session is deliberately left alone: it is live, a mechanic may be
# mid-task in it, and a cd would yank the cwd out from under them.
