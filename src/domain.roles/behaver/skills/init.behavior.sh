#!/usr/bin/env bash
######################################################################
# .what = initialize a .behavior directory for bhuild thoughtroute
#
# .why  = standardize the behavior-driven development thoughtroute
#         by scaffolding a structured directory with:
#           - wish definition
#           - vision statement
#           - blackbox criteria (user-facing behavioral requirements)
#           - blueprint criteria (implementation requirements)
#           - research prompts
#           - distillation prompts
#           - blueprint prompts
#           - roadmap prompts
#           - execution prompts
#           - feedback template
#
# .how  = creates .behavior/v${isodate}.${behaviorname}/ with
#         all necessary scaffold files for the bhuild thoughtroute
#
# usage:
#   init.bhuild.sh --name <behaviorname> [--dir <directory>]
#
# guarantee:
#   - creates .behavior/ if missing
#   - creates versioned behavior directory
#   - findserts all thoughtroute files (creates if missing, skips if exists)
#   - idempotent: safe to rerun
#   - fail-fast on errors
######################################################################

set -euo pipefail

# fail loud: print what failed
trap 'echo "❌ init.bhuild.sh failed at line $LINENO" >&2' ERR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# parse arguments
BEHAVIOR_NAME=""
TARGET_DIR="$PWD"
while [[ $# -gt 0 ]]; do
  case $1 in
    --name)
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
    *)
      echo "error: unknown argument '$1'"
      echo "usage: init.bhuild.sh --name <behaviorname> [--dir <directory>]"
      exit 1
      ;;
  esac
done

# validate required arguments
if [[ -z "$BEHAVIOR_NAME" ]]; then
  echo "error: --name is required"
  echo "usage: init.bhuild.sh --name <behaviorname> [--dir <directory>]"
  exit 1
fi

# ────────────────────────────────────────────────────────────────────
# binding check: fail fast if branch already bound to a behavior
# ────────────────────────────────────────────────────────────────────

get_bound_behavior() {
  npx tsx "$REPO_ROOT/src/domain.operations/behavior/bind/getBoundBehaviorByBranch.cli.ts" "$1" 2>/dev/null || echo '{"behaviorDir":null,"bindings":[]}'
}

flatten_branch_name() {
  local branch="$1"
  npx tsx "$REPO_ROOT/src/domain.operations/behavior/bind/flattenBranchName.cli.ts" "$branch"
}

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
BINDING_RESULT=$(get_bound_behavior "$CURRENT_BRANCH")
EXISTING_BEHAVIOR=$(echo "$BINDING_RESULT" | jq -r '.behaviorDir // empty')

if [[ -n "$EXISTING_BEHAVIOR" && "$EXISTING_BEHAVIOR" != "null" ]]; then
  echo "error: branch '$CURRENT_BRANCH' is already bound to: $(basename "$EXISTING_BEHAVIOR")"
  echo ""
  echo "to create a new behavior, use a new worktree:"
  echo "  git worktree add ../<new-dir> -b <new-branch>"
  echo "  cd ../<new-dir>"
  echo "  init.behavior.sh --name <new-behavior>"
  exit 1
fi

# ────────────────────────────────────────────────────────────────────
# behavior directory setup
# ────────────────────────────────────────────────────────────────────

# generate isodate in format YYYY_MM_DD
ISO_DATE=$(date +%Y_%m_%d)

# trim trailing .behavior from TARGET_DIR if present
TARGET_DIR="${TARGET_DIR%/.behavior}"
TARGET_DIR="${TARGET_DIR%.behavior}"

# construct behavior directory path (absolute)
BEHAVIOR_DIR="$TARGET_DIR/.behavior/v${ISO_DATE}.${BEHAVIOR_NAME}"

# compute relative path from caller's $PWD for file contents
BEHAVIOR_DIR_REL="$(realpath --relative-to="$PWD" "$TARGET_DIR")/.behavior/v${ISO_DATE}.${BEHAVIOR_NAME}"
# normalize: remove leading ./ if present
BEHAVIOR_DIR_REL="${BEHAVIOR_DIR_REL#./}"

# create behavior directory (idempotent)
mkdir -p "$BEHAVIOR_DIR"

# helper: findsert file (create if missing, skip if exists)
findsert() {
  local filepath="$1"
  if [[ -f "$filepath" ]]; then
    echo "   [KEEP] $(basename "$filepath")"
    return 0
  fi
  cat > "$filepath"
  echo "   [CREATE] $(basename "$filepath")"
}

# findsert 0.wish.md
findsert "$BEHAVIOR_DIR/0.wish.md" << 'EOF'
wish =

EOF

# findsert 1.vision.md
findsert "$BEHAVIOR_DIR/1.vision.md" << 'EOF'

EOF

# findsert 2.criteria.blackbox.md
findsert "$BEHAVIOR_DIR/2.criteria.blackbox.md" << 'EOF'
# usecase.1 = ...
given()
  when()
    then()
      sothat()
    then()
    then()
      sothat()
  when()
    then()

given()
  ...

# usecase.2 = ...
...
EOF

