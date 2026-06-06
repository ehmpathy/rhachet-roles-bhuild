#!/usr/bin/env bash
######################################################################
# .what = manage local radio usage permission for this repo
#
# .why  = humans control whether radio is allowed in this specific
#         repository, with local config overrides global and org
#
# usage:
#   radio.uses.local allow     # allow radio in this repo
#   radio.uses.local block     # block radio in this repo
#   radio.uses.local del       # remove local config, defer to org/global
#   radio.uses.local get       # check local state
#
# guarantee:
#   - state stored in .meter/radio.uses.jsonc
#   - local state overrides org and global settings
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/radio.uses.output.sh"
source "$SCRIPT_DIR/radio.uses.operations.sh"

require_git_repo
get_local_paths

# parse command
COMMAND=""

# first positional arg is command
if [[ $# -ge 1 && "$1" != --* ]]; then
  COMMAND="$1"
  shift
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    allow|block|del|get)
      COMMAND="$1"
      shift
      ;;
    --help|-h)
      echo "usage: radio.uses allow"
      echo "       radio.uses block"
      echo "       radio.uses del"
      echo "       radio.uses get"
      echo ""
      echo "commands:"
      echo "  allow  allow radio in this repo"
      echo "  block  block radio in this repo"
      echo "  del    remove local config, defer to org/global"
      echo "  get    check local state"
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
      echo "usage: radio.uses allow|block|del|get"
      exit 2
      ;;
    *)
      shift
      ;;
  esac
done

# validate command
if [[ -z "$COMMAND" ]]; then
  echo "error: command required (allow, block, del, or get)"
  echo "usage: radio.uses allow|block|del|get"
  exit 2
fi

######################################################################
# guard: mutation commands require TTY (human only)
######################################################################
case "$COMMAND" in
  allow|block|del)
    require_human "$COMMAND"
    ;;
esac

case "$COMMAND" in
  allow)
    findsert_meter_dir "$LOCAL_METER_DIR"
    cat > "$LOCAL_STATE_FILE" << EOF
{
  "state": "allowed"
}
EOF

    print_turtle_header "shell yeah! radio allowed"
    print_tree_start "radio.uses allow"
    echo "   └─ local: allowed"
    ;;

  block)
    findsert_meter_dir "$LOCAL_METER_DIR"
    cat > "$LOCAL_STATE_FILE" << EOF
{
  "state": "blocked"
}
EOF

    print_turtle_header "groovy, radio blocked"
    print_tree_start "radio.uses block"
    echo "   └─ local: blocked"
    ;;

  del)
    if [[ -f "$LOCAL_STATE_FILE" ]]; then
      rm -f "$LOCAL_STATE_FILE"
    fi

    print_turtle_header "righteous, local config cleared"
    print_tree_start "radio.uses del"
    echo "   └─ local config removed, defers to org/global"
    ;;

  get)
    print_turtle_header "lets check the meter..."
    print_tree_start "radio.uses get"

    LOCAL_STATE=$(read_local_state)
    ORG_STATES=$(read_all_org_states)
    GLOBAL_BLOCKED=$(read_global_blocked)

    # local state
    if [[ "$LOCAL_STATE" == "unset" ]]; then
      echo "   ├─ local: unset"
    else
      echo "   ├─ local: $LOCAL_STATE"
    fi

    # org state (show each configured org)
    if [[ "$ORG_STATES" == "unset" ]]; then
      echo "   ├─ org: unset"
    else
      echo "   ├─ org:"
      while IFS= read -r org_entry; do
        org_name="${org_entry%%=*}"
        org_state="${org_entry#*=}"
        echo "   │  └─ $org_name: $org_state"
      done <<< "$ORG_STATES"
    fi

    # global state
    if [[ "$GLOBAL_BLOCKED" == "true" ]]; then
      echo "   └─ global: blocked"
    else
      echo "   └─ global: not blocked"
    fi
    ;;

  *)
    echo "error: unknown command: $COMMAND"
    echo "usage: radio.uses allow|block|del|get"
    exit 2
    ;;
esac
