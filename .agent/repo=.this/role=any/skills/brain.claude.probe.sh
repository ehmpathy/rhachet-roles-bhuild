#!/usr/bin/env bash
######################################################################
# .what = ask the pinned claude cli once per brain id, with the
#         ehmpath/test ANTHROPIC_API_KEY, and print each verdict
#
# .why  = the brain.claude contract test slices stdout to 500 chars,
#         so a red run hides whether the cause is the model id or the
#         account behind the key; this probe prints is_error, result,
#         and the served model, never the key
#
# usage:
#   brain.claude.probe.sh 'claude-opus-5-5[1m]' 'claude-sonnet-5'
#
# guarantee:
#   - does not unlock; run `rhx keyrack unlock --owner ehmpath --env test` first
#   - the key never reaches stdout or stderr (masked as <key>)
#   - one real api call per brain id (cost: a few tokens each)
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# print the header between its two fences, so the help grows with the header
print_help_from_header() {
  awk '/^#####+$/ { seen++; next } seen == 1' "$1" | sed 's/^# \{0,1\}//'
}

# drop the args rhachet passes to every skill; refuse any flag this skill does not declare
BRAINS=()
while [[ $# -gt 0 ]]; do
  case $1 in
    --skill|--repo|--role)
      if [[ $# -lt 2 ]]; then
        echo "✋ ConstraintError: $1 needs a value" >&2
        exit 2
      fi
      shift 2 ;;
    --) shift ;;
    --help|-h) print_help_from_header "${BASH_SOURCE[0]}"; exit 0 ;;
    -*)
      echo "✋ ConstraintError: unknown flag '$1'; pass brain ids as plain args (see --help)" >&2
      exit 2 ;;
    *) BRAINS+=("$1"); shift ;;
  esac
done

if [[ ${#BRAINS[@]} -eq 0 ]]; then
  echo "✋ ConstraintError: name at least one brain id, e.g. 'claude-opus-5-5[1m]'" >&2
  exit 2
fi

exec node "$SCRIPT_DIR/brain.claude.probe.mjs" "${BRAINS[@]}"
