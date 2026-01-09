#!/usr/bin/env bash
######################################################################
# .what = bind, unbind, or query branch-to-behavior bound
#
# .why  = explicit user control over which behavior applies to current branch
#         - track which behavior is active for current work
#         - prevent accidental work on wrong behavior
#         - support worktree-per-behavior workflow
#
# usage:
#   bind.behavior.sh set --behavior <name>   # bind current branch
#   bind.behavior.sh del                     # unbind current branch
#   bind.behavior.sh get                     # query current bound
#
# guarantee:
#   - fail-fast if behavior not found or ambiguous
#   - fail-fast if set to different behavior (suggest del or worktree)
#   - idempotent: set to same behavior succeeds, del when unbound succeeds
######################################################################

set -euo pipefail

exec npx tsx -e "import('rhachet-roles-bhuild').then(m => m.cli.bindBehavior())" -- "$@"
