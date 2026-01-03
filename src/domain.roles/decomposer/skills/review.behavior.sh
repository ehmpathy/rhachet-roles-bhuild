#!/usr/bin/env bash
######################################################################
# .what = review behavior for decomposition need
# .how  = thin dispatcher to TypeScript implementation
######################################################################

set -euo pipefail

exec npx tsx -e "import('rhachet-roles-bhuild').then(m => m.cli.reviewBehavior())" -- "$@"
