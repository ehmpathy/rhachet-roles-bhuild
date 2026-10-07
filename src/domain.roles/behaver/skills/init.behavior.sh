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
#   init.behavior.sh --name <behaviorname> [--dir <directory>] [--guard <light|heavy>]
#
# options:
#   --name <name>     behavior name (required)
#   --dir <directory> target directory (default: .)
#   --guard <level>   guard level: light (default) or heavy
#                     - light: fewer, focused self-reviews
#                     - heavy: more, thorough self-reviews
#   --open <editor>   open wish file in editor after init
#   --size <size>     nano | mini | medi (default) | mega | giga
#   --wish <text>     wish content, inline or @stdin
#   --help, -h        show usage and exit
#
# guarantee:
#   - creates .behavior/ if not found
#   - creates versioned behavior directory
#   - findserts all thoughtroute files (creates if not found, skips if present)
#   - auto-binds current branch to newly created behavior (behaver hooks)
#   - auto-binds route for bhrain driver (route.bind.set skill)
#   - creates guard files for vision and blueprint (require human approval)
#   - idempotent: safe to rerun
#   - fail-fast on errors
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild/cli').then(m => m.cli.initBehavior())" -- "$@"
