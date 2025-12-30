#!/usr/bin/env bash
######################################################################
# .what = decompose a behavior into focused sub-behaviors
#
# .why  = enables large behaviors to be split into independent,
#         focused sub-behaviors that fit within context window limits
#         and respect bounded context boundaries
#
# .how  = operates in two modes:
#         --mode plan:  analyze and propose sub-behaviors
#         --mode apply: create sub-behaviors from approved plan
#
# usage:
#   decompose.behavior.sh --of <behavior-name> --mode plan [--dir <path>]
#   decompose.behavior.sh --of <behavior-name> --mode apply --plan <plan-file> [--dir <path>]
#
# examples:
#   decompose.behavior.sh --of my-large-behavior --mode plan
#   decompose.behavior.sh --of my-large-behavior --mode apply --plan .behavior/my-large-behavior/z.decomposition.plan.json
#
# guarantee:
#   - fail-fast if behavior not found or ambiguous
#   - fail-fast if behavior has no criteria
#   - fail-fast if --mode apply without --plan
#   - fail-fast if behavior already decomposed (z.decomposed.md present)
#   - idempotent: safe to rerun
######################################################################

set -euo pipefail

trap 'echo "decompose.behavior.sh failed at line $LINENO"' ERR

# ────────────────────────────────────────────────────────────────────
# script location resolution
# ────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ────────────────────────────────────────────────────────────────────
# argument parse
# ────────────────────────────────────────────────────────────────────

BEHAVIOR_NAME=""
MODE=""
PLAN_FILE=""
TARGET_DIR="$PWD"

while [[ $# -gt 0 ]]; do
  case $1 in
    --of)
      BEHAVIOR_NAME="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    --plan)
      PLAN_FILE="$2"
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
      echo "usage: decompose.behavior.sh --of <behavior-name> --mode <plan|apply> [options]"
      echo ""
      echo "modes:"
      echo "  plan   analyze behavior and propose sub-behaviors"
      echo "  apply  create sub-behaviors from approved plan"
      echo ""
      echo "options:"
      echo "  --of <name>      behavior name to decompose (required)"
      echo "  --mode <mode>    operation mode: plan or apply (required)"
      echo "  --plan <file>    plan file path (required for apply mode)"
      echo "  --dir <path>     target directory (default: current directory)"
      exit 0
      ;;
    *)
      echo "error: unknown argument '$1'"
      echo "usage: decompose.behavior.sh --of <behavior-name> --mode <plan|apply> [options]"
      exit 1
      ;;
  esac
done

# validate required arguments
if [[ -z "$BEHAVIOR_NAME" ]]; then
  echo "error: --of is required"
  exit 1
fi

if [[ -z "$MODE" ]]; then
  echo "error: --mode is required (plan or apply)"
  exit 1
fi

if [[ "$MODE" != "plan" && "$MODE" != "apply" ]]; then
  echo "error: --mode must be 'plan' or 'apply'"
  exit 1
fi

if [[ "$MODE" == "apply" && -z "$PLAN_FILE" ]]; then
  echo "error: --plan required for apply mode"
  echo "hint: produce one via --mode plan first"
  exit 1
fi

if [[ "$MODE" == "apply" && -n "$PLAN_FILE" && ! -f "$PLAN_FILE" ]]; then
  echo "error: plan file not found: $PLAN_FILE"
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
  echo "error: criteria required for decomposition"
  echo "behavior: $BEHAVIOR_DIR_REL"
  echo "hint: run behaver bind.criteria first"
  exit 1
fi

# ────────────────────────────────────────────────────────────────────
# already decomposed check
# ────────────────────────────────────────────────────────────────────

DECOMPOSED_FILE="$BEHAVIOR_DIR/z.decomposed.md"
if [[ -f "$DECOMPOSED_FILE" ]]; then
  if [[ "$MODE" == "plan" ]]; then
    echo "warn: behavior already decomposed"
    echo "behavior: $BEHAVIOR_DIR_REL"
    echo ""
    echo "peer sub-behaviors:"
    grep -E "^- " "$DECOMPOSED_FILE" 2>/dev/null | sed 's/^/  /' || echo "  (none listed)"
    echo ""
    echo "hint: remove z.decomposed.md to re-decompose"
    exit 0
  else
    echo "error: behavior already decomposed"
    echo "behavior: $BEHAVIOR_DIR_REL"
    echo "hint: remove z.decomposed.md to re-decompose"
    exit 1
  fi
fi

# ────────────────────────────────────────────────────────────────────
# mode: plan - generate decomposition plan
# ────────────────────────────────────────────────────────────────────

REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

if [[ "$MODE" == "plan" ]]; then
  echo ""
  echo "🦫 let's decompose!"
  echo ""
  echo "🍄 decompose.behavior --mode plan"
  echo "├── behavior = $BEHAVIOR_DIR_REL"
  echo "├── criteria = found"
  echo "└── status = generating plan..."
  echo ""

  # invoke imaginePlan via CLI
  PLAN_JSON=$(npx tsx "$REPO_ROOT/src/domain.operations/behavior/decompose/imaginePlan.cli.ts" \
    --behavior-path "$BEHAVIOR_DIR" \
    --behavior-name "$BEHAVIOR_NAME")

  # write plan to file
  PLAN_OUTPUT="$BEHAVIOR_DIR/z.plan.decomposition.v1.json"
  echo "$PLAN_JSON" > "$PLAN_OUTPUT"
  PLAN_OUTPUT_REL=$(realpath --relative-to="$PWD" "$PLAN_OUTPUT")

  # extract summary from plan
  BEHAVIORS_COUNT=$(echo "$PLAN_JSON" | jq '.behaviorsProposed | length')
  WINDOW_PCT=$(echo "$PLAN_JSON" | jq '.contextAnalysis.usage.window.percentage')
  RECOMMENDATION=$(echo "$PLAN_JSON" | jq -r '.contextAnalysis.recommendation')

  echo "🌲 plan generated"
  echo "├── file = $PLAN_OUTPUT_REL"
  echo "├── behaviors proposed = $BEHAVIORS_COUNT"
  echo "├── context window = ${WINDOW_PCT}%"
  echo "└── recommendation = $RECOMMENDATION"

  echo ""
  echo "🌲 proposed behaviors"
  BEHAVIOR_LINES=$(echo "$PLAN_JSON" | jq -r '.behaviorsProposed[] | "\(.name) (depends on: \(.dependsOn | if length == 0 then "none" else join(", ") end))"')
  BEHAVIOR_COUNT=$(echo "$BEHAVIOR_LINES" | wc -l)
  CURRENT=0
  echo "$BEHAVIOR_LINES" | while read -r line; do
    CURRENT=$((CURRENT + 1))
    if [[ $CURRENT -eq $BEHAVIOR_COUNT ]]; then
      echo "└── $line"
    else
      echo "├── $line"
    fi
  done

  echo ""
  echo "🌲 next step"
  echo "├── review the plan"
  echo "└── decompose.behavior --of $BEHAVIOR_NAME --mode apply --plan $PLAN_OUTPUT_REL"
  echo ""
fi

# ────────────────────────────────────────────────────────────────────
# mode: apply - create sub-behaviors from plan
# ────────────────────────────────────────────────────────────────────

if [[ "$MODE" == "apply" ]]; then
  echo ""
  echo "🦫 let's decompose!"
  echo ""
  echo "🍄 decompose.behavior --mode apply"
  echo "├── behavior = $BEHAVIOR_DIR_REL"
  echo "├── plan = $PLAN_FILE"
  echo "└── status = applying..."
  echo ""

  # invoke applyPlan via CLI
  APPLY_JSON=$(npx tsx "$REPO_ROOT/src/domain.operations/behavior/decompose/applyPlan.cli.ts" \
    --plan-path "$PLAN_FILE")

  # extract results
  BEHAVIORS_COUNT=$(echo "$APPLY_JSON" | jq '.behaviorsCreated | length')
  DECOMPOSED_MARKER=$(echo "$APPLY_JSON" | jq -r '.decomposedMarkerPath')

  echo "🌲 plan applied"
  echo "├── behaviors created = $BEHAVIORS_COUNT"
  echo "└── marker = $DECOMPOSED_MARKER"

  echo ""
  echo "🌲 created behaviors"
  CREATED_LINES=$(echo "$APPLY_JSON" | jq -r '.behaviorsCreated[]')
  CREATED_COUNT=$(echo "$CREATED_LINES" | wc -l)
  CURRENT=0
  echo "$CREATED_LINES" | while read -r behavior_path; do
    CURRENT=$((CURRENT + 1))
    if [[ $CURRENT -eq $CREATED_COUNT ]]; then
      echo "└── $(basename "$behavior_path")"
    else
      echo "├── $(basename "$behavior_path")"
    fi
  done

  echo ""
  echo "🌲 next steps"
  echo "├── define criteria for each sub-behavior"
  echo "└── execute each sub-behavior independently"
  echo ""
fi
