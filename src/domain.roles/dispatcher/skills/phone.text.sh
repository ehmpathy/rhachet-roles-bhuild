#!/usr/bin/env bash
######################################################################
# .what = send a text to a peer clone or a group, read this clone's thread, or withdraw a QUEUED text
#
# .why  = plain directed text between clones, both ways, with no pane keystroke
#         - every text a file on disk: ordered, delivered once, the audit trail
#         - set writes into the receiver's inbox; its tree's daemon says it over
#           `rhx clone say`, never --force; its stop hook tells it too
#
# usage:
#   phone.text.sh set --into phone://grove=local/tree=<tree>/clone=<clone> --what '...'
#   phone.text.sh set --into @:foreman --into @:mechanic --what @stdin
#   phone.text.sh set --into group:<id> --what '...'
#   phone.text.sh set --re 7f3e9a02 --what '...'     # re a group text: the whole group
#   phone.text.sh get [--text 7f3e9a02]
#   phone.text.sh del --text 7f3e9a02
#
# guarantee:
#   - runs only inside an enrolled clone
#   - a peer must be a contact, in this tree, a peer that texted first, or a group
#     mate via its group
#   - a group send admits every peer or none; each text returns QUEUED
#   - a peer on another grove is written through the grove connection
#   - a text holds at most 8000 chars; a longer one is refused, never cut
#   - a refusal exits 2 and names the fix
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild/cli').then(m => m.cli.phoneText())" -- "$@"
