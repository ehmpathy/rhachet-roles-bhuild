#!/usr/bin/env bash
######################################################################
# .what = alias for radio.task.push
# .why  = set is a natural synonym for push (dao convention: get/set)
######################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/radio.task.push.sh" "$@"
