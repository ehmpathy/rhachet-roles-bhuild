#!/usr/bin/env bash
######################################################################
# .what = initialize a .behavior directory for bhuild thoughtroute
# .how  = thin dispatcher to TypeScript implementation
######################################################################

set -euo pipefail

exec npx tsx -e "import('rhachet-roles-bhuild').then(m => m.cli.initBehavior())" -- "$@"
