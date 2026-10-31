#!/usr/bin/env bash
######################################################################
# .what = bring the current branch level with origin/main via a merge,
#         staged but NOT committed
#
# .why  = a pr that conflicts with main cannot be reviewed clean.
#         a rebase rewrites history and needs a force push; a merge
#         of origin/main is a plain push. the commit itself is left to
#         git.commit.set, so it rides the commit meter and carries the
#         seaturtle author that git.commit.push requires
#
# usage:
#   git.branch.merge.main.sh            # fetch + merge --no-commit; report
#   git.branch.merge.main.sh --status   # show merge state + conflicted files
#
# then:
#   settle any conflicts, rhx git.stage.add <files>, and conclude with
#   printf 'merge(main): ...\n\n- ...' | rhx git.commit.set -m @stdin --mode apply --push
#
# guarantee:
#   - never commits, never pushes, never force-pushes
#   - refuses on a dirty index or an open merge (exit 2)
#   - on conflict: exit 2, the merge stays open, conflicted files listed
#   - on main/master: refuses (exit 2)
######################################################################
set -euo pipefail

MODE=merge
while [[ $# -gt 0 ]]; do
  case $1 in
    # rhachet passes these; ignore them
    --skill|--repo|--role)
      shift 2
      ;;
    --status)
      MODE=status
      shift
      ;;
    --help|-h)
      sed -n '2,26p' "$0"
      exit 0
      ;;
    *)
      echo "✋ ConstraintError: unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

GIT_DIR_PATH=$(git rev-parse --git-dir)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# show the merge state and the conflicted files
print_status() {
  local conflicted
  conflicted=$(git diff --name-only --diff-filter=U)
  echo "🐚 git.branch.merge.main"
  echo "   ├─ branch: $BRANCH"
  if [[ -f "$GIT_DIR_PATH/MERGE_HEAD" ]]; then
    echo "   ├─ merge: open (origin/main $(git rev-parse --short "$(cat "$GIT_DIR_PATH/MERGE_HEAD")"))"
  else
    echo "   ├─ merge: none open"
  fi
  if [[ -z "$conflicted" ]]; then
    echo "   └─ conflicts: none"
    return 0
  fi
  echo "   └─ conflicts"
  local count i=0
  count=$(echo "$conflicted" | wc -l)
  while read -r f; do
    i=$((i + 1))
    if [[ $i -eq $count ]]; then echo "      └─ $f"; else echo "      ├─ $f"; fi
  done <<< "$conflicted"
}

if [[ "$MODE" == "status" ]]; then
  print_status
  exit 0
fi

# refuse on main, an open merge, or a dirty index
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  echo "✋ ConstraintError: on $BRANCH; this merges main INTO a feature branch" >&2
  exit 2
fi
if [[ -f "$GIT_DIR_PATH/MERGE_HEAD" ]]; then
  echo "✋ ConstraintError: a merge is already open; settle it, or see --status" >&2
  exit 2
fi
if ! git diff --cached --quiet; then
  echo "✋ ConstraintError: the index holds staged changes; commit or unstage them first" >&2
  exit 2
fi

# fetch, then merge without a commit
git fetch --quiet origin main
if git merge --no-commit --no-ff origin/main; then
  print_status
  echo ""
  echo "🥥 next: conclude via rhx git.commit.set -m @stdin --mode apply --push"
  exit 0
fi

# a conflict leaves the merge open to settle
print_status
echo ""
echo "✋ ConstraintError: conflicts; settle them, rhx git.stage.add them, then conclude via git.commit.set" >&2
exit 2