#!/usr/bin/env bash
######################################################################
# .what = review behavior for decomposition need
#
# .why  = enables detection of behaviors that have grown too large
#         for reliable execution, by measurement of context pressure
#         and domain breadth, with recommendation to decompose
#
# usage:
#   review.behavior.sh --of <behavior-name> [--dir <path>]
#
# guarantee:
#   - fail-fast if behavior not found or ambiguous
#   - fail-fast if behavior has no criteria (required for analysis)
#   - idempotent: safe to rerun
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.reviewBehavior())" -- "$@"
