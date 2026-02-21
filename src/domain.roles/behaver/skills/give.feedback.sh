#!/usr/bin/env bash
######################################################################
# .what = create or open a feedback file for a behavior artifact
#
# .why  = enables structured feedback on any behavior artifact
#         - creates feedback files linked to target artifacts
#         - supports versioned feedback (v1, v2, etc.)
#         - replaces template placeholders with artifact references
#         - opens files directly in your editor
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
#   --version <N|++>    (optional) feedback version number
#                       default: latest (or 1 if none)
#                       use ++ to create the next version
#   --open <editor>     (optional) open feedback file in editor
#                       e.g., codium, vim, nvim, zed, code
#   --template <path>   (optional) custom template file path
#   --force             (optional) override bind mismatch
#
# .examples:
#   # open latest feedback (or create v1) for execution artifact
#   npx rhachet run --skill give.feedback --against execution
#
#   # open latest and also open in editor
#   npx rhachet run --skill give.feedback --against execution --open codium
#
#   # create next version (v2 if v1 exists, etc.)
#   npx rhachet run --skill give.feedback --against execution --version ++
#
#   # create next version and open in vim
#   npx rhachet run --skill give.feedback --against execution --version ++ --open vim
#
#   # generate feedback for criteria.blackbox with explicit behavior
#   npx rhachet run --skill give.feedback --against criteria.blackbox --behavior give-feedback
#
#   # use custom template
#   npx rhachet run --skill give.feedback --against wish --template ./my-template.md
#
#   # override bind mismatch with --force
#   npx rhachet run --skill give.feedback --against blueprint --behavior other-feature --force
#
# .output:
#   - creates or finds: ${behaviorDir}/${artifactFileName}.[feedback].v${version}.[given].by_human.md
#   - shows: tree-style output with filename and tips
#
# .errors:
#   - no artifact found: shows glob pattern used
#   - template not found: indicates template path needed
#   - bind mismatch: suggests --force to override
#   - empty --open: requires editor name
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.giveFeedback())" -- "$@"
