#!/usr/bin/env bash
######################################################################
# .what = catch a dream via findsert to .dream/ folder
#
# .why  = enables transient idea capture without focus loss
#         - dreams persist in .dream/ folder
#         - prior dreams are found by name (findsert pattern)
#         - optional editor auto-open via --open
#         - fuzzy match prompt for similar dreams from past week
#
# usage:
#   catch.dream.sh --name <dreamname>
#   catch.dream.sh --name <dreamname> --open codium
#
# guarantee:
#   - creates .dream/ if not found
#   - findserts dream file (creates if not found, finds if prior)
#   - normalizes name to kebab-case
#   - idempotent: safe to rerun
#   - fail-fast on errors
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.catchDream())" -- "$@"
