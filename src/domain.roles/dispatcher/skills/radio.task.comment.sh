#!/usr/bin/env bash
######################################################################
# .what = comment on an extant task, issue, or pr through the radio
#
# .why  = a comment amends a thread without a rewrite of its body,
#         and rides the same gate as every push, so no github write
#         path sits beside radio.uses
#         - supports gh.issues and os.fileops channels
#         - posts once: an exact body already on the thread is kept
#
# usage:
#   radio.task.comment.sh --via gh.issues --into owner/repo --exid 489 --comment "..."
#   cat note.md | radio.task.comment.sh --via gh.issues --into @this --exid 489 --comment @stdin
#   radio.task.comment.sh --via os.fileops --into @this --exid 123 --comment "..."
#
# options:
#   --via       channel: gh.issues or os.fileops (required)
#   --into      target repo: @this (current git repo) or owner/name (required)
#   --exid      the task, issue, or pr number to comment on (required)
#   --comment   the comment body (required; use @stdin to read from pipe)
#   --auth      as-human | as-robot:via-keyrack(owner) | as-robot:env(VAR) | as-robot:shx(cmd)
#   --help, -h  show usage and exit
#
# guarantee:
#   - records every comment first, into $route/.radio/ (or .behavior/.radio/ if unbound)
#   - a comment that radio.uses blocks is held QUEUED (exit 2), never lost
#   - the next push or comment that gets through delivers the backlog, oldest first
#   - never touches a thread's body, title, or status
#   - radio.task.pull reads a task's title and body, not its comments;
#     a reader sees the comment on the thread itself
#   - refuses --title, --description, --status, and --idem upsert (exit 2)
#   - fail-fast on errors
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild/cli').then(m => m.cli.radioTaskComment())" -- "$@"
