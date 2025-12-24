#!/usr/bin/env bash
######################################################################
# .what = review behavior artifacts against best practice rules
#
# .why  = enables automated review of behavior artifacts (wish, criteria,
#         blueprint, roadmap) against established rule briefs, producing
#         structured feedback via bhrain review skill
#
# .how  = 1. resolve behavior directory from --of argument
#         2. determine artifacts to review from --against (default: all)
#         3. invoke bhrain review for each artifact type
#         4. aggregate feedback into summary output
#
# usage:
#   review.behavior.sh --of <behavior-name> [--against <targets>] [--interactive]
#
# examples:
#   review.behavior.sh --of say-hello
#   review.behavior.sh --of say-hello --against criteria,blueprint
#   review.behavior.sh --of say-hello --interactive
#
# guarantee:
#   - fail-fast if behavior not found or ambiguous
#   - fail-fast if artifact file is absent
#   - idempotent: safe to rerun
######################################################################

set -euo pipefail

trap 'echo "review.behavior.sh failed at line $LINENO"' ERR

# ────────────────────────────────────────────────────────────────────
# script location resolution
# ────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRIEFS_DIR="$SCRIPT_DIR/../briefs/practices"

# resolve claude binary (prefer global, fallback to local node_modules)
CLAUDE_BIN=""
if command -v claude >/dev/null 2>&1; then
  CLAUDE_BIN="claude"
else
  NPM_BIN_DIR="$(cd "$SCRIPT_DIR" && npm bin 2>/dev/null || echo "")"
  if [[ -n "$NPM_BIN_DIR" && -x "$NPM_BIN_DIR/claude" ]]; then
    CLAUDE_BIN="$NPM_BIN_DIR/claude"
  else
    echo "error: claude binary not found (install @anthropic-ai/claude-code or ensure claude is in PATH)"
    exit 1
  fi
fi

# ────────────────────────────────────────────────────────────────────
# argument parsing
# ────────────────────────────────────────────────────────────────────

BEHAVIOR_NAME=""
AGAINST="wish,criteria,blueprint,roadmap"
INTERACTIVE=false
TARGET_DIR="$PWD"

while [[ $# -gt 0 ]]; do
  case $1 in
    --of)
      BEHAVIOR_NAME="$2"
      shift 2
      ;;
    --against)
      AGAINST="$2"
      shift 2
      ;;
    --interactive)
      INTERACTIVE=true
      shift
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
      echo "usage: review.behavior.sh --of <behavior-name> [--against <targets>] [--interactive]"
      echo ""
      echo "options:"
      echo "  --of <name>       behavior name to review (required)"
      echo "  --against <list>  comma-separated targets: wish,criteria,blueprint,roadmap (default: all)"
      echo "  --interactive     run in interactive mode"
      echo "  --dir <path>      target directory (default: current directory)"
      exit 0
      ;;
    *)
      echo "error: unknown argument '$1'"
      echo "usage: review.behavior.sh --of <behavior-name> [--against <targets>] [--interactive]"
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

# find matching behavior directories
MATCHES=()
while IFS= read -r -d '' dir; do
  MATCHES+=("$dir")
done < <(find "$BEHAVIOR_ROOT" -maxdepth 1 -type d -name "*${BEHAVIOR_NAME}*" -print0 2>/dev/null)

