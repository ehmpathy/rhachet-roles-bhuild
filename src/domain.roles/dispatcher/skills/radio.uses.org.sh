#!/usr/bin/env bash
######################################################################
# .what = manage radio usage permission per organization
#
# .why  = humans can allow/block radio for specific orgs (e.g., ehmpathy)
#         or set @all as default for all orgs
#
# usage:
#   radio.uses.org allow --org ehmpathy   # allow radio for ehmpathy
#   radio.uses.org block --org ahbode     # block radio for ahbode
#   radio.uses.org allow --org @all       # allow radio for all orgs by default
#   radio.uses.org block --org @all       # block radio for all orgs by default
#   radio.uses.org del --org ehmpathy    # remove org config, defer to @all
#   radio.uses.org get                    # show all org configs
#   radio.uses.org get --org ehmpathy    # check config for specific org
#
# guarantee:
#   - state stored at ~/.rhachet/storage/repo=bhuild/role=dispatcher/.meter/radio.uses.org.jsonc
#   - specific org config overrides @all
#   - org config is overridden by local repo config
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/radio.uses.output.sh"
source "$SCRIPT_DIR/radio.uses.operations.sh"

require_git_repo

# parse command and options
COMMAND=""
ORG=""

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
    --org)
      ORG="$2"
      shift 2
      ;;
    --help|-h)
      echo "usage: radio.uses --org <org> allow"
      echo "       radio.uses --org <org> block"
      echo "       radio.uses --org <org> del"
      echo "       radio.uses --org <org> get"
      echo "       radio.uses --org get                  # show all"
      echo ""
      echo "commands:"
      echo "  allow  allow radio for specified org"
      echo "  block  block radio for specified org"
      echo "  del    remove org config, defer to @all"
      echo "  get    check org config(s)"
      echo ""
      echo "options:"
      echo "  --org <name>          org name (e.g., ehmpathy, ahbode, @all)"
      echo "  --help, -h            show this help"
      echo ""
      echo "examples:"
      echo "  radio.uses --org @all block                # block all by default"
      echo "  radio.uses --org ehmpathy allow            # allow ehmpathy"
      exit 0
      ;;
    --repo|--role|--skill|--local|--global)
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
      echo "usage: radio.uses --org <org> allow|block|del|get"
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
  echo "usage: radio.uses --org <org> allow|block|del|get"
  exit 2
fi

######################################################################
# guard: mutation commands require TTY (human only)
######################################################################
case "$COMMAND" in
  allow|block|del)
    require_human "--org $ORG $COMMAND"
    ;;
esac

# read current org state file
read_org_file() {
  if [[ -f "$ORG_STATE_FILE" ]]; then
    cat "$ORG_STATE_FILE"
  else
    echo '{ "orgs": {} }'
  fi
}

# write org state file
write_org_file() {
  local content="$1"
  mkdir -p "$GLOBAL_METER_DIR"
  echo "$content" > "$ORG_STATE_FILE"
}

case "$COMMAND" in
  allow)
    if [[ -z "$ORG" ]]; then
      echo "error: --org is required for allow"
      echo "usage: radio.uses --org <org> allow"
      exit 2
    fi

    # upsert org state
    CURRENT=$(read_org_file)
    UPDATED=$(echo "$CURRENT" | jq ".orgs[\"$ORG\"] = \"allowed\"")
    write_org_file "$UPDATED"

    print_turtle_header "shell yeah! org allowed"
    print_tree_start "radio.uses allow --org $ORG"
    echo "   └─ $ORG: allowed"
    ;;

  block)
    if [[ -z "$ORG" ]]; then
      echo "error: --org is required for block"
      echo "usage: radio.uses --org <org> block"
      exit 2
    fi

    # upsert org state
    CURRENT=$(read_org_file)
    UPDATED=$(echo "$CURRENT" | jq ".orgs[\"$ORG\"] = \"blocked\"")
    write_org_file "$UPDATED"

    print_turtle_header "groovy, org blocked"
    print_tree_start "radio.uses block --org $ORG"
    echo "   └─ $ORG: blocked"
    ;;

  del)
    if [[ -z "$ORG" ]]; then
      echo "error: --org is required for del"
      echo "usage: radio.uses --org <org> del"
      exit 2
    fi

    if [[ -f "$ORG_STATE_FILE" ]]; then
      CURRENT=$(read_org_file)
      UPDATED=$(echo "$CURRENT" | jq "del(.orgs[\"$ORG\"])")
      write_org_file "$UPDATED"
    fi

    print_turtle_header "righteous, org config cleared"
    print_tree_start "radio.uses del --org $ORG"
    echo "   └─ $ORG config removed, defers to @all"
    ;;

  get)
    print_turtle_header "lets check the org meter..."

    if [[ -n "$ORG" ]]; then
      # show specific org
      print_tree_start "radio.uses get --org $ORG"
      ORG_VAL=$(read_org_state "$ORG")
      echo "   └─ $ORG: $ORG_VAL"
    else
      # show all orgs
      print_tree_start "radio.uses get --org"
      if [[ -f "$ORG_STATE_FILE" ]]; then
        ORGS=$(jq -r '.orgs | to_entries | .[] | "\(.key): \(.value)"' "$ORG_STATE_FILE" 2>/dev/null || echo "")
        if [[ -n "$ORGS" ]]; then
          # print all but last with ├─, last with └─
          LINES=()
          while IFS= read -r line; do
            LINES+=("$line")
          done <<< "$ORGS"

          for i in "${!LINES[@]}"; do
            if [[ $i -eq $((${#LINES[@]} - 1)) ]]; then
              echo "   └─ ${LINES[$i]}"
            else
              echo "   ├─ ${LINES[$i]}"
            fi
          done
        else
          echo "   └─ no orgs configured"
        fi
      else
        echo "   └─ no orgs configured"
      fi
    fi
    ;;

  *)
    echo "error: unknown command: $COMMAND"
    echo "usage: radio.uses --org <org> allow|block|del|get"
    exit 2
    ;;
esac
