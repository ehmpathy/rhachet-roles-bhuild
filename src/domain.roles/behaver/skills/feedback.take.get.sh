#!/usr/bin/env bash
######################################################################
# .what = list all feedback for a behavior with their response status
#
# .why  = enables clones to see what feedback needs response
#         - normal mode: list all feedback with status
#         - hook.onStop mode: exit 2 if unresponded feedback exists
#
# .when = use this skill when you need to:
#         - check if there is feedback to respond to
#         - verify all feedback has been addressed before finish
#         - hook into clone lifecycle (onStop)
#
# .how  = thin dispatcher to TypeScript implementation
#
# .args:
#   --behavior <name>   (optional) behavior directory name
#                       required if branch is not bound to a behavior
#   --when hook.onStop  (optional) exit 2 if unresponded feedback exists
#   --force             (optional) override bind mismatch
#
# .examples:
#   # list all feedback with status
#   ./node_modules/.bin/rhachet run --skill feedback.take.get
#
#   # list feedback for explicit behavior
#   ./node_modules/.bin/rhachet run --skill feedback.take.get --behavior my-feature
#
#   # hook mode: exit 2 if unresponded feedback exists
#   ./node_modules/.bin/rhachet run --skill feedback.take.get --when hook.onStop
#
# .output:
#   - tree-style output with feedback status
#   - unresponded feedback listed first
#   - stale feedback (updated since response) highlighted
#   - responded feedback listed last
#
# .exit codes:
#   - 0: all feedback responded (or no feedback)
#   - 2: unresponded or stale feedback exists (only in hook.onStop mode)
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.feedbackTakeGet())" -- "$@"
