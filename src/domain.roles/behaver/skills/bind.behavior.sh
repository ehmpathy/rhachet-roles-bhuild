#!/usr/bin/env bash
######################################################################
# .what = bind, unbind, or query branch-to-behavior binding
# .how  = thin dispatcher to TypeScript implementation
######################################################################

set -euo pipefail

exec npx tsx -e "import('rhachet-roles-bhuild').then(m => m.cli.bindBehavior())" -- "$@"
