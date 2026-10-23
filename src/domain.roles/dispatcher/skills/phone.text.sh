#!/usr/bin/env bash
######################################################################
# .what = send a text to a peer clone, read this clone's thread, or withdraw a QUEUED text
#
# .why  = plain directed text between clones, both ways, with no pane keystroke
#         - a director texts its crew; the crew texts back
#         - every text a file on disk: ordered, delivered once, the audit trail
#         - the tree's daemon delivers it over `rhx clone say`, never --force
#
# usage:
#   phone.text.sh set --to phone://grove=local/tree=<tree>/clone=<clone> --what '...'
#   phone.text.sh set --to @:foreman --to @:mechanic --what @stdin
#   phone.text.sh set --to <address> --re 7f3e9a02 --what '...'
#   phone.text.sh get
#   phone.text.sh get --text 7f3e9a02
#   phone.text.sh del --text 7f3e9a02
#
# guarantee:
#   - runs only inside an enrolled clone; reads and writes that clone's mailbox alone
#   - a peer must be a contact, a clone in this tree, or a peer that texted first
#   - a group send admits every peer or none; each text returns QUEUED; the daemon is findserted
#   - a text holds at most 8000 chars; a longer one is refused, never cut
#   - a refusal exits 2 and names the fix
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild/cli').then(m => m.cli.phoneText())" -- "$@"
