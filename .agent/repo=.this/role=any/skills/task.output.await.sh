#!/usr/bin/env bash
######################################################################
# .what = block until a background task's output file shows a pattern,
#         or a bound passes; then print the file's tail
#
# .why  = a long test run in the background re-fires the stop hook each
#         turn; one bounded wait in the foreground replaces many polls
#
# usage:
#   task.output.await.sh --file <path> --pattern '<regex>'               # wait up to 540s
#   task.output.await.sh --file <path> --pattern '<regex>' --max-sec 300
#
# guarantee:
#   - read-only: reads the file, writes naught
#   - exit 0 = the pattern showed · exit 2 = the bound passed first (not an error;
#     the task still runs) · exit 2 also on bad input
#   - --max-sec is capped at 590, under the 600s foreground bound
######################################################################
set -euo pipefail

FILE=""
PATTERN=""
MAX_SEC=540

while [[ $# -gt 0 ]]; do
  case $1 in
    --skill|--repo|--role) shift 2 ;;
    --file) FILE="$2"; shift 2 ;;
    --pattern) PATTERN="$2"; shift 2 ;;
    --max-sec) MAX_SEC="$2"; shift 2 ;;
    --help|-h)
      sed -n '2,18p' "$0"
      exit 0
      ;;
    *) echo "✋ ConstraintError: unknown argument: $1" >&2; exit 2 ;;
  esac
done

# reject absent or malformed input
[[ -n "$FILE" ]] || { echo "✋ ConstraintError: --file is required" >&2; exit 2; }
[[ -n "$PATTERN" ]] || { echo "✋ ConstraintError: --pattern is required" >&2; exit 2; }
[[ "$MAX_SEC" =~ ^[0-9]+$ ]] || { echo "✋ ConstraintError: --max-sec must be an integer, got '$MAX_SEC'" >&2; exit 2; }
(( MAX_SEC <= 590 )) || MAX_SEC=590
[[ -f "$FILE" ]] || { echo "✋ ConstraintError: no such file: $FILE" >&2; exit 2; }

# wait for the pattern, bounded
WAITED=0
while (( WAITED < MAX_SEC )); do
  if grep -Eq -- "$PATTERN" "$FILE"; then
    echo "🐢 found after ${WAITED}s"
    tail -c 3000 "$FILE"
    exit 0
  fi
  sleep 10
  WAITED=$(( WAITED + 10 ))
done

# bound passed; the task still runs
echo "🌙 not yet, after ${MAX_SEC}s — the task still runs; await again"
tail -c 600 "$FILE"
exit 2
