#!/usr/bin/env bash
######################################################################
# .what = check, start, or stop this tree's phone daemon
#
# .why  = one daemon per tree says each text held for its clones over
#         `rhx clone say`; a sender's `phone.text set` wakes it
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
