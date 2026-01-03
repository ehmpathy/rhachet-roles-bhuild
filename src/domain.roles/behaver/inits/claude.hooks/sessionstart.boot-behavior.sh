#!/usr/bin/env bash
######################################################################
# .what = inject bound behavior context on session start
#
# .why  = agent starts with full awareness of current behavior
#
# .note = SessionStart hooks run on both session start AND compaction
#         this means behavior context is re-injected after context
#         is summarized, keeping the agent aligned.
#
# guarantee:
#   ✔ exits 0 silently if branch not bound (unbound = normal work)
#   ✔ exits 0 with warning if multiple bindings (don't block session)
#   ✔ never blocks session start (exit 0 always)
######################################################################

# note: no set -e because we must exit 0 always
set -uo pipefail

# delegate to TypeScript implementation via package export
npx tsx -e "import('rhachet-roles-bhuild').then(m => m.cli.bootBehavior())" -- "$@" || exit 0