# findsert 2.criteria.blackbox.src
findsert "$BEHAVIOR_DIR/2.criteria.blackbox.src" << EOF
declare the blackbox criteria (experience bounds) required to fulfill
- this wish $BEHAVIOR_DIR_REL/0.wish.md
- this vision $BEHAVIOR_DIR_REL/1.vision.md (if declared)

via bdd declarations, per your briefs

via the template in $BEHAVIOR_DIR_REL/2.criteria.blackbox.md

emit into $BEHAVIOR_DIR_REL/2.criteria.blackbox.md

---

blackbox criteria = EXPERIENCE BOUNDS
- constraints on what users must experience
- if it's not needed for blackbox, it's not needed at all

declare ONLY:
- what inputs do users provide?
- what outputs do users receive?
- what usecases do users fulfill?
- what are the critical paths?
- what are the boundary/edge cases?

DO NOT include:
- mechanism details (what contracts/components exist)
- implementation details (how things are built)

note: blackbox is NOT "why to build" — that's the wish
      blackbox is "what experience must be delivered" to fulfill the wish

ensure to cover all experience bounds required to fulfill the wish and vision
EOF

# findsert 2.criteria.blueprint.md
findsert "$BEHAVIOR_DIR/2.criteria.blueprint.md" << 'EOF'
## blackbox criteria satisfied

- usecase.1 = ... ✓
- usecase.2 = ... ✓

## subcomponent contracts

given('componentName contract')
  then('exposes: methodName(input: Type) => ReturnType')
  then('throws ErrorType for invalid inputs')

given('anotherComponent contract')
  then('exposes: ...')

## composition boundaries

given('feature implementation')
  then('composes componentA and componentB')
  then('componentA provides X, componentB transforms to Y')

## test coverage criteria

given('feature')
  then('has unit tests for ...')
  then('has integration tests for ...')
  then('has acceptance test for full usecase')
EOF

# findsert 2.criteria.blueprint.src
findsert "$BEHAVIOR_DIR/2.criteria.blueprint.src" << EOF
declare the blueprint criteria (mechanism bounds) that satisfies the blackbox criteria

ref:
- blackbox criteria $BEHAVIOR_DIR_REL/2.criteria.blackbox.md
- wish $BEHAVIOR_DIR_REL/0.wish.md
- vision $BEHAVIOR_DIR_REL/1.vision.md (if declared)

via the template in $BEHAVIOR_DIR_REL/2.criteria.blueprint.md

emit into $BEHAVIOR_DIR_REL/2.criteria.blueprint.md

---

blueprint criteria = MECHANISM BOUNDS
- constraints on what contracts & composition must exist to deliver the experience
- this is OPTIONAL — not all behaviors need prescribed mechanism bounds

first, confirm which blackbox experience bounds will be satisfied

then, declare ONLY:
- what subcomponents are demanded by the wish, vision, or criteria.blackbox? and with what contracts and boundaries?
- how do subcomponents compose together?
- what integration boundaries exist?
- what test coverage is required?

DO NOT prescribe:
- internal implementation details of subcomponents
- how subcomponents achieve their contracts internally
- any subcomponents not explicitly demanded in the wish, vision, or criteria.blackbox

note: blueprint criteria is NOT "how to build" — that's decided in blueprint.md (3.3)
      blueprint criteria is "what mechanisms must exist" to deliver the experience

the HOW is discovered during research (3.1) and decided during blueprint (3.3)
EOF

# findsert 3.1.research.domain._.v1.src
findsert "$BEHAVIOR_DIR/3.1.research.domain._.v1.src" << EOF
research the domain available in order to fulfill
- this wish $BEHAVIOR_DIR_REL/0.wish.md
- this vision $BEHAVIOR_DIR_REL/1.vision.md (if declared)
- this criteria $BEHAVIOR_DIR_REL/2.criteria.blackbox.md (if declared)

specifically
- what are the domain objects that are involved with this wish
  - entities
  - events
  - literals
- what are the domain operations
  - getOne
  - getAll
  - setCreate
  - setUpdate
  - setDelete
- what are the relationships between the domain objects?
  - is there a treestruct of decoration?
  - is there a treestruct of common subdomains?
  - are there dependencies?
- how do the domain objects and operations compose to support wish?

---

use web search to discover and research
- cite every claim
- number each citation
- clone exact quotes from each citation

focus on these sdk's for reference, if provided
-

---

emit into $BEHAVIOR_DIR_REL/3.1.research.domain._.v1.i1.md
EOF

# findsert 3.2.distill.domain._.v1.src
findsert "$BEHAVIOR_DIR/3.2.distill.domain._.v1.src" << EOF
distill the declastruct domain.objects and domain.operations that would
- enable fulfillment of
  - this wish $BEHAVIOR_DIR_REL/0.wish.md
  - this vision $BEHAVIOR_DIR_REL/1.vision.md (if declared)
  - this criteria $BEHAVIOR_DIR_REL/2.criteria.blackbox.md (if declared)
- given the research declared here
  - $BEHAVIOR_DIR_REL/3.1.research.domain._.v1.i1.md (if declared)

procedure
1. declare the usecases and envision the contract that would be used to fulfill the usecases
2. declare the domain.objects, domain.operations, and access.daos that would fulfill this, via the declastruct pattern in this repo

