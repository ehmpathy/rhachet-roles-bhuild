#!/usr/bin/env bash
######################################################################
# .what = bind behaver hooks to Claude settings
#
# .why  = the behaver role uses a SessionStart hook to inject
#         bound behavior context into agent sessions on start
#         and compaction events.
#
# .how  = calls findsert for the boot-behavior hook
#
# guarantee:
#   ✔ idempotent: safe to rerun
#   ✔ fail-fast on errors
######################################################################

set -euo pipefail

# fail loud: print what failed
trap 'echo "❌ init.claude.hooks.sh failed at line $LINENO" >&2' ERR

INITS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FINDSERT="$INITS_DIR/init.claude.hooks.findsert.sh"

# path to hook scripts (relative to this script)
HOOKS_DIR="$INITS_DIR/claude.hooks"

# SessionStart hook: boot behavior context
# note: SessionStart hooks run on both session start AND compaction
"$FINDSERT" \
  --hook-type SessionStart \
  --matcher "*" \
  --command "$HOOKS_DIR/sessionstart.boot-behavior.sh" \
  --name "sessionstart.boot-behavior" \
  --timeout 10
