#!/usr/bin/env bash
######################################################################
# .what = parse-check shell files with `bash -n`, one verdict per file
#
# .why  = an edit to a skill or a work lib is worth a parse before a slow
#         integration run; a bare `bash -n` is not paved, so this is the one call
#
# usage:
#   shell.syntax.check.sh <file.sh> [<file.sh> ...]
#
# guarantee:
#   - reads only; runs naught but the parser
#   - exit 0 = every file parses
#   - exit 2 = constraint: a file is absent or does not parse (the caller fixes
#     it), or bad args. the parser never malfunctions on our side, so no exit 1
######################################################################
set -uo pipefail

FILES=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    -h|--help)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0 ;;
    -*) echo "✋ ConstraintError: unknown flag '$1'" >&2; exit 2 ;;
    *) FILES+=("$1"); shift ;;
  esac
done
[[ ${#FILES[@]} -eq 0 ]] && { echo "✋ ConstraintError: name at least one file" >&2; exit 2; }

echo "🐢 heres the wave..."
echo ""
echo "🐚 shell.syntax.check"
FAILED=0
for i in "${!FILES[@]}"; do
  f="${FILES[$i]}"
  glyph="├─"; [[ $i -eq $(( ${#FILES[@]} - 1 )) ]] && glyph="└─"
  if [[ ! -f "$f" ]]; then
    echo "   $glyph ❌ $f — absent"; FAILED=$(( FAILED + 1 )); continue
  fi
  if said=$(bash -n "$f" 2>&1); then
    echo "   $glyph ✅ $f"
  else
    echo "   $glyph ❌ $f"
    echo "$said" | sed 's/^/        /'
    FAILED=$(( FAILED + 1 ))
  fi
done
if [[ "$FAILED" -gt 0 ]]; then
  echo "" >&2
  echo "✋ ConstraintError: $FAILED file(s) absent or do not parse" >&2
  echo "   └─ fix: repair each ❌ above at the line bash names, then re-run" >&2
  exit 2
fi
exit 0
