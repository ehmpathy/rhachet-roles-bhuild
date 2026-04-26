#!/usr/bin/env bash
######################################################################
# .what = DEPRECATED: backwards compat alias for feedback.give
#
# .why  = preserves backwards compatibility after skill rename
#         prefer: ./node_modules/.bin/rhachet run --skill feedback.give
#
# .note = this skill dispatches to feedback.give via CLI export
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.giveFeedback())" -- "$@"
