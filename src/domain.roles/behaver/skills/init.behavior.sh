#!/usr/bin/env bash
######################################################################
# .what = initialize a .behavior directory for bhuild thoughtroute
#
# .why  = standardize the behavior-driven development thoughtroute
#         by creation of a structured directory with:
#           - wish definition
#           - vision statement
#           - blackbox criteria (user-faced behavioral requirements)
#           - blueprint criteria (implementation requirements)
#           - research prompts
#           - distillation prompts
#           - blueprint prompts
#           - roadmap prompts
#           - execution prompts
#           - feedback template
#
# usage:
#   init.behavior.sh --name <behaviorname> [--dir <directory>]
#
# guarantee:
#   - creates .behavior/ if not found
#   - creates versioned behavior directory
#   - findserts all thoughtroute files (creates if not found, skips if present)
#   - auto-binds current branch to newly created behavior
#   - idempotent: safe to rerun
#   - fail-fast on errors
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.initBehavior())" -- "$@"
