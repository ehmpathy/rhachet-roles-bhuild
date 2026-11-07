#!/usr/bin/env bash
######################################################################
# .what = tells whether a file's uncommitted diff is only a reorder of
#         its lines, or truly adds or drops lines
#
# .why  = a regenerated file (a settings json, a lockfile section) can
#         show hundreds of lines added and removed while its content is
#         the same set; a reviewer must know whether an entry was lost
#
# usage:
#   git.diff.reorder.sh --path '.claude/settings.json'
#   git.diff.reorder.sh --path 'pnpm-workspace.yaml' --against main
#
# guarantee:
#   - read-only: runs `git diff` alone, writes no file
#   - compares lines with lead space and a trail comma trimmed, so a
#     moved json entry matches itself
#   - exit 0 = a pure reorder; exit 2 = lines truly added or dropped
######################################################################
set -euo pipefail

FILE_PATH=""
AGAINST="HEAD"
while [[ $# -gt 0 ]]; do
  case $1 in
    --skill|--repo|--role)
      shift 2
      ;;
    --path)
      FILE_PATH="$2"
      shift 2
      ;;
    --against)
      AGAINST="$2"
      shift 2
      ;;
    --help|-h)
      echo "usage: git.diff.reorder.sh --path <file> [--against <ref>]"
      exit 0
      ;;
    *)
      echo "✋ ConstraintError: unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$FILE_PATH" ]]; then
  echo "✋ ConstraintError: --path is required" >&2
  exit 2
fi

# the diff, one changed line per row, its sign kept
DIFF_LINES="$(git diff --unified=0 "$AGAINST" -- "$FILE_PATH" | grep -E '^[-+]' | grep -vE '^(\+\+\+|---) ' || true)"

# the lines dropped with no twin added, and the lines added with no twin dropped
REPORT="$(printf '%s' "$DIFF_LINES" | jq -Rs '
  split("\n")
  | map(select(length > 0))
  | map({ sign: .[0:1], line: (.[1:] | gsub("^\\s+"; "") | gsub(",\\s*$"; "")) })
  | (map(select(.sign == "-").line)) as $dropped
  | (map(select(.sign == "+").line)) as $added
  | {
      dropped: ($dropped | length),
      added: ($added | length),
      droppedOnly: ($dropped - $added),
      addedOnly: ($added - $dropped)
    }
')"

DROPPED_ONLY="$(printf '%s' "$REPORT" | jq '.droppedOnly | length')"
ADDED_ONLY="$(printf '%s' "$REPORT" | jq '.addedOnly | length')"

echo "🐢 heres the wave"
echo ""
echo "🐚 git.diff.reorder"
echo "   ├─ path: $FILE_PATH"
echo "   ├─ against: $AGAINST"
echo "   ├─ lines changed: $(printf '%s' "$REPORT" | jq '.dropped') dropped, $(printf '%s' "$REPORT" | jq '.added') added"
echo "   ├─ dropped with no twin: $DROPPED_ONLY"
printf '%s' "$REPORT" | jq -r '.droppedOnly[] | "   │  ├─ - " + .'
echo "   └─ added with no twin: $ADDED_ONLY"
printf '%s' "$REPORT" | jq -r '.addedOnly[] | "      ├─ + " + .'

if [[ "$DROPPED_ONLY" == "0" && "$ADDED_ONLY" == "0" ]]; then
  exit 0
fi
exit 2
