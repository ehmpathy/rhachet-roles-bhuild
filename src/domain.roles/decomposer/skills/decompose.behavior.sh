#!/usr/bin/env bash
######################################################################
# .what = decompose a behavior into focused sub-behaviors
# .how  = thin dispatcher to TypeScript implementation
######################################################################

set -euo pipefail

exec npx tsx -e "import('rhachet-roles-bhuild').then(m => m.cli.decomposeBehavior())" -- "$@"
