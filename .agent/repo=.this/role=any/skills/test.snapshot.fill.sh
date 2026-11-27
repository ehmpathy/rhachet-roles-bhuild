#!/usr/bin/env bash
######################################################################
# .what = add one masked snapshot `then` to each `when` of a test file
#         whose `result` comes from a scene run and holds no snapshot yet
#
# .why  = contract-snapshot-exhaustiveness asks every caller-faced render
#         to be snapped; a review that names dozens of unsnapped cases is a
#         mechanical fill, so it is one call, never dozens of hand edits
#
# usage:
#   test.snapshot.fill.sh --file src/x/y.integration.test.ts
#
# guarantee:
#   - edits only the named file; parses it with the typescript AST
#   - a `when` is filled only if it holds `const result = useBeforeAll(...)`
#     whose body calls `<...>scene.run(...)`, and no `toMatchSnapshot` yet
#   - the snapshot masks through `<scene>.getMasked(result.out)`
#   - idempotent: a second run inserts naught
#   - then run the suite with --resnap, and again without, to prove it stable
######################################################################
set -euo pipefail

file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --file) file="$2"; shift 2 ;;
    # the header's own fence bounds the help, so a header that grows never truncates or spills it
    --help|-h)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    *) echo "✋ ConstraintError: unknown argument: $1" >&2; echo "   └─ fix: test.snapshot.fill.sh --file <path.test.ts>" >&2; exit 2 ;;
  esac
done

[[ -n "$file" ]] || { echo "✋ ConstraintError: --file is required" >&2; echo "   └─ fix: test.snapshot.fill.sh --file <path.test.ts>" >&2; exit 2; }
[[ -f "$file" ]] || { echo "✋ ConstraintError: no file at $file" >&2; echo "   └─ fix: pass a path from the repo root, e.g. --file src/x/y.integration.test.ts" >&2; exit 2; }

echo "🐢 sweet"
echo ""
echo "🐚 test.snapshot.fill --file $file"
node "$(dirname "${BASH_SOURCE[0]}")/test.snapshot.fill.js" "$file" | sed 's/^/   └─ /'
