#!/usr/bin/env bash
######################################################################
# .what = alias for radio.task.pull
# .why  = get is a natural synonym for pull (dao convention: get/set)
######################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/radio.task.pull.sh" "$@"
