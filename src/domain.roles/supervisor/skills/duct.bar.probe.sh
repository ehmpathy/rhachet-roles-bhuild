#!/usr/bin/env bash
######################################################################
# .what = read, per duct session on this box, what its tmux bar draws and
#         what it is wired to read
#
# .why  = "the bar shows the wrong label" has two causes that look alike:
#         the bar reads a pane option a shell hook overwrites, or the bar was
#         never pinned to the duct at all. this tells them apart in one call,
#         on every tmux server here (ducts sit one server per org)
#
# usage:
#   duct.bar.probe.sh                  # every tree/role session on every server
#   duct.bar.probe.sh --session <s>    # one session
#
# guarantee:
#   - reads only: list-sessions, display-message, show-options; never sets
#   - exit 0 = probed (findings are reported, never an error)
#   - exit 2 = bad args, or no tmux on this box
######################################################################
set -uo pipefail

ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift; [[ $# -gt 0 ]] && shift ;;  # a trailer with no value never spins the loop
    --session)
      # a --session with no value, or the next flag as its value, is refused by name
      if [[ $# -lt 2 || "$2" == --* ]]; then
        got="none"; [[ $# -ge 2 ]] && got="the next flag '$2'"
        echo "✋ ConstraintError: --session takes a value, got $got" >&2
        echo "   └─ fix: rhx duct.bar.probe --session <tree>/<role>   # or bare, for every session" >&2
        exit 2
      fi
      ONLY="$2"; shift 2 ;;
    -h|--help)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0 ;;
    *) echo "✋ ConstraintError: unknown arg '$1'" >&2
       echo "   ├─ valid args: --session <tree>/<role> · --help" >&2
       echo "   └─ fix: rhx duct.bar.probe --session <tree>/<role>   # or bare, for every session" >&2
       exit 2 ;;
  esac
done
command -v tmux >/dev/null || { echo "✋ ConstraintError: no tmux on this box" >&2; exit 2; }

# every server socket this uid owns
SOCKDIR="${TMUX_TMPDIR:-/tmp}/tmux-$(id -u)"
SOCKS=()
[[ -d "$SOCKDIR" ]] && for p in "$SOCKDIR"/*; do [[ -S "$p" ]] && SOCKS+=("${p##*/}"); done

echo "🦫 chew on it"
echo ""
echo "🪵 duct.bar.probe${ONLY:+ --session $ONLY}"
echo "   ├─ servers: ${#SOCKS[@]} (${SOCKDIR})"
FOUND=0
UNREAD=0
for sock in "${SOCKS[@]}"; do
  T() { tmux -L "$sock" "$@"; }
  # a server that does not answer is UNREAD, never empty: say so, so a duct on it is not missed in silence
  if ! sessions="$(T list-sessions -F '#{session_name}' 2>/dev/null)"; then
    UNREAD=$(( UNREAD + 1 ))
    echo "   ├─ 🟡 server $sock did not answer: its sessions are unread (a stale socket, or a server that died)"
    continue
  fi
  while IFS= read -r s; do
    [[ -n "$s" ]] || continue
    if [[ -n "$ONLY" ]]; then [[ "$s" == "$ONLY" ]] || continue
    else [[ "$s" == */* ]] || continue; fi
    FOUND=$(( FOUND + 1 ))
    shown="$(T display-message -p -t "$s" '#{E:status-left}|#{E:status-right}' 2>/dev/null)"
    raw="$(T show-options -t "$s" -v status-left 2>/dev/null)"
    rawg="$(T show-options -g -v status-left 2>/dev/null)"
    wfmt="$(T show-options -gw -v window-status-format 2>/dev/null)"
    # resolved pane → session, as the bar's format resolves it: the duct stamps its pair at session scope
    drepo="$(T display-message -p -t "$s" '#{@duct_repo}' 2>/dev/null)"
    repo="$(T show-options -p -t "$s" -v @repo 2>/dev/null)"
    pinned="no"; [[ "$raw" == *@duct_repo* ]] && pinned="yes"
    echo "   ├─ $s (server $sock)"
    echo "   │  ├─ shown: [${shown}]"
    echo "   │  ├─ status-left: session=[${raw:-(unset, inherits global)}] global=[${rawg}]"
    echo "   │  ├─ window-status-format (global): [${wfmt}]"
    echo "   │  ├─ @duct_repo (resolved)=[${drepo}] pane @repo=[${repo}]"
    echo "   │  └─ pinned to duct: ${pinned}"
  done <<< "$sessions"
done
NOUN_SESSION="sessions"; [[ $FOUND -eq 1 ]] && NOUN_SESSION="session"
NOUN_SERVER="servers"; [[ $UNREAD -eq 1 ]] && NOUN_SERVER="server"
TAIL=""
if [[ $UNREAD -gt 0 ]]; then TAIL=", ${UNREAD} ${NOUN_SERVER} unread"; fi
echo "   └─ done: ${FOUND} ${NOUN_SESSION}${TAIL}"
exit 0
