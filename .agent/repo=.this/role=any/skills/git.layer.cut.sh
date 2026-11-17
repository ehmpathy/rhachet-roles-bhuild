#!/usr/bin/env bash
######################################################################
# .what = cut a branch to a layer: every path the branch changed that
#         falls outside --keep is returned to its state on --base
#
# .why  = a pr past the review bar is split into a base layer and an
#         upper layer; the upper stays whole in history (the cut commit's
#         parent), so it can be replayed onto main after the base merges
#
# usage:
#   git.layer.cut.sh --keep '^src/access/' [--base origin/main]               # plan
#   git.layer.cut.sh --keep '^src/access/' [--base origin/main] --mode apply  # apply
#   git.layer.cut.sh --keep '^src/' --untrack .behavior/my-route/ --mode apply
#       # route files stay on disk, untracked; they leave the index only
#
# guarantee:
#   - only paths in `git diff --name-status <base> HEAD` are touched
#   - added outside --keep → removed; modified or deleted → base content
#   - plan mode by default; writes naught in plan
######################################################################
set -euo pipefail

KEEP=""
BASE="origin/main"
MODE="plan"
UNTRACK=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --skill|--repo|--role) shift 2 ;;
    --keep) KEEP="$2"; shift 2 ;;
    --base) BASE="$2"; shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    --untrack) UNTRACK="$2"; shift 2 ;;
    --help|-h) sed -n '2,19p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "✋ ConstraintError: unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$KEEP" ]]; then
  echo "✋ ConstraintError: --keep is required, e.g. --keep '^src/access/'" >&2
  exit 2
fi
if [[ "$MODE" != "plan" && "$MODE" != "apply" ]]; then
  echo "✋ ConstraintError: --mode must be plan or apply" >&2
  exit 2
fi

ROOT="$(git rev-parse --show-toplevel)"
KEPT=0
CUT=0
while IFS=$'\t' read -r STATUS FILE; do
  if [[ "$FILE" =~ $KEEP ]]; then
    KEPT=$((KEPT + 1))
    continue
  fi
  CUT=$((CUT + 1))
  echo "   ├─ ${STATUS} ${FILE}"
  [[ "$MODE" == "apply" ]] || continue
  # an added path under --untrack stays on disk (from HEAD) and leaves the index only
  if [[ "$STATUS" == "A" && -n "$UNTRACK" && "$FILE" == "$UNTRACK"* ]]; then
    mkdir -p "$(dirname "$ROOT/$FILE")"
    git show "HEAD:$FILE" > "$ROOT/$FILE"
    git rm --cached --quiet -- "$FILE"
    continue
  fi
  if [[ "$STATUS" == "A" ]]; then
    rm -f "$ROOT/$FILE"
    continue
  fi
  mkdir -p "$(dirname "$ROOT/$FILE")"
  git show "$BASE:$FILE" > "$ROOT/$FILE"
done < <(git diff --no-renames --name-status "$BASE" HEAD)

echo "   └─ kept ${KEPT}, cut ${CUT} (mode=${MODE})"
