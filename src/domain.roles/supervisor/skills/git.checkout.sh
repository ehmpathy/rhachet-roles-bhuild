#!/usr/bin/env bash
######################################################################
# .what = checkout branch in current repo
#
# .why  = enables branch checkout without permission prompts
#
# usage:
#   rhx git.checkout --branch main
#   rhx git.checkout --branch main --pull
#   rhx git.checkout --branch bert/2026-05-28 --create
#   rhx git.checkout --branch bert/2026-05-28 --create --from main
#
# args:
#   --branch   branch name to checkout
#   --create   create new branch (optional)
#   --from     base branch for new branch (default: main)
#   --pull     pull after checkout (optional)
#
# guarantee:
#   - fail-fast on errors
######################################################################

set -euo pipefail

# parse args
branch=""
create=false
from="main"
pull=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --branch)
      branch="$2"
      shift 2
      ;;
    --create)
      create=true
      shift
      ;;
    --from)
      from="$2"
      shift 2
      ;;
    --pull)
      pull=true
      shift
      ;;
    --skill|--repo|--role)
      # ignore - passed by rhx
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
      # a bad flag is a CONSTRAINT — the caller must fix it — never a
      # malfunction (rule.require.exit-code-semantics). `git.tree.del` has
      # always exited 2 here; the rest of the family said 1 until measured
      echo "error: unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

# validate
if [[ -z "$branch" ]]; then
  # an ABSENT required arg is the same CONSTRAINT as a bad one 8 lines up, and
  # it said 1 while its neighbour said 2 — the measured repair noted above
  # reached the `*)` arm and stopped there
  echo "error: --branch required" >&2
  exit 2
fi

# execute
if [[ "$create" == true ]]; then
  git checkout "$from"
  git pull
  git checkout -b "$branch"
  echo "created branch: $branch (from $from)"
else
  git checkout "$branch"
  if [[ "$pull" == true ]]; then
    git pull
    echo "checked out and pulled: $branch"
  else
    echo "checked out: $branch"
  fi
fi
