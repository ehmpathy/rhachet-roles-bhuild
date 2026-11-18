#!/usr/bin/env bash
######################################################################
# .what = restore tracked paths in the worktree to their HEAD content
#
# .why  = a tree that must hold only what its pr carries sheds stray
#         edits and deletions; `git checkout`/`git restore` are not paved
#
# usage:
#   git.tree.restore.sh --path .gitignore --path .behavior/x/        # plan
#   git.tree.restore.sh --path .gitignore --mode apply               # apply
#
# guarantee:
#   - only paths HEAD tracks, under each --path, that differ are touched
#   - modified or deleted → HEAD content; untracked files are never touched
#   - a symlink is restored as a symlink, never flattened to a file
#   - the index is never touched
#   - plan mode by default; writes naught in plan
######################################################################
set -euo pipefail

PATHS=()
MODE="plan"
while [[ $# -gt 0 ]]; do
  case $1 in
    --skill|--repo|--role) shift 2 ;;
    --path) PATHS+=("$2"); shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    --help|-h) sed -n '2,18p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "✋ ConstraintError: unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [[ ${#PATHS[@]} -eq 0 ]]; then
  echo "✋ ConstraintError: --path is required, e.g. --path .gitignore" >&2
  exit 2
fi
if [[ "$MODE" != "plan" && "$MODE" != "apply" ]]; then
  echo "✋ ConstraintError: --mode must be plan or apply" >&2
  exit 2
fi

ROOT="$(git rev-parse --show-toplevel)"
COUNT=0
while IFS= read -r FILE; do
  [[ -n "$FILE" ]] || continue
  COUNT=$((COUNT + 1))
  echo "   ├─ ${FILE}"
  [[ "$MODE" == "apply" ]] || continue
  mkdir -p "$(dirname "$ROOT/$FILE")"

  # a symlink (mode 120000) stays a symlink, never a flat file
  OBJMODE="$(git -C "$ROOT" ls-tree HEAD -- "$FILE" | cut -d' ' -f1)"
  if [[ -z "$OBJMODE" ]]; then
    echo "💥 MalfunctionError: ${FILE} is absent at HEAD; naught written" >&2
    exit 1
  fi
  if [[ "$OBJMODE" == "120000" ]]; then
    rm -f "$ROOT/$FILE"
    ln -s "$(git -C "$ROOT" show "HEAD:$FILE")" "$ROOT/$FILE"
    continue
  fi
  git -C "$ROOT" show "HEAD:$FILE" > "$ROOT/$FILE"
done < <(git -C "$ROOT" diff --no-renames --name-only HEAD -- "${PATHS[@]}")

echo "   └─ restored ${COUNT} (mode=${MODE})"
