#!/usr/bin/env bash
######################################################################
# .what = create worktree in a repo
#
# .why  = enables worktree creation without permission prompts
#         via skill wrapper around git tree set
#
# usage:
#   rhx git.tree.set --into sandpine/rhachet-briefs-sandpine --name bert/case-refund-appeal
#   rhx git.tree.set --into ehmpathy/domain-objects --name bert/fix-deserialize
#
# args:
#   --into   org/repo path (e.g., sandpine/rhachet-briefs-sandpine)
#   --name   branch name to create (e.g., bert/case-refund-appeal)
#
# note:
#   --repo, --role, --skill are reserved by rhachet. use --into instead of --repo.
#
# guarantee:
#   - branches from main
#   - opens terminal in new worktree
#   - fail-fast on errors
######################################################################

set -euo pipefail

# parse args
into=""
name=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --into)
      into="$2"
      shift 2
      ;;
    --name)
      name="$2"
      shift 2
      ;;
    --repo|--role|--skill)
      # reserved by rhachet, ignore
      shift 2
      ;;

    # .why the header's OWN terminator, never a pinned line number: a literal
    #   bound goes stale the moment the header grows, and stays silent when it
    #   does — a false report about the file it lives in (git.crew.poll:477)
    --help|-h)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    *)
      # a bad flag is a CONSTRAINT, never a malfunction — see `git.tree.del`,
      # which has always exited 2 here (rule.require.exit-code-semantics)
      echo "error: unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

# validate
if [[ -z "$into" ]]; then
  echo "error: --into required" >&2
  exit 1
fi

if [[ -z "$name" ]]; then
  echo "error: --name required" >&2
  exit 1
fi

# build path
repo_path="$HOME/git/$into"

if [[ ! -d "$repo_path" ]]; then
  echo "error: repo not found: $repo_path" >&2
  exit 1
fi

# create worktree
cd "$repo_path"
git tree set --from main --open terminal --init "$name"
