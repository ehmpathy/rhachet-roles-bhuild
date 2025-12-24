#!/usr/bin/env bash
######################################################################
# .what = bind, unbind, or query branch-to-behavior binding
#
# .why  = explicit user control over which behavior applies to current branch
#
# usage:
#   bind.behavior.sh --set --behavior <name>   # bind current branch
#   bind.behavior.sh --del                      # unbind current branch
#   bind.behavior.sh --get                      # query current binding
#
# guarantee:
#   - fail-fast if behavior not found or ambiguous
#   - fail-fast if --set to different behavior (suggest --del or worktree)
#   - idempotent: --set to same behavior succeeds, --del when unbound succeeds
######################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# ────────────────────────────────────────────────────────────────────
# argument parsing
# ────────────────────────────────────────────────────────────────────

ACTION=""
BEHAVIOR_NAME=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --set)
      ACTION="set"
      shift
      ;;
    --del)
      ACTION="del"
      shift
      ;;
    --get)
      ACTION="get"
      shift
      ;;
    --behavior)
      BEHAVIOR_NAME="$2"
      shift 2
      ;;
    --skill|--repo|--role|-s)
      # ignore rhachet passthrough args
      shift 2
      ;;
    *)
      echo "error: unknown argument '$1'"
      echo "usage: bind.behavior.sh --set --behavior <name> | --del | --get"
      exit 1
      ;;
  esac
done

# validate action
if [[ -z "$ACTION" ]]; then
  echo "error: no action specified"
  echo "usage: bind.behavior.sh --set --behavior <name> | --del | --get"
  exit 1
fi

# ────────────────────────────────────────────────────────────────────
# helpers
# ────────────────────────────────────────────────────────────────────

get_current_branch() {
  git rev-parse --abbrev-ref HEAD
}

flatten_branch_name() {
  local branch="$1"
  npx tsx "$REPO_ROOT/src/domain.operations/behavior/bind/flattenBranchName.cli.ts" "$branch"
}

get_bound_behavior() {
  npx tsx "$REPO_ROOT/src/domain.operations/behavior/bind/getBoundBehaviorByBranch.cli.ts" "$1"
}

resolve_behavior_dir() {
  local name="$1"
  local behavior_root="$PWD/.behavior"

  if [[ ! -d "$behavior_root" ]]; then
    echo ""
    return
  fi

  # find matching behavior directories
  local matches=()
  while IFS= read -r -d '' dir; do
    matches+=("$dir")
  done < <(find "$behavior_root" -maxdepth 1 -type d -name "*${name}*" -print0 2>/dev/null)

  if [[ ${#matches[@]} -eq 0 ]]; then
    echo "error: no behavior found matching '$name'" >&2
    echo "available behaviors:" >&2
    ls -1 "$behavior_root" 2>/dev/null | sed 's/^/  /' >&2
    exit 1
  fi

  if [[ ${#matches[@]} -gt 1 ]]; then
    echo "error: multiple behaviors match '$name'" >&2
    echo "matches:" >&2
    printf '  %s\n' "${matches[@]}" >&2
    exit 1
  fi

  echo "${matches[0]}"
}

# ────────────────────────────────────────────────────────────────────
# actions
# ────────────────────────────────────────────────────────────────────

action_get() {
  local branch
  branch=$(get_current_branch)
  local result
  result=$(get_bound_behavior "$branch")

  local behavior_dir
  behavior_dir=$(echo "$result" | jq -r '.behaviorDir // empty')

  if [[ -z "$behavior_dir" || "$behavior_dir" == "null" ]]; then
    echo "not bound"
  else
    # extract just the behavior name from the path
    local behavior_name
    behavior_name=$(basename "$behavior_dir")
    echo "bound to: $behavior_name"
  fi
}

action_set() {
  if [[ -z "$BEHAVIOR_NAME" ]]; then
    echo "error: --behavior is required with --set"
    exit 1
  fi

  local branch
  branch=$(get_current_branch)
  local flat_branch
  flat_branch=$(flatten_branch_name "$branch")

  # resolve the behavior directory
  local behavior_dir
  behavior_dir=$(resolve_behavior_dir "$BEHAVIOR_NAME")

  if [[ -z "$behavior_dir" ]]; then
    echo "error: .behavior/ directory not found"
    exit 1
  fi

  # check if already bound
  local result
  result=$(get_bound_behavior "$branch")
  local current_binding
  current_binding=$(echo "$result" | jq -r '.behaviorDir // empty')

  if [[ -n "$current_binding" && "$current_binding" != "null" ]]; then
    if [[ "$current_binding" == "$behavior_dir" ]]; then
      echo "✓ already bound to: $(basename "$behavior_dir")"
      return 0
    else
      echo "error: branch already bound to different behavior: $(basename "$current_binding")"
      echo ""
      echo "to rebind, first unbind with:"
      echo "  bind.behavior.sh --del"
      echo ""
      echo "or use a new worktree for the new behavior:"
      echo "  git worktree add ../<new-branch> -b <new-branch>"
      exit 1
    fi
  fi

  # create bind directory if needed
  local bind_dir="$behavior_dir/.bind"
  mkdir -p "$bind_dir"

  # create bind flag with metadata
  local flag_path="$bind_dir/${flat_branch}.flag"
  cat > "$flag_path" <<EOF
branch: $branch
bound_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
bound_by: bind.behavior skill
EOF

  echo "✓ bound branch '$branch' to: $(basename "$behavior_dir")"
}

action_del() {
  local branch
  branch=$(get_current_branch)
  local flat_branch
  flat_branch=$(flatten_branch_name "$branch")

  # check if bound
  local result
  result=$(get_bound_behavior "$branch")
  local current_binding
  current_binding=$(echo "$result" | jq -r '.behaviorDir // empty')

  if [[ -z "$current_binding" || "$current_binding" == "null" ]]; then
    echo "✓ no binding existed"
    return 0
  fi

  # remove the bind flag
  local flag_path="$current_binding/.bind/${flat_branch}.flag"
  if [[ -f "$flag_path" ]]; then
    rm "$flag_path"
  fi

  echo "✓ unbound branch '$branch' from: $(basename "$current_binding")"
}

# ────────────────────────────────────────────────────────────────────
# main
# ────────────────────────────────────────────────────────────────────

case "$ACTION" in
  get)
    action_get
    ;;
  set)
    action_set
    ;;
  del)
    action_del
    ;;
esac
