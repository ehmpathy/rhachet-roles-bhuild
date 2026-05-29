#!/usr/bin/env bash
######################################################################
# .what = push a task to a radio channel
#
# .why  = enables task broadcast to distributed work queues
#         - supports gh.issues and os.fileops channels
#         - creates new tasks or updates via exid
#         - handles status transitions (QUEUED → CLAIMED → DELIVERED)
#         - idempotent via findsert/upsert modes
#
# usage:
#   radio.task.push.sh --via gh.issues --title "..." --description "..."
#   radio.task.push.sh --via gh.issues --into owner/repo --title "..." --description "..."
#   radio.task.push.sh --via os.fileops --exid 123 --status CLAIMED
#   radio.task.push.sh --via gh.issues --title "..." --idem upsert
#
# options:
#   --via       channel: gh.issues or os.fileops (required)
#   --into      target repo as "owner/name" (default: current git repo)
#   --title     task title (required for new tasks)
#   --description  task description
#   --exid      external id for updates
#   --status    task status: QUEUED, CLAIMED, DELIVERED
#   --idem      idempotency mode: findsert or upsert
#
# guarantee:
#   - validates required args (--via, --title/--description or --exid)
#   - enforces lifecycle order on status transitions
#   - creates backups on edit
#   - fail-fast on errors
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.radioTaskPush())" -- "$@"
