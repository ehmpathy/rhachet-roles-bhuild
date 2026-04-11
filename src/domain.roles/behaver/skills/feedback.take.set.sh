#!/usr/bin/env bash
######################################################################
# .what = record a feedback response with hash verification
#
# .why  = enables clones to mark feedback as responded
#         - validates path consistency
#         - stores hash for stale detection
#
# .when = use this skill when you need to:
#         - respond to feedback from a human
#         - record that feedback has been addressed
#
# .how  = thin dispatcher to TypeScript implementation
#
# .args:
#   --from <path>       (required) path to [given] feedback file
#   --into <path>       (required) path to [taken] response file
#   --response <text>   (required) response content (or @stdin)
#
# .examples:
#   # respond to feedback inline
#   npx rhachet run --skill feedback.take.set \
#     --from ".behavior/v2026_04_09.my-feature/feedback/0.wish.md.[feedback].v1.[given].by_human.md" \
#     --into ".behavior/v2026_04_09.my-feature/feedback/0.wish.md.[feedback].v1.[taken].by_robot.md" \
#     --response "acknowledged. will address the feedback."
#
#   # respond via stdin (for multiline responses)
#   echo "my response" | npx rhachet run --skill feedback.take.set \
#     --from "..." --into "..." --response @stdin
#
# .output:
#   - creates: [taken] file with givenHash in frontmatter
#   - shows: tree-style output with filename and hash preview
#
# .errors:
#   - [given] file not found
#   - --from path must be a [given] file
#   - --into path must be a [taken] file
#   - --into path does not match --from derivation
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.feedbackTakeSet())" -- "$@"
