#!/usr/bin/env bash
######################################################################
# .what = manage radio usage permissions for dispatcher
#
# .why  = humans control whether radio can push tasks to repos
#         across three levels: global > org > local
#
# usage:
#   radio.uses allow                         # allow in this repo (local)
#   radio.uses block                         # block in this repo (local)
#   radio.uses get                           # check all states
#   radio.uses --global block                # block radio globally
#   radio.uses --global allow                # lift global blocker
#   radio.uses --org ehmpathy allow          # allow radio for ehmpathy org
#   radio.uses --org @all block              # block radio for all orgs by default
#
# precedence (highest to lowest):
#   1. global blocked = always blocked
#   2. local set = local wins
#   3. org specific = wins over @all
#   4. @all = default for all orgs
#   5. unset = blocked (safe default)
#
# guarantee:
#   - local state stored in .meter/radio.uses.jsonc
#   - global state stored at ~/.rhachet/storage/repo=bhuild/role=dispatcher/.meter/
#   - org state stored at ~/.rhachet/storage/repo=bhuild/role=dispatcher/.meter/
######################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# check for --global flag
GLOBAL_MODE=false
ORG_MODE=false
ORG_VALUE=""
ARGS=()

for arg in "$@"; do
  if [[ "$arg" == "--global" ]]; then
    GLOBAL_MODE=true
  elif [[ "$arg" == "--org" ]]; then
    ORG_MODE=true
  elif [[ "$ORG_MODE" == "true" && -z "$ORG_VALUE" && "$arg" != --* ]]; then
    ORG_VALUE="$arg"
    ARGS+=("--org" "$arg")
  else
    ARGS+=("$arg")
  fi
done

# dispatch to appropriate handler
if [[ "$GLOBAL_MODE" == "true" ]]; then
  exec "$SCRIPT_DIR/radio.uses.global.sh" "${ARGS[@]}"
elif [[ "$ORG_MODE" == "true" ]]; then
  exec "$SCRIPT_DIR/radio.uses.org.sh" "${ARGS[@]}"
else
  exec "$SCRIPT_DIR/radio.uses.local.sh" "${ARGS[@]}"
fi
