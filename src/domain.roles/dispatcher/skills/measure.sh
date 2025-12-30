#!/usr/bin/env bash
######################################################################
# .what = measure behaviors with gain/cost metrics
# .why  = enables quantifying behavior value for prioritization
#
# usage:
#   measure.sh                          # use ./rhachet.dispatch.yml
#   measure.sh --config path/to/config  # use custom config
#   npx rhachet run --repo bhuild --skill measure  # via rhachet runner
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

npx tsx "$REPO_ROOT/src/contract/cli/getAllBehaviorMeasured.ts" "${ARGS[@]+"${ARGS[@]}"}"
