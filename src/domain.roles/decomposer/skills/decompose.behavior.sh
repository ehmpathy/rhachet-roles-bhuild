#!/usr/bin/env bash
######################################################################
# .what = decompose a behavior into focused sub-behaviors
#
# .why  = enables large behaviors to be split into independent,
#         focused sub-behaviors that fit within context window limits
#         and respect bounded context boundaries
#
# usage:
#   decompose.behavior.sh --of <behavior-name> --mode plan [--dir <path>]
#   decompose.behavior.sh --of <behavior-name> --mode apply --plan <plan-file> [--dir <path>]
#
# guarantee:
#   - fail-fast if behavior not found or ambiguous
#   - fail-fast if behavior has no criteria
#   - fail-fast if --mode apply without --plan
#   - fail-fast if behavior already decomposed (z.decomposed.md present)
#   - idempotent: safe to rerun
######################################################################

set -euo pipefail

exec npx tsx -e "import('rhachet-roles-bhuild').then(m => m.cli.decomposeBehavior())" -- "$@"
