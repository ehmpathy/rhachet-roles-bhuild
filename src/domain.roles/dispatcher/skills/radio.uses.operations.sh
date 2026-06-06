#!/usr/bin/env bash
######################################################################
# .what = shared operations for radio.uses skills
#
# .why  = DRY the common logic for path resolution, state reads, TTY
#         guards across local, global, and org handlers
#
# usage:
#   source "$SCRIPT_DIR/radio.uses.operations.sh"
######################################################################

# global storage paths
ROLE_REPO="bhuild"
ROLE_SLUG="dispatcher"
GLOBAL_METER_DIR="$HOME/.rhachet/storage/repo=$ROLE_REPO/role=$ROLE_SLUG/.meter"
GLOBAL_STATE_FILE="$GLOBAL_METER_DIR/radio.uses.global.jsonc"
ORG_STATE_FILE="$GLOBAL_METER_DIR/radio.uses.org.jsonc"

# local storage paths (set after git root is resolved)
get_local_paths() {
  REPO_ROOT=$(git rev-parse --show-toplevel)
  LOCAL_METER_DIR="$REPO_ROOT/.meter"
  LOCAL_STATE_FILE="$LOCAL_METER_DIR/radio.uses.jsonc"
}

# ensure we're in a git repo
require_git_repo() {
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "error: not in a git repository"
    exit 2
  fi
}

# guard: mutation commands require TTY (human only)
# note: __I_AM_HUMAN=true allows integration tests to run mutations
require_human() {
  local command="$1"
  if [[ ! -t 0 && "${__I_AM_HUMAN:-}" != "true" ]]; then
    print_turtle_header "bummer dude..."
    print_tree_start "radio.uses $command"
    print_tree_error "only humans can run this command"
    exit 2
  fi
}

# read global state (returns "true" or "false" for blocked)
read_global_blocked() {
  if [[ -f "$GLOBAL_STATE_FILE" ]]; then
    if BLOCKED_VAL=$(jq -r '.blocked // false' "$GLOBAL_STATE_FILE" 2>/dev/null); then
      echo "$BLOCKED_VAL"
    else
      echo "false"
    fi
  else
    echo "false"
  fi
}

# read org state for a specific org (returns "allowed", "blocked", or "unset")
read_org_state() {
  local org="$1"
  if [[ -f "$ORG_STATE_FILE" ]]; then
    # first check specific org
    if ORG_VAL=$(jq -r ".orgs[\"$org\"] // \"unset\"" "$ORG_STATE_FILE" 2>/dev/null); then
      if [[ "$ORG_VAL" != "unset" && "$ORG_VAL" != "null" ]]; then
        echo "$ORG_VAL"
        return
      fi
    fi
    # fall back to @all
    if ALL_VAL=$(jq -r '.orgs["@all"] // "unset"' "$ORG_STATE_FILE" 2>/dev/null); then
      if [[ "$ALL_VAL" != "unset" && "$ALL_VAL" != "null" ]]; then
        echo "$ALL_VAL"
        return
      fi
    fi
  fi
  echo "unset"
}

# read local state (returns "allowed", "blocked", or "unset")
read_local_state() {
  get_local_paths
  if [[ -f "$LOCAL_STATE_FILE" ]]; then
    if STATE_VAL=$(jq -r '.state // "unset"' "$LOCAL_STATE_FILE" 2>/dev/null); then
      if [[ "$STATE_VAL" != "unset" && "$STATE_VAL" != "null" ]]; then
        echo "$STATE_VAL"
        return
      fi
    fi
  fi
  echo "unset"
}

# read all org states (returns "unset" or formatted org list)
read_all_org_states() {
  if [[ -f "$ORG_STATE_FILE" ]]; then
    local orgs
    orgs=$(jq -r '.orgs // {} | to_entries | map("\(.key)=\(.value)") | .[]' "$ORG_STATE_FILE" 2>/dev/null)
    if [[ -n "$orgs" ]]; then
      echo "$orgs"
      return
    fi
  fi
  echo "unset"
}

# findsert .meter directory with .gitignore
findsert_meter_dir() {
  local dir="$1"
  mkdir -p "$dir"
  if [[ ! -f "$dir/.gitignore" ]]; then
    echo "*" > "$dir/.gitignore"
  fi
}

# strip rhachet passthrough args and collect rest
strip_rhachet_args() {
  local -n _args_out="$1"
  shift
  _args_out=()
  while [[ $# -gt 0 ]]; do
    case $1 in
      --repo|--role|--skill)
        shift
        if [[ $# -gt 0 && "$1" != --* && "$1" != -* ]]; then
          shift
        fi
        ;;
      --)
        shift
        ;;
      *)
        _args_out+=("$1")
        shift
        ;;
    esac
  done
}
