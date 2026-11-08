#!/usr/bin/env bash
######################################################################
# .what = mark files inside this repo executable (+x), or not (-x)
#
# .why  = a skill written by an editor lands 0644, and a layout clamp
#         (and every caller) needs it runnable; raw chmod is not paved
#
# usage:
#   chmodsafe.sh --exec on  <path> [<path> ...]    # chmod +x
#   chmodsafe.sh --exec off <path> [<path> ...]    # chmod -x
#
# guarantee:
#   - touches only the exec bits; never read/write bits
#   - every path must be a regular file inside the git root (no symlink
#     escape, no dir); one bad path refuses the whole call, exit 2
#   - prints each path with its mode after the change
######################################################################
set -euo pipefail

EXEC=""
PATHS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --skill|--repo|--role) shift 2 ;;
    --exec) EXEC="${2:-}"; shift 2 ;;
    --help|-h) sed -n '2,17p' "$0"; exit 0 ;;
    -*) echo "✋ ConstraintError: unknown flag '$1'" >&2; exit 2 ;;
    *) PATHS+=("$1"); shift ;;
  esac
done

# reject absent or malformed input
[[ "$EXEC" == "on" || "$EXEC" == "off" ]] || { echo "✋ ConstraintError: --exec must be on or off, got '$EXEC'" >&2; exit 2; }
(( ${#PATHS[@]} > 0 )) || { echo "✋ ConstraintError: name at least one path" >&2; exit 2; }

# every path must be a regular file inside the git root
ROOT=$(git rev-parse --show-toplevel)
for p in "${PATHS[@]}"; do
  [[ -f "$p" && ! -L "$p" ]] || { echo "✋ ConstraintError: not a regular file: $p" >&2; exit 2; }
  real=$(realpath "$p")
  [[ "$real" == "$ROOT"/* ]] || { echo "✋ ConstraintError: outside the repo: $p" >&2; exit 2; }
done

# apply, then show the mode each path now holds
FLAG="+x"; [[ "$EXEC" == "off" ]] && FLAG="-x"
echo "🐢 chmodsafe --exec $EXEC"
for p in "${PATHS[@]}"; do
  chmod "$FLAG" -- "$p"
  echo "   ├─ $(stat -c '%A' -- "$p") $p"
done
echo "   └─ ${#PATHS[@]} file(s)"
