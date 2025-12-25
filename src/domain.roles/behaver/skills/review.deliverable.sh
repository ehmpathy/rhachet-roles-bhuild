#!/usr/bin/env bash
######################################################################
# .what = review deliverable against behavior declarations
#
# .why  = enables automated and interactive review of implementation
#         against wish, vision, criteria, blueprint, or roadmap
#         declarations, producing structured feedback via claude code
#
# .how  = 1. resolve behavior directory from --for.behavior
#         2. resolve declaration file(s) from --against
#         3. build prompt with declaration path(s)
#         4. invoke claude code (interactive or non-interactive)
#         5. feedback emits to 7.1.review.behavior.per_{targets}.[feedback].[given].by_robot.v{timestamp}.md
#
# usage:
#   review.deliverable.sh --for.behavior <name> --against <target> [--interactive]
#
# examples:
#   review.deliverable.sh --for.behavior get-weather-emoji --against blueprint
#   review.deliverable.sh --for.behavior get-weather-emoji --against wish,vision,criteria
#   review.deliverable.sh --for.behavior get-weather-emoji --against blueprint --interactive
#
# guarantee:
#   - fail-fast if behavior not found or ambiguous
#   - fail-fast if declaration file(s) missing
#   - latest major version selected for versioned files (v3.i2 > v2.i3)
#   - idempotent: safe to rerun
######################################################################

set -euo pipefail

trap 'echo "review.deliverable.sh failed at line $LINENO"' ERR

# ────────────────────────────────────────────────────────────────────
# script location resolution
# ────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
AGAINST=""
INTERACTIVE=false
TARGET_DIR="$PWD"

while [[ $# -gt 0 ]]; do
  case $1 in
    --for.behavior)
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
    *)
      echo "error: unknown argument '$1'"
      echo "usage: review.deliverable.sh --for.behavior <name> --against <target> [--interactive]"
      exit 1
      ;;
  esac
done

# validate required arguments
if [[ -z "$BEHAVIOR_NAME" ]]; then
  echo "error: --for.behavior is required"
  exit 1
fi
if [[ -z "$AGAINST" ]]; then
  echo "error: --against is required (wish|vision|criteria|blueprint|roadmap or comma-separated)"
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
# declaration file resolution
# ────────────────────────────────────────────────────────────────────

# map target to filename pattern
get_target_file() {
  local target="$1"
  local behavior_dir="$2"
  local found

  case "$target" in
    wish|vision|criteria)
      # find file ending in .<target>.md (e.g., *.wish.md, *.vision.md, *.criteria.md)
      found=$(find "$behavior_dir" -maxdepth 1 -name "*.${target}.md" -print0 2>/dev/null \
        | head -z -n1 \
        | tr -d '\0')
      echo "${found:-$behavior_dir/*.${target}.md}"
      ;;
    blueprint|roadmap)
      # find latest major version: *.<target>.vN.iM.md
      found=$(find "$behavior_dir" -maxdepth 1 -name "*.${target}.v*.i*.md" -print0 2>/dev/null \
        | sort -zV -t'v' -k2 \
        | tail -z -n1 \
        | tr -d '\0')
      echo "${found:-$behavior_dir/*.${target}.v*.i*.md}"
      ;;
    *)
      echo ""
      ;;
  esac
}

# resolve all targets
IFS=',' read -ra TARGETS <<< "$AGAINST"
DECLARATION_FILES=()
TARGETS_SLUG=""

for target in "${TARGETS[@]}"; do
  target=$(echo "$target" | tr -d ' ')  # trim whitespace
  file=$(get_target_file "$target" "$BEHAVIOR_DIR")

  if [[ -z "$file" ]]; then
    echo "error: unknown target '$target'"
    echo "valid targets: wish, vision, criteria, blueprint, roadmap"
    exit 1
  fi

  if [[ ! -f "$file" ]]; then
    echo "error: declaration file not found for target '$target'"
    echo "expected: $file"
    exit 1
  fi

  DECLARATION_FILES+=("$file")

  # build slug for output filename
  if [[ -n "$TARGETS_SLUG" ]]; then
    TARGETS_SLUG="${TARGETS_SLUG}_${target}"
  else
    TARGETS_SLUG="$target"
  fi
done

# ────────────────────────────────────────────────────────────────────
# prompt construction
# ────────────────────────────────────────────────────────────────────

# build declaration paths for prompt (relative to TARGET_DIR where claude runs)
DECLARATION_PATHS=""
for file in "${DECLARATION_FILES[@]}"; do
  rel_path=$(realpath --relative-to="$TARGET_DIR" "$file")
  DECLARATION_PATHS="${DECLARATION_PATHS}- ${rel_path}\n"
done

# timestamp for output file and logs
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# output file path (relative to TARGET_DIR where claude runs)
OUTPUT_FILE="$BEHAVIOR_DIR/7.1.review.behavior.per_${TARGETS_SLUG}.[feedback].[given].by_robot.v${TIMESTAMP}.md"
OUTPUT_FILE_REL=$(realpath --relative-to="$TARGET_DIR" "$OUTPUT_FILE")

