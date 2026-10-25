#!/usr/bin/env bash
######################################################################
# .what = read, amend, drop, and drain the records held for the radio
#
# .why  = a held push is never lost, and never stuck: one record that
#         faults is set aside, named, and the rest still deliver
#         - get:   what waits, each with its key, reason, and fix
#         - set:   amend a held record's auth or body (e.g. as-human)
#         - del:   drop a held record, its body and the why kept
#         - drain: deliver now, oldest first, past any set-aside record
#
# usage:
#   radio.task.queue.sh get                                 # what waits
#   radio.task.queue.sh get --when hook.onStop              # one-line stop reminder
#   radio.task.queue.sh set --key K --auth as-human         # amend one held record
#   radio.task.queue.sh del --key K --why "superseded"      # drop one, why kept
#   radio.task.queue.sh drain [--auth as-human]             # deliver now
#
# guarantee:
#   - get reads local records + radio.uses only; no network, no send
#   - set and del send naught, and never land mid-drain (drain lock)
#   - drain meets each record's radio.uses gate; exit 2 while any waits
#   - a rate limit or outage halts the drain; any other fault sets one aside
#   - hook.onStop never exits 2, so never blocks the stop
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild/cli').then(m => m.cli.radioTaskQueue())" -- "$@"
