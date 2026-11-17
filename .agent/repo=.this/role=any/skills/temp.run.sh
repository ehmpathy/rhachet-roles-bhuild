#!/usr/bin/env bash
######################################################################
# .what = run one command with its cwd set to a dir inside @gitroot/.temp/
#
# .why  = a playtest walks a skill from a sandbox consumer repo, never
#         from this repo's root, so its records never land in a bound
#         route; a raw `cd` is not paved, so this is the paved hop
#
# usage:
#   temp.run.sh --dir playtest/repo -- git init
#   temp.run.sh --dir playtest/repo --env HOME=/abs/home -- bash ../comment.sh --help
#
# guarantee:
#   - --dir must land inside @gitroot/.temp/ (exit 2 otherwise)
#   - the dir is created if absent
#   - --env KEY=VALUE pairs are exported for the command only
#   - the command's own exit code is returned
######################################################################
set -euo pipefail

DIR=""
ENVS=()
while [[ $# -gt 0 ]]; do
  case $1 in
    --skill|--repo|--role) shift 2 ;;
    --dir) DIR="$2"; shift 2 ;;
    --env) ENVS+=("$2"); shift 2 ;;
    --) shift; break ;;
    --help|-h)
      sed -n '2,18p' "${BASH_SOURCE[0]}"
      exit 0
      ;;
    *) echo "✋ ConstraintError: unknown argument: $1; put the command after --" >&2; exit 2 ;;
  esac
done

if [[ -z "$DIR" ]]; then
  echo "✋ ConstraintError: --dir is required, e.g. --dir playtest/repo" >&2
  exit 2
fi
if [[ $# -eq 0 ]]; then
  echo "✋ ConstraintError: no command given; put it after --" >&2
  exit 2
fi

GITROOT="$(git rev-parse --show-toplevel)"
TEMP_ROOT="$GITROOT/.temp"
mkdir -p "$TEMP_ROOT"
# check the path before any dir is made, so a refused --dir leaves naught behind
TARGET="$(realpath -m "$TEMP_ROOT/$DIR")"
TEMP_REAL="$(realpath -m "$TEMP_ROOT")"
case "$TARGET/" in
  "$TEMP_REAL"/*) ;;
  *)
    echo "✋ ConstraintError: --dir $DIR lands at $TARGET, outside $TEMP_REAL" >&2
    exit 2
    ;;
esac

mkdir -p "$TARGET"
cd "$TARGET"
for pair in "${ENVS[@]}"; do export "${pair?}"; done
exec "$@"