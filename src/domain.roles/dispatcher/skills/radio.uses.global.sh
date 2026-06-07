#!/usr/bin/env bash
######################################################################
# .what = manage global radio usage blocker
#
# .why  = humans can pause all radio usage across all repos
#         with a single global circuit breaker
#
# usage:
#   radio.uses.global block    # block radio globally
#   radio.uses.global allow    # lift global blocker
#   radio.uses.global get      # check global blocker state
#
# guarantee:
#   - global blocker stored at ~/.rhachet/storage/repo=bhuild/role=dispatcher/.meter/
#   - global blocker overrides org and local settings
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/radio.uses.output.sh"
source "$SCRIPT_DIR/radio.uses.operations.sh"

require_git_repo

# parse command
COMMAND=""

# first positional arg is command
if [[ $# -ge 1 && "$1" != --* ]]; then
  COMMAND="$1"
  shift
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    block|allow|get)
      COMMAND="$1"
      shift
      ;;
    --help|-h)
      echo "usage: radio.uses --global block"
      echo "       radio.uses --global allow"
      echo "       radio.uses --global get"
      echo ""
      echo "commands:"
      echo "  block  pause all radio usage globally"
      echo "  allow  lift global blocker, resume org/local behavior"
      echo "  get    check global blocker state"
      echo ""
      echo "options:"
      echo "  --help, -h            show this help"
      exit 0
      ;;
    --repo|--role|--skill|--local|--global|--org)
      # rhachet passthrough args - ignore
      shift
      if [[ $# -gt 0 && "$1" != --* && "$1" != -* ]]; then
        shift
      fi
      ;;
    --)
      shift
      ;;
    --*)
      echo "error: unknown option: $1"
      echo "usage: radio.uses --global block|allow|get"
      exit 2
      ;;
    *)
      shift
      ;;
  esac
done

# validate command
if [[ -z "$COMMAND" ]]; then
  echo "error: command required (block, allow, or get)"
  echo "usage: radio.uses --global block|allow|get"
  exit 2
fi

######################################################################
# guard: mutation commands require TTY (human only)
######################################################################
case "$COMMAND" in
  block|allow)
    require_human "$COMMAND --global"
    ;;
esac

case "$COMMAND" in
  block)
    mkdir -p "$GLOBAL_METER_DIR"
    cat > "$GLOBAL_STATE_FILE" << EOF
{
  "blocked": true
}
EOF

    print_turtle_header "groovy, bond fire time"
    print_tree_start "radio.uses block --global"
    echo "   └─ radio blocked globally"
    ;;

  allow)
    if [[ -f "$GLOBAL_STATE_FILE" ]]; then
      rm -f "$GLOBAL_STATE_FILE"
    fi

    print_turtle_header "shell yeah, back in the water!"
    print_tree_start "radio.uses allow --global"
    echo "   └─ radio resumed globally"
    ;;

  get)
    print_turtle_header "lets check the global meter..."
    print_tree_start "radio.uses get --global"

    GLOBAL_BLOCKED=$(read_global_blocked)

    if [[ "$GLOBAL_BLOCKED" == "true" ]]; then
      echo "   └─ global: blocked"
    else
      echo "   └─ global: not blocked"
    fi
    ;;

  *)
    echo "error: unknown command: $COMMAND"
    echo "usage: radio.uses --global block|allow|get"
    exit 2
    ;;
esac
