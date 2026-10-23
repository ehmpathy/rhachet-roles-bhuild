#!/usr/bin/env bash
######################################################################
# .what = check, start, or stop this tree's phone daemon
#
# .why  = one daemon per tree delivers every clone's QUEUED texts over
#         `rhx clone say`; `phone.text set` starts it on its own
#
# usage:
#   phone.daemon.sh get     # is a daemon live here?
#   phone.daemon.sh set     # find the live daemon, or start one
#   phone.daemon.sh del     # stop it; no text is lost
#
# guarantee:
#   - one daemon per tree, held by a lock; a second start is a no-op
#   - the files are the queue: a stop or a crash loses no text
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild/cli').then(m => m.cli.phoneDaemon())" -- "$@"
