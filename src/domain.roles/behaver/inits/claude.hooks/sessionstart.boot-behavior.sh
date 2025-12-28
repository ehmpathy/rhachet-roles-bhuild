#!/usr/bin/env bash
######################################################################
# .what = inject bound behavior context on session start
#
# .why  = agent starts with full awareness of current behavior
#
# .note = SessionStart hooks run on both session start AND compaction
#         this means behavior context is re-injected after context
#         is summarized, keeping the agent aligned.
#
# guarantee:
#   ✔ exits 0 silently if branch not bound (unbound = normal work)
#   ✔ exits 0 with warning if multiple bindings (don't block session)
#   ✔ never blocks session start (exit 0 always)
######################################################################

# note: no set -e because we must exit 0 always
set -uo pipefail

# resolve script location and repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"

# ────────────────────────────────────────────────────────────────────
# helpers
# ────────────────────────────────────────────────────────────────────

get_bound_behavior() {
  npx tsx "$REPO_ROOT/src/domain.operations/behavior/bind/getBoundBehaviorByBranch.cli.ts" "$1" 2>/dev/null || echo '{"behaviorDir":null,"bindings":[]}'
}

get_latest_blueprint() {
  npx tsx "$REPO_ROOT/src/domain.operations/behavior/bind/getLatestBlueprintByBehavior.cli.ts" "$1" 2>/dev/null || echo ""
}

# ────────────────────────────────────────────────────────────────────
# main
# ────────────────────────────────────────────────────────────────────

# get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [[ -z "$CURRENT_BRANCH" ]]; then
  exit 0  # not in a git repo, silently exit
fi

# check if bound
BINDING_RESULT=$(get_bound_behavior "$CURRENT_BRANCH")
BEHAVIOR_DIR=$(echo "$BINDING_RESULT" | jq -r '.behaviorDir // empty')
BINDINGS_COUNT=$(echo "$BINDING_RESULT" | jq -r '.bindings | length')

# if not bound, exit silently
if [[ -z "$BEHAVIOR_DIR" || "$BEHAVIOR_DIR" == "null" ]]; then
  # check for multiple bindings (conflict)
  if [[ "$BINDINGS_COUNT" -gt 1 ]]; then
    echo "⚠️  warning: branch '$CURRENT_BRANCH' has conflicting bindings:" >&2
    echo "$BINDING_RESULT" | jq -r '.bindings[]' | while read -r binding; do
      echo "  - $(basename "$binding")" >&2
    done
    echo "use 'bind.behavior.sh --del' to unbind and 'bind.behavior.sh --set' to rebind" >&2
  fi
  exit 0
fi

# extract behavior name from path
BEHAVIOR_NAME=$(basename "$BEHAVIOR_DIR")

# ────────────────────────────────────────────────────────────────────
# output behavior context
# ────────────────────────────────────────────────────────────────────

echo "=================================================="
echo "BOUND BEHAVIOR: $BEHAVIOR_NAME"
echo "=================================================="
echo ""

# helper to output a behavior file
output_behavior_file() {
  local tag="$1"
  local filepath="$2"
  local is_required="$3"

  if [[ -f "$filepath" ]]; then
    local relpath
    relpath=$(realpath --relative-to="$PWD" "$filepath" 2>/dev/null || echo "$filepath")
    echo "<behavior-$tag path=\"$relpath\">"
    cat "$filepath"
    echo "</behavior-$tag>"
    echo ""
  elif [[ "$is_required" == "true" ]]; then
    echo "⚠️  missing required file: $filepath" >&2
  fi
}

# output wish (required)
output_behavior_file "wish" "$BEHAVIOR_DIR/0.wish.md" "true"

# output vision (optional)
output_behavior_file "vision" "$BEHAVIOR_DIR/1.vision.md" "false"

# output criteria (optional - check for both new and legacy formats)
if [[ -f "$BEHAVIOR_DIR/2.criteria.blackbox.md" ]]; then
  output_behavior_file "criteria-blackbox" "$BEHAVIOR_DIR/2.criteria.blackbox.md" "false"
  output_behavior_file "criteria-blueprint" "$BEHAVIOR_DIR/2.criteria.blueprint.md" "false"
else
  # fallback to legacy single criteria file
  output_behavior_file "criteria" "$BEHAVIOR_DIR/2.criteria.md" "false"
fi

# output latest blueprint (optional)
LATEST_BLUEPRINT=$(get_latest_blueprint "$BEHAVIOR_DIR")
if [[ -n "$LATEST_BLUEPRINT" && -f "$LATEST_BLUEPRINT" ]]; then
  output_behavior_file "blueprint" "$LATEST_BLUEPRINT" "false"
fi

echo "=================================================="
