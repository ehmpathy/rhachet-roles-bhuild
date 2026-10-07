#!/usr/bin/env bash
######################################################################
# .what = open visible terminal window
#
# .why  = enables human to watch agent work
#         - attach to duct session in kitty window
#         - human can close window, duct continues
#         - human can reopen anytime
#         - also standalone terminal with --cwd
#
# usage:
#   rhx term.open --via kitty --on sdk-config/mechanic   # attach to duct
#   rhx term.open --via kitty --on $tree --for foreman   # +tab in $tree's window
#   rhx term.open --via kitty --cwd /path/to/worktree    # standalone
#
# args:
#   --via   terminal emulator (required, currently: kitty)
#   --on    duct session name, bare or as a duct:/// uri
#   --for   role tab to add to the tree's extant window (mechanic | foreman)
#   --cwd   directory to open in (standalone terminal)
#
# note:
#   exactly one of --on or --cwd is required
#
# .why --for exists
#   a tree gets ONE window with a tab per role (see git.tree.duct). --for adds
#   the role tab to that extant window. WITHOUT --for, --on spawns a separate
#   window instead -- so to restore a lost foreman tab, always pass --for.
#   pair --on $tree with --for $role; the role is NOT part of --on.
#
# guarantee:
#   - opens visible window
#   - fail-fast on errors
######################################################################

set -euo pipefail

# source termwork functions
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/termwork.sh"

# parse args (filter out rhachet internal flags)
via=""
on_session=""
cwd=""
for_role=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --via) via="$2"; shift 2 ;;
    --on) on_session="$2"; shift 2 ;;
    --cwd) cwd="$2"; shift 2 ;;
    --for) for_role="$2"; shift 2 ;;   # termwork role tab (worktree/role)
    --skill|--repo|--role) shift 2 ;;  # skip rhachet internal flags

    # .why the header's OWN terminator, never a pinned line number: a literal
    #   bound goes stale the moment the header grows, and stays silent when it
    #   does — a false report about the file it lives in (git.crew.poll:477)
    --help|-h)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;

    # 🔴 an unknown flag FAILS — it used to `shift` silently, and the silence
    #    was not cosmetic. the lib function takes --tab and --duct; this
    #    wrapper does not forward them, so a caller who passed them had the
    #    flags DROPPED and fell through to the plain --on path. that path
    #    findserts a duct named after whatever --on held, so the miss did not
    #    merely fail — it MINTED DEBRIS (a local duct literally named
    #    `grove-sandpine-v20260901:declastruct-aws_beav_…`) and exited 0.
    #    measured 2026-09-11. a dropped flag must never read as a success.
    *) echo "✋ term.open: unknown arg '$1'" >&2
       echo "   this wrapper takes: --via --on --for --cwd" >&2
       echo "   for --tab/--duct, call the termwork function directly" >&2
       exit 2 ;;
  esac
done

# validate required args
if [[ -z "$via" ]]; then
  echo "error: --via required" >&2
  exit 2
fi

if [[ -z "$on_session" && -z "$cwd" ]]; then
  echo "error: either --on or --cwd required" >&2
  exit 2
fi

if [[ -n "$on_session" && -n "$cwd" ]]; then
  echo "error: --on and --cwd are mutually exclusive" >&2
  exit 2
fi

# call term.open with parsed args
if [[ -n "$on_session" ]]; then
  # accept either a bare tree name or a duct uri in --on, so a caller can paste
  # back whatever duct.list / term.audit printed. termwork takes the BARE name,
  # ductwork takes the uri, so we strip the scheme here and re-add it at each
  # rhx duct.open call below.
  on_session="${on_session#duct://}"
  on_session="${on_session#/}"

  # convert to tmux-compatible name (dots to underscores, slashes stay)
  session_name="${on_session//./_}"

  # a uri may already carry the role (duct:///$tree/$role). --for owns the role,
  # so strip a trailing /$role rather than build $tree/$role/$role below.
  if [[ -n "$for_role" ]]; then
    session_name="${session_name%/"$for_role"}"
  fi

  if [[ -n "$for_role" ]]; then
    # role tab: termwork's --for <role> attaches the duct <terminal>/<role>.
    # findsert that duct session first (rhx duct.open is idempotent), so the
    # tab always has a live session to attach — no direct tmux calls, per
    # rule.forbid.direct-tmux-duct-term.
    duct_session="${session_name}/${for_role}"
    rhx duct.open --on "duct:///${duct_session}" --cwd "${cwd:-$(pwd)}"
    # capture termwork's combined output so its error surfaces on stdout
    # (the rhachet harness hides a failed skill's stderr)
    out=$(term.open --via "$via" --on "$session_name" --for "$for_role" 2>&1) || {
      echo "$out"
      exit 1
    }
    echo "$out"
  else
    # plain terminal: findsert the session, then attach
    rhx duct.open --on "duct:///${session_name}" --cwd "${cwd:-$(pwd)}"
    term.open --via "$via" --on "$session_name"
  fi
else
  term.open --via "$via" --cwd "$cwd"
fi
