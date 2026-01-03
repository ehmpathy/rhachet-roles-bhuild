#!/usr/bin/env bash
######################################################################
# .what = trace dependencies between gathered behaviors
# .why  = enables understanding behavior relationships and blockers
#
# usage:
#   deptrace.sh                          # use ./rhachet.dispatch.yml
#   deptrace.sh --config path/to/config  # use custom config
#   npx rhachet run --repo bhuild --skill deptrace  # via rhachet runner
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

npx tsx "$REPO_ROOT/src/contract/cli/getAllBehaviorDeptraced.ts" "${ARGS[@]+"${ARGS[@]}"}"
