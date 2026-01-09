#!/usr/bin/env bash
######################################################################
# .what = bind behaver hooks to Claude settings
#
# .why  = the behaver role uses a SessionStart hook to inject
#         bound behavior context into agent sessions on start
#         and compaction events.
#
# .how  = 1. runs cleanup to remove stale hooks (deleted scripts)
#         2. calls findsert for each hook in desired order
#
# guarantee:
#   ✔ idempotent: safe to rerun
#   ✔ fail-fast on errors
######################################################################

set -euo pipefail

# fail loud: print what failed
trap 'echo "❌ init.claude.hooks.sh failed at line $LINENO" >&2' ERR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FINDSERT="$SCRIPT_DIR/init.claude.hooks.findsert.sh"
CLEANUP="$SCRIPT_DIR/init.claude.hooks.cleanup.sh"
RHACHET_CLI="./node_modules/.bin/rhachet"

# rhachet run --init provides fast hook execution via compiled binary
RHACHET_INIT="$RHACHET_CLI run --repo bhuild --role behaver --init"

# collect hook results for tree output
HOOKS_BOUND=()
HOOKS_PRESENT=()

# helper to run findsert and collect result
run_findsert() {
  local name="$1"
  shift
  local output
  output=$("$FINDSERT" "$@" 2>&1)
  if [[ "$output" == *"bound successfully"* ]]; then
    HOOKS_BOUND+=("$name")
  elif [[ "$output" == *"already bound"* ]]; then
    HOOKS_PRESENT+=("$name")
  fi
}

# first, cleanup any stale hooks (reference removed scripts)
"$CLEANUP"

# SessionStart hook: boot behavior context
# note: SessionStart hooks run on both session start AND compaction
run_findsert "sessionstart.boot-behavior" \
  --hook-type SessionStart \
  --matcher "*" \
  --command "$RHACHET_INIT claude.hooks/sessionstart.boot-behavior" \
  --name "sessionstart.boot-behavior" \
  --timeout 10

# print tree for newly bound hooks
if [[ ${#HOOKS_BOUND[@]} -gt 0 ]]; then
  echo "🔗 bind hooks"
  for i in "${!HOOKS_BOUND[@]}"; do
    if [[ $((i + 1)) -eq ${#HOOKS_BOUND[@]} ]]; then
      echo "   └── ${HOOKS_BOUND[$i]}"
    else
      echo "   ├── ${HOOKS_BOUND[$i]}"
    fi
  done
  echo ""
fi

# print tree for hooks already present
if [[ ${#HOOKS_PRESENT[@]} -gt 0 ]]; then
  echo "👌 hooks already bound"
  for i in "${!HOOKS_PRESENT[@]}"; do
    if [[ $((i + 1)) -eq ${#HOOKS_PRESENT[@]} ]]; then
      echo "   └── ${HOOKS_PRESENT[$i]}"
    else
      echo "   ├── ${HOOKS_PRESENT[$i]}"
    fi
  done
  echo ""
fi