if [[ ${#MATCHES[@]} -eq 0 ]]; then
  echo "error: no behavior found matching '$BEHAVIOR_NAME'"
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
# artifact file resolution
# ────────────────────────────────────────────────────────────────────

# map target to filename pattern and rules path
get_artifact_info() {
  local target="$1"
  local behavior_dir="$2"
  local found_file
  local rules_dir

  case "$target" in
    wish)
      found_file=$(find "$behavior_dir" -maxdepth 1 -name "*.wish.md" -print0 2>/dev/null \
        | head -z -n1 \
        | tr -d '\0')
      rules_dir="$BRIEFS_DIR/behavior.wish"
      ;;
    criteria)
      found_file=$(find "$behavior_dir" -maxdepth 1 -name "*.criteria.md" -print0 2>/dev/null \
        | head -z -n1 \
        | tr -d '\0')
      rules_dir="$BRIEFS_DIR/behavior.criteria"
      ;;
    blueprint)
      # find latest version: *.blueprint.vN.iM.md
      found_file=$(find "$behavior_dir" -maxdepth 1 -name "*.blueprint.v*.i*.md" -print0 2>/dev/null \
        | sort -zV -t'v' -k2 \
        | tail -z -n1 \
        | tr -d '\0')
      rules_dir="$BRIEFS_DIR/behavior.blueprint"
      ;;
    roadmap)
      # find latest version: *.roadmap.vN.iM.md
      found_file=$(find "$behavior_dir" -maxdepth 1 -name "*.roadmap.v*.i*.md" -print0 2>/dev/null \
        | sort -zV -t'v' -k2 \
        | tail -z -n1 \
        | tr -d '\0')
      rules_dir="$BRIEFS_DIR/behavior.roadmap"
      ;;
    *)
      echo ""
      return
      ;;
  esac

  echo "${found_file:-}|${rules_dir:-}"
}

# ────────────────────────────────────────────────────────────────────
# log setup
# ────────────────────────────────────────────────────────────────────

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$TARGET_DIR/.log/bhuild/review.behavior/$TIMESTAMP"
mkdir -p "$LOG_DIR"
LOG_DIR_REL=$(realpath --relative-to="$PWD" "$LOG_DIR")

# emit input args
cat > "$LOG_DIR/input.args.json" <<ARGS_EOF
{
  "behavior_name": "$BEHAVIOR_NAME",
  "against": "$AGAINST",
  "interactive": $INTERACTIVE,
  "target_dir": "$TARGET_DIR",
  "behavior_dir": "$BEHAVIOR_DIR"
}
ARGS_EOF

# ────────────────────────────────────────────────────────────────────
# review invocation
# ────────────────────────────────────────────────────────────────────

# show tree-structured status
echo ""
echo "🔭 review.behavior"
echo "├── behavior: $BEHAVIOR_DIR_REL"
echo "├── against: $AGAINST"
echo "└── log: $LOG_DIR_REL"
echo ""

# parse targets
IFS=',' read -ra TARGETS <<< "$AGAINST"
BLOCKERS=()
NITPICKS=()
REVIEWED_COUNT=0
SKIPPED_COUNT=0