# feedback template path (relative to TARGET_DIR where claude runs)
TEMPLATE_FILE="$BEHAVIOR_DIR/.ref.[feedback].v1.[given].by_human.md"
TEMPLATE_FILE_REL=$(realpath --relative-to="$TARGET_DIR" "$TEMPLATE_FILE")

# build prompt (asks claude to output review to stdout, script writes to file)
PROMPT=$(cat <<EOF
# review.deliverable

you are reviewing the implementation deliverable against the following behavior declaration(s):

$(echo -e "$DECLARATION_PATHS")

## instructions

1. read each declaration file listed above
2. examine the implementation (git diff from main, staged changes, unstaged changes)
3. compare implementation against the declared behaviors
4. identify BLOCKERs (must fix before merge) and NITPICKs (suggestions, non-blocking)

## output format

output your review feedback directly to stdout (do NOT use any tools to write files).

follow the template structure in:
- $TEMPLATE_FILE_REL

start your output with:
# generated by: review.deliverable --for.behavior $BEHAVIOR_NAME --against $AGAINST

then list your findings as:
- # blocker.N = description
- # nitpick.N = description

with clear explanations for each finding.

## begin review

read the declaration files now and review the implementation. output review to stdout only.
EOF
)

# ────────────────────────────────────────────────────────────────────
# logging setup
# ────────────────────────────────────────────────────────────────────

LOG_DIR="$TARGET_DIR/.log/bhuild/review.deliverable/$TIMESTAMP"
mkdir -p "$LOG_DIR"
LOG_DIR_REL=$(realpath --relative-to="$PWD" "$LOG_DIR")

# emit input args
cat > "$LOG_DIR/input.args.json" <<ARGS_EOF
{
  "behavior_name": "$BEHAVIOR_NAME",
  "against": "$AGAINST",
  "interactive": $INTERACTIVE,
  "target_dir": "$TARGET_DIR",
  "behavior_dir": "$BEHAVIOR_DIR",
  "output_file": "$OUTPUT_FILE"
}
ARGS_EOF

# emit input prompt
echo "$PROMPT" > "$LOG_DIR/input.prompt.md"

# ────────────────────────────────────────────────────────────────────
# claude code invocation
# ────────────────────────────────────────────────────────────────────

if [[ "$INTERACTIVE" == "true" ]]; then
  echo ""
  echo "🔭 review.deliverable (interactive)"
  echo "├── behavior: $BEHAVIOR_DIR_REL"
  echo "├── against: $AGAINST"
  echo "├── prompt: $LOG_DIR_REL/input.prompt.md"
  echo "└── output: $OUTPUT_FILE_REL"
  echo ""

  # interactive mode: open claude code shell in target dir
  (cd "$TARGET_DIR" && "$CLAUDE_BIN" --print "$PROMPT")
else
  # show tree-structured status
  echo ""
  echo "🔭 review.deliverable"
  echo "├── behavior: $BEHAVIOR_DIR_REL"
  echo "├── against: $AGAINST"
  echo "├── prompt: $LOG_DIR_REL/input.prompt.md"
  echo "└── output: $OUTPUT_FILE_REL"
  echo ""

  # show spinner while claude runs
  echo -n "⏳ reviewing "
  (cd "$TARGET_DIR" && echo "$PROMPT" | "$CLAUDE_BIN" --print 2>&1) > "$LOG_DIR/output.response.md" &
  CLAUDE_PID=$!

  # spinner animation
  SPINNER="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
  ELAPSED=0
  while kill -0 $CLAUDE_PID 2>/dev/null; do
    for (( i=0; i<${#SPINNER}; i++ )); do
      if ! kill -0 $CLAUDE_PID 2>/dev/null; then break; fi
      echo -ne "\r⏳ reviewing ${SPINNER:$i:1} ${ELAPSED}s"
      sleep 0.1
    done
    ELAPSED=$((ELAPSED + 1))
  done

  wait $CLAUDE_PID
  CLAUDE_EXIT=$?

  # read output
  CLAUDE_OUTPUT=$(cat "$LOG_DIR/output.response.md")
  echo "{\"exit_code\": $CLAUDE_EXIT, \"elapsed_seconds\": $ELAPSED}" > "$LOG_DIR/output.response.json"

  echo ""
  if [[ $CLAUDE_EXIT -eq 0 ]]; then
    # write claude's output to the feedback file
    echo "$CLAUDE_OUTPUT" > "$OUTPUT_FILE"
    echo ""
    echo "✨ review complete (${ELAPSED}s)"
    echo "└── $OUTPUT_FILE_REL"
  else
    echo ""
    echo "⛈️ review failed (exit code: $CLAUDE_EXIT)"
    echo "└── see: $LOG_DIR_REL/output.response.md"
    exit $CLAUDE_EXIT
  fi
fi
