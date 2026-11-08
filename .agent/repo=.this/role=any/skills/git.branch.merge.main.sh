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
      sed -n '2,25p' "$0"
      exit 0
      ;;
    *)
      echo "✋ ConstraintError: unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

GIT_DIR_PATH=$(git rev-parse --git-dir 2>/dev/null) || {
  echo "✋ ConstraintError: not a git repo — run this from inside the worktree to merge into" >&2
  exit 2
}
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
  print_tree_leaves "      " "$conflicted"
}

# .what = one tree branch per line of $2, under the indent $1; the last one closes the tree
print_tree_leaves() {
  awk -v indent="$1" 'NR > 1 { print indent "├─ " prior } { prior = $0 } END { if (NR > 0) print indent "└─ " prior }' <<<"$2"
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
# a detached HEAD has no branch to conclude the merge on
if [[ "$BRANCH" == "HEAD" ]]; then
  echo "✋ ConstraintError: HEAD is detached; this merges main INTO a feature branch" >&2
  echo "   └─ check out the feature branch first: git checkout <branch>" >&2
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
git fetch --quiet origin main || { echo "💥 MalfunctionError: git fetch origin main failed; see the git error above" >&2; exit 1; }
merge_rc=0
git merge --no-commit --no-ff origin/main || merge_rc=$?
if [[ $merge_rc -eq 0 && ! -f "$GIT_DIR_PATH/MERGE_HEAD" ]]; then
  # git opens no merge when the branch already holds origin/main
  echo "🐚 git.branch.merge.main"
  echo "   ├─ branch: $BRANCH"
  echo "   └─ already level with origin/main; naught to merge, naught owed"
  exit 0
fi
if [[ $merge_rc -eq 0 ]]; then
  print_status
  echo ""
  echo "🥥 next: conclude via rhx git.commit.set -m @stdin --mode apply --push"
  exit 0
fi

# a conflict leaves the merge open to settle; any other failure is no conflict
# .note = git exits 1 for both, so the open merge and its unmerged paths tell them apart
if [[ -f "$GIT_DIR_PATH/MERGE_HEAD" && -n "$(git diff --name-only --diff-filter=U)" ]]; then
  print_status
  echo ""
  echo "✋ ConstraintError: conflicts; settle them, rhx git.stage.add them, then conclude via git.commit.set" >&2
  exit 2
fi
echo "💥 MalfunctionError: git merge failed with no conflict to settle (exit $merge_rc); see the git error above" >&2
echo "   └─ e.g. an untracked file in the way: move it, then rerun" >&2
exit 1