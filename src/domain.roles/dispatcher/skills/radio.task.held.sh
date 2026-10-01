#!/usr/bin/env bash
######################################################################
# .what = show the tasks held for the radio in this worktree
#
# .why  = a blocked radio.task.push is held, not lost; this skill shows
#         what waits and who can lift the gate
#         - at stop, the clone reminds the human in one line
#         - the next push that gets through delivers the backlog
#
# usage:
#   radio.task.held.sh                       # list held tasks
#   radio.task.held.sh --when hook.onStop    # one-line stop reminder
#
# guarantee:
#   - reads local records + radio.uses only; no network, no send
#   - hook.onStop: naught when none held; never exits 2, so never blocks the stop
#     (an unreadable record fails loud: exit 1, cause on stderr)
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.radioTaskHeld())" -- "$@"