emit into
- $BEHAVIOR_DIR_REL/3.2.distill.domain._.v1.i1.md
EOF

# findsert 3.3.blueprint.v1.src
findsert "$BEHAVIOR_DIR/3.3.blueprint.v1.src" << EOF
propose a blueprint for how we can implement the wish described
- in $BEHAVIOR_DIR_REL/0.wish.md

with the domain distillation declared
- in $BEHAVIOR_DIR_REL/3.2.distill.domain._.v1.i1.md (if declared)

follow the patterns already present in this repo

---

enforce thorough test coverage for proof of behavior satisfaction
- unit tests for all domain logic
- integration tests for all repo <-> access boundaries (os, apis, sdks, daos, etc)
- integration tests for all end <-> end flows
- acceptance tests for core blackbox behaviors

---

reference the below for full context
- $BEHAVIOR_DIR_REL/0.wish.md
- $BEHAVIOR_DIR_REL/1.vision.md (if declared)
- $BEHAVIOR_DIR_REL/2.criteria.blackbox.md (if declared)
- $BEHAVIOR_DIR_REL/2.criteria.blueprint.md (if declared)
- $BEHAVIOR_DIR_REL/3.1.research.domain._.v1.i1.md (if declared)
- $BEHAVIOR_DIR_REL/3.2.distill.domain._.v1.i1.md (if declared)

---

emit to $BEHAVIOR_DIR_REL/3.3.blueprint.v1.i1.md
EOF

# findsert 4.1.roadmap.v1.src
findsert "$BEHAVIOR_DIR/4.1.roadmap.v1.src" << EOF
declare a roadmap,

- checklist style
- with ordered dependencies
- with behavioral acceptance criteria
- with behavioral acceptance verification at each step

for how to execute the blueprint specified in $BEHAVIOR_DIR_REL/3.3.blueprint.v1.i1.md

ref:
- $BEHAVIOR_DIR_REL/0.wish.md
- $BEHAVIOR_DIR_REL/1.vision.md (if declared)
- $BEHAVIOR_DIR_REL/2.criteria.blackbox.md (if declared)
- $BEHAVIOR_DIR_REL/2.criteria.blueprint.md (if declared)
- $BEHAVIOR_DIR_REL/3.2.distill.domain._.v1.i1.md (if declared)
- $BEHAVIOR_DIR_REL/3.3.blueprint.v1.i1.md

---

emit into $BEHAVIOR_DIR_REL/4.1.roadmap.v1.i1.md
EOF

# findsert 5.1.execution.phase0_to_phaseN.v1.src
findsert "$BEHAVIOR_DIR/5.1.execution.phase0_to_phaseN.v1.src" << EOF
bootup your mechanic's role via \`npx rhachet roles boot --repo ehmpathy --role mechanic\`

then, start or continue to execute
- phase0 to phaseN
of roadmap
- $BEHAVIOR_DIR_REL/4.1.roadmap.v1.i1.md

ref:
- $BEHAVIOR_DIR_REL/0.wish.md
- $BEHAVIOR_DIR_REL/1.vision.md (if declared)
- $BEHAVIOR_DIR_REL/2.criteria.blackbox.md (if declared)
- $BEHAVIOR_DIR_REL/2.criteria.blueprint.md (if declared)
- $BEHAVIOR_DIR_REL/3.2.distill.domain._.v1.i1.md (if declared)
- $BEHAVIOR_DIR_REL/3.3.blueprint.v1.i1.md


---

track your progress

emit todos and check them off into
- $BEHAVIOR_DIR_REL/5.1.execution.phase0_to_phaseN.v1.i1.md
EOF

# findsert .ref.[feedback].v1.[given].by_human.md
findsert "$BEHAVIOR_DIR/.ref.[feedback].v1.[given].by_human.md" << EOF
emit your response to the feedback into
- $BEHAVIOR_DIR_REL/.ref.[feedback].v1.[taken].by_robot.md

1. emit your response checklist
2. exec your response plan
3. emit your response checkoffs into the checklist

---

first, bootup your mechanics briefs again

npx rhachet roles boot --repo ehmpathy --role mechanic

---
---
---


# blocker.1

---

# nitpick.2

---

# blocker.3
EOF

# ────────────────────────────────────────────────────────────────────
# auto-bind: bind current branch to newly created behavior
# ────────────────────────────────────────────────────────────────────

FLAT_BRANCH=$(flatten_branch_name "$CURRENT_BRANCH")
BIND_DIR="$BEHAVIOR_DIR/.bind"
mkdir -p "$BIND_DIR"

FLAG_PATH="$BIND_DIR/${FLAT_BRANCH}.flag"
cat > "$FLAG_PATH" <<BIND_EOF
branch: $CURRENT_BRANCH
bound_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
bound_by: init.behavior skill
BIND_EOF

echo ""
echo "behavior thoughtroute initialized!"
echo "   $BEHAVIOR_DIR"
echo ""
echo "branch '$CURRENT_BRANCH' bound to: v${ISO_DATE}.${BEHAVIOR_NAME}"
