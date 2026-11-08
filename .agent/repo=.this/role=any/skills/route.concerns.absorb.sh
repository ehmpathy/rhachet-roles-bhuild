#!/usr/bin/env bash
######################################################################
# .what = render one disposition per peer concern, from a list on stdin
#
# .why  = a review round can raise dozens of concerns, and each owes
#         one `route.stone.set --as conceded|disputed` call. a list on
#         stdin keeps each stance in one reviewable line, and the calls
#         run one per line, in order, with each verdict echoed
#
# usage:
#   printf '%s\n' \
#     'mech-failhides blocker.1 conceded urgent' \
#     'mech-failhides nitpick.2 disputed path/to/fulcrum.md' \
#   | rhx route.concerns.absorb --stone 5.1.execution.from_vision
#
#   line = <reviewer-slug> <ordinal> conceded <better|urgent>
#        | <reviewer-slug> <ordinal> disputed <why-path>
#   blank lines and lines that start with # are skipped
#
# guarantee:
#   - each line runs exactly one `rhx route.stone.set`; no other write
#   - a malformed line halts before any call (exit 2), its line named
#   - a call that fails halts the rest (its exit code is passed on)
#   - never absorbs a lane as a whole; that stays a deliberate act
######################################################################
set -euo pipefail

STONE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --stone)
      [[ $# -ge 2 && "$2" != --* ]] || { echo "✋ ConstraintError: --stone needs a value" >&2; exit 2; }
      STONE="$2"; shift 2 ;;
    --help|-h) sed -n '2,25p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "✋ ConstraintError: unknown argument '$1'" >&2; exit 2 ;;
  esac
done
[[ -n "$STONE" ]] || { echo "✋ ConstraintError: --stone is required" >&2; exit 2; }

# read and validate every line before any call
LINES=()
NUM=0
while IFS= read -r LINE || [[ -n "$LINE" ]]; do
  NUM=$((NUM + 1))
  [[ -z "${LINE//[[:space:]]/}" || "$LINE" == \#* ]] && continue
  read -r SLUG ABOUT STANCE ARG EXTRA <<<"$LINE"
  [[ -z "${EXTRA:-}" && -n "${ARG:-}" ]] \
    || { echo "✋ ConstraintError: line $NUM needs 4 fields: $LINE" >&2; exit 2; }
  [[ "$ABOUT" =~ ^(blocker|nitpick)\.[0-9]+$ ]] \
    || { echo "✋ ConstraintError: line $NUM ordinal must be blocker.N or nitpick.N: $LINE" >&2; exit 2; }
  case "$STANCE" in
    conceded) [[ "$ARG" == better || "$ARG" == urgent ]] \
      || { echo "✋ ConstraintError: line $NUM severity must be better or urgent: $LINE" >&2; exit 2; } ;;
    disputed) [[ -f "$ARG" ]] \
      || { echo "✋ ConstraintError: line $NUM why-path is not a file: $ARG" >&2; exit 2; } ;;
    *) echo "✋ ConstraintError: line $NUM stance must be conceded or disputed: $LINE" >&2; exit 2 ;;
  esac
  LINES+=("$SLUG $ABOUT $STANCE $ARG")
done

# one call per line, in order
for LINE in "${LINES[@]}"; do
  read -r SLUG ABOUT STANCE ARG <<<"$LINE"
  FLAG="--severity"
  [[ "$STANCE" == disputed ]] && FLAG="--why"
  echo "🗿 $SLUG $ABOUT → $STANCE ($ARG)"
  rhx route.stone.set --stone "$STONE" --as "$STANCE" --with "$SLUG" --about "$ABOUT" "$FLAG" "$ARG" >/dev/null
done
echo "🦉 ${#LINES[@]} concerns rendered"