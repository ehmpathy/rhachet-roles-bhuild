#!/usr/bin/env bash
######################################################################
# .what = review behavior for decomposition need
#
# .why  = enables detection of behaviors that have grown too large
#         for reliable execution, by measurement of context pressure
#         and domain breadth, with recommendation to decompose
#
# .how  = 1. resolve behavior directory from --of argument
#         2. compute context analysis (token count, domain breadth)
#         3. determine if decomposition is recommended
#         4. emit structured feedback with hazards and recommendations
#
# usage:
#   review.behavior.sh --of <behavior-name> [--dir <path>]
#
# examples:
#   review.behavior.sh --of my-large-behavior
#   review.behavior.sh --of say-hello --dir /path/to/repo
#
# guarantee:
#   - fail-fast if behavior not found or ambiguous
#   - fail-fast if behavior has no criteria (required for analysis)
#   - idempotent: safe to rerun
######################################################################

set -euo pipefail

trap 'echo "review.behavior.sh failed at line $LINENO"' ERR

# ────────────────────────────────────────────────────────────────────
# script location resolution
# ────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ────────────────────────────────────────────────────────────────────
# argument parse
# ────────────────────────────────────────────────────────────────────

BEHAVIOR_NAME=""
TARGET_DIR="$PWD"

while [[ $# -gt 0 ]]; do
  case $1 in
    --of)
      BEHAVIOR_NAME="$2"
      shift 2
      ;;
    --dir)
      TARGET_DIR="$2"
      shift 2
      ;;
    --skill|--repo|--role|-s)
      # ignore rhachet passthrough args
      shift 2
      ;;
    --help|-h)
      echo "usage: review.behavior.sh --of <behavior-name> [--dir <path>]"
      echo ""
      echo "options:"
      echo "  --of <name>    behavior name to review (required)"
      echo "  --dir <path>   target directory (default: current directory)"
      exit 0
      ;;
    *)
      echo "error: unknown argument '$1'"
      echo "usage: review.behavior.sh --of <behavior-name> [--dir <path>]"
      exit 1
      ;;
  esac
done

# validate required arguments
if [[ -z "$BEHAVIOR_NAME" ]]; then
  echo "error: --of is required"
  exit 1
fi

# ────────────────────────────────────────────────────────────────────
# behavior directory resolution
# ────────────────────────────────────────────────────────────────────

BEHAVIOR_ROOT="$TARGET_DIR/.behavior"
if [[ ! -d "$BEHAVIOR_ROOT" ]]; then
  echo "error: .behavior/ directory not found in $TARGET_DIR"
  exit 1
fi

# find match behavior directories
MATCHES=()
while IFS= read -r -d '' dir; do
  MATCHES+=("$dir")
done < <(find "$BEHAVIOR_ROOT" -maxdepth 1 -type d -name "*${BEHAVIOR_NAME}*" -print0 2>/dev/null)

if [[ ${#MATCHES[@]} -eq 0 ]]; then
  echo "error: no behavior found match '$BEHAVIOR_NAME'"
  echo "available behaviors:"
  ls -1 "$BEHAVIOR_ROOT" 2>/dev/null | sed 's/^/  /'
  exit 1
fi

if [[ ${#MATCHES[@]} -gt 1 ]]; then
  echo "error: multiple behaviors match '$BEHAVIOR_NAME'"
  echo "matches:"
  printf '  %s\n' "${MATCHES[@]}"
  echo "please provide a more specific name"
  exit 1
fi

BEHAVIOR_DIR="${MATCHES[0]}"
BEHAVIOR_DIR_REL=$(realpath --relative-to="$PWD" "$BEHAVIOR_DIR")

# ────────────────────────────────────────────────────────────────────
# criteria validation
# ────────────────────────────────────────────────────────────────────

CRITERIA_FILE=$(find "$BEHAVIOR_DIR" -maxdepth 1 -name "*.criteria.md" -print -quit 2>/dev/null)
if [[ -z "$CRITERIA_FILE" || ! -f "$CRITERIA_FILE" ]]; then
  echo "error: criteria required for decomposition analysis"
  echo "behavior: $BEHAVIOR_DIR_REL"
  echo "hint: run behaver bind.criteria first"
  exit 1
fi

# ────────────────────────────────────────────────────────────────────
# compute context consumption
# ────────────────────────────────────────────────────────────────────

REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# invoke computeContextConsumption via CLI
ANALYSIS_JSON=$(npx tsx "$REPO_ROOT/src/domain.operations/behavior/decompose/computeContextConsumption.cli.ts" \
  --behavior-path "$BEHAVIOR_DIR" \
  --behavior-name "$BEHAVIOR_NAME")

# extract values from JSON
CHARS=$(echo "$ANALYSIS_JSON" | jq -r '.usage.characters.quantity')
TOKENS=$(echo "$ANALYSIS_JSON" | jq -r '.usage.tokens.estimate')
WINDOW_PCT=$(echo "$ANALYSIS_JSON" | jq -r '.usage.window.percentage')
RECOMMENDATION=$(echo "$ANALYSIS_JSON" | jq -r '.recommendation')

# ────────────────────────────────────────────────────────────────────
# emit results
# ────────────────────────────────────────────────────────────────────

echo ""
echo "🦫 let's review!"
echo ""
echo "🍄 review.behavior"
echo "├── behavior = $BEHAVIOR_DIR_REL"
echo "├── characters = $CHARS"
echo "├── tokens = $TOKENS"
echo "├── window = ${WINDOW_PCT}%"
echo "└── recommendation = $RECOMMENDATION"

# emit hazard if decomposition required
if [[ "$RECOMMENDATION" == "DECOMPOSE_REQUIRED" ]]; then
  echo ""
  echo "⛈️  HAZARD"
  echo "├── behavior artifacts consume >${WINDOW_PCT}% of context window"
  echo "└── threshold = 30%"
  echo ""
  echo "🌲 recommendation"
  echo "├── decompose this behavior into focused sub-behaviors"
  echo "└── run decompose.behavior --of $BEHAVIOR_NAME --mode plan"
fi

echo ""
