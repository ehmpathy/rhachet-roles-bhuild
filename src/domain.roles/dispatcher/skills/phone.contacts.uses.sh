#!/usr/bin/env bash
######################################################################
# .what = the meter on whether this tree's clones may manage their own contacts
#
# .why  = who a clone may reach is the booter's call; a human lifts the
#         meter where a clone (a director) must grant its own contacts
#
# usage:
#   phone.contacts.uses.sh get
#   phone.contacts.uses.sh allow     # human only
#   phone.contacts.uses.sh block     # human only
#
# guarantee:
#   - state in .meter/phone.contacts.uses.jsonc; unset reads as blocked
#   - allow and block need a tty, or __I_AM_HUMAN=true; else exit 2
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild/cli').then(m => m.cli.phoneContactsUses())" -- "$@"
