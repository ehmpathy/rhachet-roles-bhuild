#!/usr/bin/env bash
######################################################################
# .what = triage behaviors by readiness and priority band
# .why  = enables sorting behaviors for optimal execution order
#
# usage:
#   triage.sh                          # use ./rhachet.dispatch.yml
#   triage.sh --config path/to/config  # use custom config
#   npx rhachet run --repo bhuild --skill triage  # via rhachet runner
######################################################################
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

# filter out rhachet passthrough args
ARGS=()
while [[ $# -gt 0 ]]; do
  case $1 in
    --skill|--repo|--role|-s)
      # ignore rhachet passthrough args
      shift 2
      ;;
    *)
      ARGS+=("$1")
      shift
      ;;
  esac
done

npx tsx "$REPO_ROOT/src/contract/cli/getAllBehaviorTriaged.ts" "${ARGS[@]+"${ARGS[@]}"}"
