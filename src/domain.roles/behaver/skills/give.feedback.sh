#!/usr/bin/env bash
######################################################################
# .what = generate a feedback file for a behavior artifact
#
# .why  = enables structured feedback on any behavior artifact
#         - creates feedback files linked to target artifacts
#         - supports versioned feedback (v1, v2, etc.)
#         - replaces template placeholders with artifact references
#
# .when = use this skill when you need to:
#         - provide feedback on an execution artifact
#         - review criteria, blueprint, or research artifacts
#         - create structured response templates for human review
#
# .how  = thin dispatcher to TypeScript implementation
#
# .args:
#   --against <name>    (required) artifact name to target
#                       e.g., execution, criteria.blackbox, wish, blueprint
#   --behavior <name>   (optional) behavior directory name
#                       required if branch is not bound to a behavior
#   --version <N>       (optional) feedback version number (default: 1)
#   --template <path>   (optional) custom template file path
#   --force             (optional) override bind mismatch
#
# .examples:
#   # generate feedback for latest execution artifact (branch must be bound)
#   npx rhachet run --skill give.feedback --against execution
#
#   # generate feedback for criteria.blackbox with explicit behavior
#   npx rhachet run --skill give.feedback --against criteria.blackbox --behavior give-feedback
#
#   # generate v2 feedback on same artifact
#   npx rhachet run --skill give.feedback --against execution --version 2
#
#   # use custom template
#   npx rhachet run --skill give.feedback --against wish --template ./my-template.md
#
#   # override bind mismatch with --force
#   npx rhachet run --skill give.feedback --against blueprint --behavior other-feature --force
#
# .output:
#   - creates: ${behaviorDir}/${artifactFileName}.[feedback].v${version}.[given].by_human.md
#   - logs: feedback file path and target artifact to stdout
#
# .errors:
#   - no artifact found: shows glob pattern used
#   - feedback exists: prevents overwrite, suggests --version
#   - template not found: indicates template path needed
#   - bind mismatch: suggests --force to override
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.giveFeedback())" -- "$@"
