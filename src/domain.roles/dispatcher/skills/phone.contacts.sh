#!/usr/bin/env bash
######################################################################
# .what = read, grant, or revoke the peers this clone may text
#
# .why  = a clone texts only a contact, a clone in its own tree, or a
#         peer that texted it first; contacts are per clone
#
# usage:
#   phone.contacts.sh get
#   phone.contacts.sh set --address phone://grove=local/tree=<tree>/clone=<clone>
#   phone.contacts.sh del --address phone://grove=local/tree=<tree>/clone=<clone>
#
# guarantee:
#   - changes the contacts of the clone that runs it, and no other
#   - set checks the peer's grove and tree exist; set and del are idempotent
#   - a clone's set or del needs its tree meter allowed (phone.contacts.uses),
#     else exit 2; a human may always set or del
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild/cli').then(m => m.cli.phoneContacts())" -- "$@"
