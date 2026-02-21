#!/usr/bin/env bash
######################################################################
# .what = initialize a .behavior directory for bhuild thoughtroute
#
# .why  = standardize the behavior-driven development thoughtroute
#         by creation of a structured directory with:
#           - wish definition (0.wish.md)
#           - milestone stones (.stone files for vision, criteria, research, etc)
#           - guard files (.guard for vision and blueprint checkpoints)
#           - feedback template
#
# usage:
#   init.behavior.sh --name <behaviorname> [--dir <directory>]
#
# guarantee:
#   - creates .behavior/ if not found
#   - creates versioned behavior directory
#   - findserts all thoughtroute files (creates if not found, skips if present)
#   - auto-binds current branch to newly created behavior (behaver hooks)
#   - auto-binds route for bhrain driver (route.bind skill)
#   - creates guard files for vision and blueprint (require human approval)
#   - idempotent: safe to rerun
#   - fail-fast on errors
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.initBehavior())" -- "$@"
