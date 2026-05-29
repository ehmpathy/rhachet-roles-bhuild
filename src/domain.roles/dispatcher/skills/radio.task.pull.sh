#!/usr/bin/env bash
######################################################################
# .what = pull tasks from a radio channel
#
# .why  = enables task discovery and retrieval from work queues
#         - supports gh.issues and os.fileops channels
#         - list all tasks or fetch specific by exid/title
#         - filter by status (QUEUED, CLAIMED, DELIVERED)
#         - auto-caches remote tasks to local .radio/
#
# usage:
#   radio.task.pull.sh --via gh.issues --list
#   radio.task.pull.sh --via gh.issues --from owner/repo --list
#   radio.task.pull.sh --via os.fileops --list --status QUEUED
#   radio.task.pull.sh --via gh.issues --exid 123
#   radio.task.pull.sh --via os.fileops --title "fix flaky test"
#
# options:
#   --via       channel: gh.issues or os.fileops (required)
#   --from      source repo as "owner/name" (default: current git repo)
#   --list      list all tasks
#   --exid      fetch specific task by external id
#   --title     fetch specific task by title
#   --status    filter by status: QUEUED, CLAIMED, DELIVERED
#   --limit     max number of tasks to return
#
# guarantee:
#   - validates required args (--via, --list or --exid/--title)
#   - auto-caches remote tasks locally for offline access
#   - fail-fast on errors
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.radioTaskPull())" -- "$@"
