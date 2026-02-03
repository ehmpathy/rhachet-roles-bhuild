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
#   radio.task.pull.sh --via os.fileops --list --status QUEUED
#   radio.task.pull.sh --via gh.issues --exid 123
#   radio.task.pull.sh --via os.fileops --title "fix flaky test"
#
# guarantee:
#   - validates required args (--via, --list or --exid/--title)
#   - auto-caches remote tasks locally for offline access
#   - fail-fast on errors
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.radioTaskPull())" -- "$@"