for target in "${TARGETS[@]}"; do
  target=$(echo "$target" | tr -d ' ')  # trim whitespace

  # get artifact info
  artifact_info=$(get_artifact_info "$target" "$BEHAVIOR_DIR")
  artifact_file=$(echo "$artifact_info" | cut -d'|' -f1)
  rules_dir=$(echo "$artifact_info" | cut -d'|' -f2)

  if [[ -z "$rules_dir" ]]; then
    echo "⚠️  unknown target '$target', skipping"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi

  if [[ ! -d "$rules_dir" ]]; then
    echo "⚠️  rules directory not found for '$target': $rules_dir"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi

  if [[ -z "$artifact_file" || ! -f "$artifact_file" ]]; then
    echo "error: artifact not found for '$target' in $BEHAVIOR_DIR"
    exit 1
  fi

  artifact_file_rel=$(realpath --relative-to="$TARGET_DIR" "$artifact_file")

  # output file path
  artifact_basename=$(basename "$artifact_file" .md)
  output_file="$BEHAVIOR_DIR/${artifact_basename}.[feedback].[given].by_robot.v${TIMESTAMP}.md"
  output_file_rel=$(realpath --relative-to="$TARGET_DIR" "$output_file")

  # get relative path for display
  rules_dir_rel=$(realpath --relative-to="$TARGET_DIR" "$rules_dir")

  echo "├── reviewing $target..."
  echo "│   ├── artifact: $artifact_file_rel"
  echo "│   ├── rules: $rules_dir_rel/rule.*.md"
  echo "│   └── output: $output_file_rel"

  # collect rule files and their content
  RULE_FILES=$(find "$rules_dir" -name "rule.*.md" -type f | sort)
  RULES_CONTENT=""
  while IFS= read -r rule_file; do
    rule_name=$(basename "$rule_file")
    rule_content=$(cat "$rule_file")
    RULES_CONTENT="${RULES_CONTENT}### ${rule_name}\n\n${rule_content}\n\n"
  done <<< "$RULE_FILES"

  # build prompt for bhrain review (with inlined rule content)
  PROMPT=$(cat <<EOF
# review.behavior: $target

you are reviewing a behavior artifact against best practice rules.

## artifact to review
- $artifact_file_rel

## rules to apply

$(echo -e "$RULES_CONTENT")

## instructions

1. read the artifact file
2. evaluate the artifact against each rule shown above
3. identify BLOCKERs (must fix) and NITPICKs (suggestions)

## output format

output your review feedback directly to stdout.

start with:
# review: $target

then list findings as:
- # blocker.N = description
- # nitpick.N = description

with clear explanations referencing the specific rules.

## begin review

read the artifact file now and output review to stdout only.
EOF
)

  # save prompt to log
  echo "$PROMPT" > "$LOG_DIR/prompt.$target.md"

  if [[ "$INTERACTIVE" == "true" ]]; then
    # interactive mode: run claude and show output
    (cd "$TARGET_DIR" && "$CLAUDE_BIN" --print "$PROMPT") | tee "$output_file"
  else
    # non-interactive: run with spinner
    echo -n "│   ⏳ "
    (cd "$TARGET_DIR" && echo "$PROMPT" | "$CLAUDE_BIN" --print 2>&1) > "$LOG_DIR/output.$target.md" &
    CLAUDE_PID=$!

    # spinner animation
    SPINNER="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    ELAPSED=0
    while kill -0 $CLAUDE_PID 2>/dev/null; do
      for (( i=0; i<${#SPINNER}; i++ )); do
        if ! kill -0 $CLAUDE_PID 2>/dev/null; then break; fi
        echo -ne "\r│   ⏳ ${SPINNER:$i:1} ${ELAPSED}s"
        sleep 0.1
      done
      ELAPSED=$((ELAPSED + 1))
    done

    wait $CLAUDE_PID
    CLAUDE_EXIT=$?

    echo -e "\r│   ✓ complete (${ELAPSED}s)   "

    if [[ $CLAUDE_EXIT -eq 0 ]]; then
      # copy output to feedback file
      cp "$LOG_DIR/output.$target.md" "$output_file"

      # extract blockers and nitpicks
      while IFS= read -r line; do
        BLOCKERS+=("[$target] $line")
      done < <(grep -i "^# blocker" "$output_file" 2>/dev/null || true)

      while IFS= read -r line; do
        NITPICKS+=("[$target] $line")
      done < <(grep -i "^# nitpick" "$output_file" 2>/dev/null || true)
    else
      echo "│   ⛈️ review failed (exit code: $CLAUDE_EXIT)"
    fi
  fi

  REVIEWED_COUNT=$((REVIEWED_COUNT + 1))
done

# ────────────────────────────────────────────────────────────────────
# summary output
# ────────────────────────────────────────────────────────────────────

echo ""
echo "────────────────────────────────────────"
echo "🌿 summary"
echo "├── reviewed: $REVIEWED_COUNT"
echo "├── skipped: $SKIPPED_COUNT"
echo "├── blockers: ${#BLOCKERS[@]}"
echo "└── nitpicks: ${#NITPICKS[@]}"

if [[ ${#BLOCKERS[@]} -gt 0 ]]; then
  echo ""
  echo "⛈️ blockers:"
  for b in "${BLOCKERS[@]}"; do
    echo "  - $b"
  done
fi

if [[ ${#NITPICKS[@]} -gt 0 ]]; then
  echo ""
  echo "🌊 nitpicks:"
  for n in "${NITPICKS[@]}"; do
    echo "  - $n"
  done
fi

echo ""
echo "✨ review.behavior complete"
echo "└── log: $LOG_DIR_REL"
